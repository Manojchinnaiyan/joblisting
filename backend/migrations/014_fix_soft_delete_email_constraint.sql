-- Migration: Fix soft delete email constraint
-- This allows users to re-register with the same email after being soft-deleted

-- Drop the existing unique constraint on email
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Create a partial unique index that only applies to non-deleted users
-- This allows soft-deleted users to have the same email as new registrations
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_active ON users(email) WHERE deleted_at IS NULL;
