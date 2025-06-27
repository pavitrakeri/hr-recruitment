# Quick Setup Guide - Razorpay Integration

## 🚀 Fast Setup (5 minutes)

### 1. Create .env file
Create a `.env` file in your project root:

```env
VITE_RAZORPAY_KEY_ID=rzp_live_4WqGTiMVOeRP5m
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Install Supabase CLI
```bash
npm install -g supabase
```

### 3. Login to Supabase
```bash
supabase login
```

### 4. Link your project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 5. Set environment variables
```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_live_4WqGTiMVOeRP5m
supabase secrets set RAZORPAY_KEY_SECRET=iNH0uFLw1k7QLI3bS3pHAnnS
supabase secrets set SUPABASE_URL=your_supabase_url_here
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 6. Deploy Edge Functions
```bash
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
supabase functions deploy test-razorpay
```

### 7. Set up database
```bash
supabase db push
```

### 8. Test the integration
1. Start your development server: `npm run dev`
2. Go to Subscription Manager
3. Select Razorpay as payment method
4. Choose "Test Plan" for ₹1
5. Complete the payment

## 🔧 Troubleshooting

### CORS Errors
If you see CORS errors, make sure:
- Edge Functions are deployed
- Environment variables are set correctly
- You're using the correct Supabase project

### "Function not found" errors
Run these commands:
```bash
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

### Database errors
Run this command:
```bash
supabase db push
```

## 🧪 Testing

### Test Plan Details
- **Name**: Test Plan
- **Price**: ₹1 (0.01 USD)
- **Job Limit**: 5 job postings
- **Features**: Basic support, test plan for ₹1

### Test Cards (if using test mode)
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure Edge Functions are deployed
4. Check Supabase logs for backend errors

## 🎯 What's Included

✅ Razorpay script in HTML
✅ useRazorpay hook
✅ Updated SubscriptionManager with payment method selection
✅ Edge Functions for order creation and payment verification
✅ Test function for debugging
✅ Database migration with test plan
✅ Currency conversion utilities
✅ Comprehensive error handling
✅ CORS configuration
✅ PowerShell deployment script 