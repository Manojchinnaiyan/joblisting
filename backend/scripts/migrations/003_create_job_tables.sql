-- Migration: Create Job Management Tables
-- Description: Creates tables for jobs, applications, categories, saved jobs, and analytics

-- ============================================================
-- ENUMS
-- ============================================================

-- Job Type Enum
CREATE TYPE job_type AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP');

-- Experience Level Enum
CREATE TYPE experience_level AS ENUM ('ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE');

-- Job Status Enum
CREATE TYPE job_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'EXPIRED', 'CLOSED', 'REJECTED');

-- Workplace Type Enum
CREATE TYPE workplace_type AS ENUM ('ONSITE', 'REMOTE', 'HYBRID');

-- Application Status Enum
CREATE TYPE application_status AS ENUM (
    'SUBMITTED',
    'REVIEWED',
    'SHORTLISTED',
    'INTERVIEW',
    'OFFERED',
    'HIRED',
    'REJECTED',
    'WITHDRAWN'
);

-- ============================================================
-- JOB CATEGORIES TABLE
-- ============================================================

CREATE TABLE job_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    parent_id UUID REFERENCES job_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_categories_slug ON job_categories(slug);
CREATE INDEX idx_job_categories_parent_id ON job_categories(parent_id);
CREATE INDEX idx_job_categories_is_active ON job_categories(is_active);

-- ============================================================
-- JOBS TABLE
-- ============================================================

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Basic Info
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),

    -- Company Info (denormalized for search)
    company_name VARCHAR(255) NOT NULL,
    company_logo_url TEXT,

    -- Job Details
    job_type job_type NOT NULL,
    experience_level experience_level NOT NULL,
    workplace_type workplace_type NOT NULL DEFAULT 'ONSITE',

    -- Location
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Salary
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    salary_period VARCHAR(20) DEFAULT 'YEARLY',
    hide_salary BOOLEAN DEFAULT FALSE,

    -- Requirements
    skills TEXT[],
    education VARCHAR(255),
    years_experience_min INTEGER DEFAULT 0,
    years_experience_max INTEGER,

    -- Additional
    benefits TEXT[],
    application_url TEXT,
    application_email VARCHAR(255),

    -- Status & Moderation
    status job_status NOT NULL DEFAULT 'ACTIVE',
    rejection_reason TEXT,
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP,

    -- Featuring
    is_featured BOOLEAN DEFAULT FALSE,
    featured_until TIMESTAMP,

    -- Analytics
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,

    -- Dates
    published_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes for jobs table
CREATE INDEX idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_jobs_expires_at ON jobs(expires_at);
CREATE INDEX idx_jobs_slug ON jobs(slug);
CREATE INDEX idx_jobs_published_at ON jobs(published_at);
CREATE INDEX idx_jobs_deleted_at ON jobs(deleted_at);
CREATE INDEX idx_jobs_is_featured ON jobs(is_featured);
CREATE INDEX idx_jobs_geo ON jobs(latitude, longitude);

-- ============================================================
-- JOB CATEGORY MAPPINGS (Many-to-Many)
-- ============================================================

CREATE TABLE job_category_mappings (
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, category_id)
);

CREATE INDEX idx_job_category_mappings_job_id ON job_category_mappings(job_id);
CREATE INDEX idx_job_category_mappings_category_id ON job_category_mappings(category_id);

-- ============================================================
-- APPLICATIONS TABLE
-- ============================================================

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Application Data
    resume_url TEXT NOT NULL,
    cover_letter TEXT,
    expected_salary INTEGER,
    available_from DATE,
    answers JSONB,

    -- Status
    status application_status NOT NULL DEFAULT 'SUBMITTED',
    status_updated_at TIMESTAMP,
    status_updated_by UUID REFERENCES users(id),
    rejection_reason TEXT,

    -- Notes (employer internal)
    employer_notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),

    -- Dates
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(job_id, applicant_id)
);

-- Indexes for applications table
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_at ON applications(applied_at);
CREATE UNIQUE INDEX idx_applications_job_applicant ON applications(job_id, applicant_id);

-- ============================================================
-- APPLICATION STATUS HISTORY TABLE
-- ============================================================

CREATE TABLE application_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_status application_status,
    to_status application_status NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_app_status_history_application ON application_status_history(application_id);
CREATE INDEX idx_app_status_history_created_at ON application_status_history(created_at);

-- ============================================================
-- SAVED JOBS TABLE
-- ============================================================

CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, job_id)
);

CREATE INDEX idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_job_id ON saved_jobs(job_id);
CREATE UNIQUE INDEX idx_saved_jobs_user_job ON saved_jobs(user_id, job_id);

-- ============================================================
-- JOB VIEWS TABLE (Analytics)
-- ============================================================

CREATE TABLE job_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_views_job_id ON job_views(job_id);
CREATE INDEX idx_job_views_user_id ON job_views(user_id);
CREATE INDEX idx_job_views_viewed_at ON job_views(viewed_at);

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to jobs table
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to job_categories table
CREATE TRIGGER update_job_categories_updated_at
    BEFORE UPDATE ON job_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to applications table
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCTIONS FOR ANALYTICS
-- ============================================================

-- Function to increment job view count
CREATE OR REPLACE FUNCTION increment_job_views(job_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE jobs
    SET views_count = views_count + 1
    WHERE id = job_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to increment job applications count
CREATE OR REPLACE FUNCTION increment_job_applications(job_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE jobs
    SET applications_count = applications_count + 1
    WHERE id = job_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DATA - Default Categories
-- ============================================================

INSERT INTO job_categories (id, name, slug, description, icon, sort_order, is_active) VALUES
(uuid_generate_v4(), 'Technology', 'technology', 'Software development, IT, and tech roles', 'laptop-code', 1, true),
(uuid_generate_v4(), 'Marketing', 'marketing', 'Digital marketing, content, and advertising', 'bullhorn', 2, true),
(uuid_generate_v4(), 'Sales', 'sales', 'Sales, business development, and account management', 'chart-line', 3, true),
(uuid_generate_v4(), 'Design', 'design', 'UI/UX, graphic design, and creative roles', 'palette', 4, true),
(uuid_generate_v4(), 'Finance', 'finance', 'Accounting, finance, and analytics', 'dollar-sign', 5, true),
(uuid_generate_v4(), 'Human Resources', 'human-resources', 'HR, recruitment, and people operations', 'users', 6, true),
(uuid_generate_v4(), 'Customer Support', 'customer-support', 'Customer service and support roles', 'headset', 7, true),
(uuid_generate_v4(), 'Operations', 'operations', 'Operations, logistics, and management', 'cogs', 8, true),
(uuid_generate_v4(), 'Healthcare', 'healthcare', 'Medical, nursing, and healthcare roles', 'heartbeat', 9, true),
(uuid_generate_v4(), 'Education', 'education', 'Teaching, training, and academic roles', 'graduation-cap', 10, true);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE jobs IS 'Stores all job postings';
COMMENT ON TABLE job_categories IS 'Stores job categories and subcategories';
COMMENT ON TABLE applications IS 'Stores job applications from candidates';
COMMENT ON TABLE saved_jobs IS 'Stores bookmarked/saved jobs by users';
COMMENT ON TABLE job_views IS 'Tracks job views for analytics';
COMMENT ON TABLE application_status_history IS 'Tracks history of application status changes';

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

-- Version tracking
INSERT INTO schema_migrations (version) VALUES ('003');
