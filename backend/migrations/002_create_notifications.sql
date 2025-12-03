-- Notification types enum
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'APPLICATION_STATUS_CHANGE',
        'NEW_APPLICATION',
        'NEW_JOB_FROM_FOLLOWED_COMPANY',
        'JOB_EXPIRING_SOON',
        'PROFILE_VIEWED',
        'COMPANY_REVIEW_POSTED',
        'TEAM_INVITATION',
        'JOB_APPROVED',
        'JOB_REJECTED',
        'COMPANY_VERIFIED',
        'COMPANY_REJECTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    -- Email notifications
    email_application_status BOOLEAN DEFAULT TRUE,
    email_new_application BOOLEAN DEFAULT TRUE,
    email_new_job BOOLEAN DEFAULT TRUE,
    email_job_expiring BOOLEAN DEFAULT TRUE,
    email_profile_viewed BOOLEAN DEFAULT FALSE,
    email_company_review BOOLEAN DEFAULT TRUE,
    email_team_invitation BOOLEAN DEFAULT TRUE,
    email_job_moderation BOOLEAN DEFAULT TRUE,
    email_company_verification BOOLEAN DEFAULT TRUE,

    -- In-app notifications
    app_application_status BOOLEAN DEFAULT TRUE,
    app_new_application BOOLEAN DEFAULT TRUE,
    app_new_job BOOLEAN DEFAULT TRUE,
    app_job_expiring BOOLEAN DEFAULT TRUE,
    app_profile_viewed BOOLEAN DEFAULT TRUE,
    app_company_review BOOLEAN DEFAULT TRUE,
    app_team_invitation BOOLEAN DEFAULT TRUE,
    app_job_moderation BOOLEAN DEFAULT TRUE,
    app_company_verification BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add trigger for notification preferences updated_at
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
