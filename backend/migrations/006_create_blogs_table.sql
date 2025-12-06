-- Blog Management System Migration
-- Creates tables for blog posts, categories, and tags

-- Drop existing tables if any (for clean setup)
DROP TABLE IF EXISTS blog_post_tags CASCADE;
DROP TABLE IF EXISTS blogs CASCADE;
DROP TABLE IF EXISTS blog_tags CASCADE;
DROP TABLE IF EXISTS blog_categories CASCADE;

-- Create blog_categories table
CREATE TABLE blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create blog_tags table
CREATE TABLE blog_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create blog status enum type
DO $$ BEGIN
    CREATE TYPE blog_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create blogs table
CREATE TABLE blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(500),
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    meta_keywords VARCHAR(500),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    status blog_status NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create blog_post_tags junction table
CREATE TABLE blog_post_tags (
    blog_id UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (blog_id, tag_id)
);

-- Create indexes
CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_blogs_published_at ON blogs(published_at);
CREATE INDEX idx_blogs_author_id ON blogs(author_id);
CREATE INDEX idx_blogs_category_id ON blogs(category_id);
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);

-- Create trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for blogs table
DROP TRIGGER IF EXISTS trigger_blogs_updated_at ON blogs;
CREATE TRIGGER trigger_blogs_updated_at
    BEFORE UPDATE ON blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_updated_at();

-- Create trigger for blog_categories table
DROP TRIGGER IF EXISTS trigger_blog_categories_updated_at ON blog_categories;
CREATE TRIGGER trigger_blog_categories_updated_at
    BEFORE UPDATE ON blog_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_updated_at();

-- Insert sample categories
INSERT INTO blog_categories (name, slug, description) VALUES
    ('Technology', 'technology', 'Tech industry news, programming tips, and software development insights'),
    ('Career Advice', 'career-advice', 'Professional development tips and career guidance'),
    ('Industry News', 'industry-news', 'Latest news and trends in various industries'),
    ('Interview Tips', 'interview-tips', 'How to prepare for and succeed in job interviews'),
    ('Resume Writing', 'resume-writing', 'Tips for creating effective resumes and cover letters'),
    ('Workplace Culture', 'workplace-culture', 'Insights on company culture and work environment'),
    ('Remote Work', 'remote-work', 'Guidance on remote work best practices and tools'),
    ('Salary & Benefits', 'salary-benefits', 'Information about compensation, benefits, and negotiations');

-- Insert sample tags
INSERT INTO blog_tags (name, slug) VALUES
    ('Remote Work', 'remote-work'),
    ('Interview', 'interview'),
    ('Resume', 'resume'),
    ('Job Search', 'job-search'),
    ('Career Growth', 'career-growth'),
    ('Networking', 'networking'),
    ('Leadership', 'leadership'),
    ('Work-Life Balance', 'work-life-balance'),
    ('Startups', 'startups'),
    ('Tech Industry', 'tech-industry'),
    ('Freelancing', 'freelancing'),
    ('Salary Negotiation', 'salary-negotiation'),
    ('Soft Skills', 'soft-skills'),
    ('Professional Development', 'professional-development'),
    ('Hiring', 'hiring');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
