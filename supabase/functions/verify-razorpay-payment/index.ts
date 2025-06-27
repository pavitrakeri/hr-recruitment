import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      planId, 
      userEmail 
    } = await req.json()

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId || !userEmail) {
      throw new Error('Missing required fields for payment verification')
    }

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')
    
    if (!secret) {
      throw new Error('Razorpay secret key not configured')
    }

    const crypto = await import('https://deno.land/std@0.168.0/crypto/mod.ts')
    const encoder = new TextEncoder()
    const key = encoder.encode(secret)
    const message = encoder.encode(text)
    
    const hmacKey = await crypto.crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.crypto.subtle.sign('HMAC', hmacKey, message)
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Payment signature verification failed')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user by email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (userError || !userData) {
      throw new Error('User not found')
    }

    // Get plan details
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !planData) {
      throw new Error('Plan not found')
    }

    // Cancel all other active subscriptions for this user before updating/creating
    await supabase
      .from('user_subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userData.id)
      .eq('status', 'active');

    // Calculate subscription period
    const now = new Date()
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Create new subscription
    const { error: insertError } = await supabase
      .from('user_subscriptions')
      .insert([{
        user_id: userData.id,
        plan_id: planId,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      }])

    if (insertError) {
      throw new Error('Failed to create subscription')
    }

    // Log payment verification
    console.log('Payment verified successfully:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      userId: userData.id,
      planId: planId,
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and subscription activated',
        userId: userData.id,
        planId: planId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error verifying payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 