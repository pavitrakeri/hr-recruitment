# Razorpay Integration Guide

This guide explains how to set up and use Razorpay payment integration in the candidate-voice-hire application.

## Overview

The application now supports dual payment methods:
- **Stripe**: For international payments (USD)
- **Razorpay**: For Indian payments (INR)

## Setup Instructions

### 1. Razorpay Account Setup

1. Create a Razorpay account at [razorpay.com](https://razorpay.com)
2. Complete KYC verification
3. Get your API keys from the Razorpay Dashboard:
   - Key ID (public key)
   - Key Secret (private key)

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id_here
```

### 3. Supabase Edge Functions Setup

#### Deploy the Edge Functions

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Set environment variables for Edge Functions:
```bash
supabase secrets set RAZORPAY_KEY_ID=your_razorpay_key_id_here
supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_secret_key_here
```

5. Deploy the functions:
```bash
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

### 4. Database Setup

Ensure your database has the required tables:

```sql
-- Subscription Plans Table
CREATE TABLE subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  job_limit INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  features TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Subscriptions Table
CREATE TABLE user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample plans
INSERT INTO subscription_plans (name, job_limit, price, features) VALUES
('Free', 1, 0.00, ARRAY['Basic job posting', 'Email support']),
('Pro', 10, 29.99, ARRAY['10 job postings', 'Priority support', 'Analytics dashboard']),
('Business', 50, 99.99, ARRAY['50 job postings', 'Priority support', 'Analytics dashboard', 'Custom branding']);
```

## How It Works

### 1. Payment Flow

1. **User selects a plan**: User chooses between Stripe and Razorpay payment methods
2. **Order creation**: Frontend calls `create-razorpay-order` Edge Function
3. **Payment initiation**: Razorpay checkout modal opens
4. **Payment processing**: User completes payment on Razorpay
5. **Payment verification**: Frontend calls `verify-razorpay-payment` Edge Function
6. **Subscription activation**: User subscription is activated in database

### 2. Security Features

- **Signature verification**: All payments are verified using HMAC-SHA256
- **Server-side validation**: All critical operations happen on the server
- **Environment variables**: Sensitive keys are stored securely

### 3. Error Handling

- **Payment failures**: Users are notified with clear error messages
- **Network issues**: Graceful fallbacks and retry mechanisms
- **Invalid payments**: Signature verification prevents fraud

## Usage

### For Users

1. Navigate to the Subscription Manager
2. Choose your preferred payment method (Stripe or Razorpay)
3. Select a plan
4. Complete payment
5. Subscription is activated immediately

### For Developers

#### Using the Razorpay Hook

```typescript
import { useRazorpay } from '@/hooks/useRazorpay';

const { initiatePayment, loading } = useRazorpay();

const handlePayment = async (plan) => {
  await initiatePayment(plan, userEmail, async (planId) => {
    // Handle successful payment
    await createSubscription(planId);
  });
};
```

#### Customizing Payment Options

```typescript
const options = {
  key: 'your_razorpay_key',
  amount: 299900, // Amount in paise
  currency: 'INR',
  name: 'Your Company',
  description: 'Subscription Payment',
  order_id: 'order_id',
  handler: (response) => {
    // Handle payment success
  },
  prefill: {
    email: 'user@example.com',
    contact: '9999999999'
  },
  theme: {
    color: '#6366f1'
  }
};
```

## Testing

### Test Mode

1. Use Razorpay test keys for development
2. Test with these card numbers:
   - **Success**: 4111 1111 1111 1111
   - **Failure**: 4000 0000 0000 0002

### Production Mode

1. Switch to live Razorpay keys
2. Ensure proper error handling
3. Monitor payment logs

## Troubleshooting

### Common Issues

1. **"Payment signature verification failed"**
   - Check if RAZORPAY_KEY_SECRET is set correctly
   - Verify the signature calculation

2. **"Could not create payment order"**
   - Check Razorpay API keys
   - Verify Edge Function deployment

3. **"User not found"**
   - Ensure user exists in profiles table
   - Check email matching

### Debug Mode

Enable debug logging in Edge Functions:

```typescript
console.log('Debug info:', { orderId, amount, currency });
```

## Security Best Practices

1. **Never expose secret keys** in client-side code
2. **Always verify signatures** on the server
3. **Use HTTPS** in production
4. **Monitor payment logs** regularly
5. **Implement rate limiting** for API calls

## Support

For issues related to:
- **Razorpay API**: Contact Razorpay support
- **Application integration**: Check the code documentation
- **Database issues**: Review Supabase logs

## Additional Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Payment Security Best Practices](https://razorpay.com/docs/payments/security/) 