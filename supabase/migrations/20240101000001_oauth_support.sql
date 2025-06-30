-- Migration: Add OAuth support to candidate_profiles table
-- Date: 2024-01-01

-- Add OAuth-related columns to candidate_profiles table
ALTER TABLE candidate_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email';

-- Create or replace function to handle new user registration (including OAuth)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has a candidate profile
  IF NOT EXISTS (SELECT 1 FROM candidate_profiles WHERE id = NEW.id) THEN
    INSERT INTO candidate_profiles (
      id,
      full_name,
      email,
      phone,
      avatar_url,
      provider,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'name', 
        split_part(NEW.email, '@', 1)
      ),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'avatar_url',
      COALESCE(NEW.raw_app_meta_data->>'provider', 'oauth'),
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create index for better performance on provider lookups
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_provider ON candidate_profiles(provider);

-- Create index for avatar_url lookups
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_avatar_url ON candidate_profiles(avatar_url);

-- Add comments to document the new columns
COMMENT ON COLUMN candidate_profiles.avatar_url IS 'Profile picture URL from OAuth provider';
COMMENT ON COLUMN candidate_profiles.provider IS 'Authentication provider (email, google, linkedin, etc.)'; 