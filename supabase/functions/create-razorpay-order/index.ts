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
    const { amount, currency, planId, planName, userEmail } = await req.json()

    // Validate required fields
    if (!amount || !currency || !planId || !planName || !userEmail) {
      throw new Error('Missing required fields: amount, currency, planId, planName, userEmail')
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID'),
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET'),
    })

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount, // Amount in paise
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        planId: planId,
        planName: planName,
        userEmail: userEmail,
      },
    })

    // Log the order creation
    console.log('Razorpay order created:', order.id)

    return new Response(
      JSON.stringify({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Razorpay SDK class (simplified version)
class Razorpay {
  private keyId: string
  private keySecret: string

  constructor(config: { key_id: string; key_secret: string }) {
    this.keyId = config.key_id
    this.keySecret = config.key_secret
  }

  get orders() {
    return {
      create: async (orderData: any) => {
        const response = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${this.keyId}:${this.keySecret}`)}`,
          },
          body: JSON.stringify(orderData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error.description || 'Failed to create order')
        }

        return await response.json()
      }
    }
  }
} 