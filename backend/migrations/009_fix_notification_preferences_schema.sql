-- Migration: Fix notification_preferences schema to match Go model
-- The Go model has more specific notification preferences

-- First, add missing columns for the new notification preference structure
-- Using IF NOT EXISTS pattern for idempotent migrations

-- Email notification preferences
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS email_application_status BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS email_new_application BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS email_new_job BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS email_job_expiring BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS email_profile_viewed BOOLEAN DEFAULT FALSE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS email_company_review BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS email_team_invitation BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS email_job_moderation BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS email_company_verification BOOLEAN DEFAULT TRUE;

-- In-app notification preferences
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS app_application_status BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS app_new_application BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS app_new_job BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS app_job_expiring BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS app_profile_viewed BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS app_company_review BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS app_team_invitation BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS app_job_moderation BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS app_company_verification BOOLEAN DEFAULT TRUE;

-- Note: We keep the old columns for backwards compatibility
-- They can be removed in a future migration after verification

SELECT 'notification_preferences schema updated successfully' as status;
