-- Subscription Plans Table (if not exists)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  job_limit INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  features TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Subscriptions Table (if not exists)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample plans (if not exists)
INSERT INTO subscription_plans (name, job_limit, price, features) 
VALUES 
  ('Free', 1, 0.00, ARRAY['Basic job posting', 'Email support']),
  ('Test Plan', 5, 0.01, ARRAY['5 job postings', 'Test plan for ₹1', 'Basic support']),
  ('Pro', 10, 29.99, ARRAY['10 job postings', 'Priority support', 'Analytics dashboard']),
  ('Business', 50, 99.99, ARRAY['50 job postings', 'Priority support', 'Analytics dashboard', 'Custom branding'])
ON CONFLICT (name) DO NOTHING; 