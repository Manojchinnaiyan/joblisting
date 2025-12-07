-- Migration: Add last_active column to user_profiles
-- This column tracks when the user was last active on the platform

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP;

-- Create index for efficient querying of recently active users
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active ON user_profiles(last_active);

-- Update existing profiles to set last_active to their updated_at time
UPDATE user_profiles
SET last_active = updated_at
WHERE last_active IS NULL;
