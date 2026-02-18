-- LinkedIn OAuth Tokens
CREATE TABLE IF NOT EXISTS linkedin_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(100) NOT NULL,
    organization_vanity VARCHAR(100) NOT NULL,
    organization_name VARCHAR(255),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    scopes VARCHAR(500),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    connected_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_linkedin_tokens_active ON linkedin_tokens(is_active);

-- LinkedIn Posts
CREATE TABLE IF NOT EXISTS linkedin_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    blog_id UUID REFERENCES blogs(id) ON DELETE SET NULL,
    linkedin_post_id VARCHAR(255),
    linkedin_post_url VARCHAR(500),
    organization_id VARCHAR(100) NOT NULL,
    post_text TEXT NOT NULL,
    post_link VARCHAR(500),
    trigger_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    posted_by UUID REFERENCES users(id),
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_linkedin_posts_content_type ON linkedin_posts(content_type);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_job_id ON linkedin_posts(job_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_blog_id ON linkedin_posts(blog_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_status ON linkedin_posts(status);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_linkedin_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_linkedin_tokens_updated_at ON linkedin_tokens;
CREATE TRIGGER trigger_update_linkedin_tokens_updated_at
    BEFORE UPDATE ON linkedin_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_linkedin_tokens_updated_at();

CREATE OR REPLACE FUNCTION update_linkedin_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_linkedin_posts_updated_at ON linkedin_posts;
CREATE TRIGGER trigger_update_linkedin_posts_updated_at
    BEFORE UPDATE ON linkedin_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_linkedin_posts_updated_at();
