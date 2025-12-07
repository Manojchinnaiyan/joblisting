-- Migration: Add is_read column to notifications table if missing
-- This fixes the issue where the notifications table exists but is missing the is_read column

-- Add is_read column if it doesn't exist
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Add read_at column if it doesn't exist
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Create index for performance on unread notifications query
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);

SELECT 'Added is_read column to notifications table' as status;
