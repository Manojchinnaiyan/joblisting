-- =====================================================
-- JOB PLATFORM - COMPLETE DATABASE SCHEMA
-- This file contains all tables and should be run on startup
-- Uses IF NOT EXISTS to be idempotent (safe to run multiple times)
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS (Create only if not exists)
-- =====================================================

-- Job related enums
DO $$ BEGIN
    CREATE TYPE job_type AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE experience_level AS ENUM ('ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'EXPIRED', 'CLOSED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE workplace_type AS ENUM ('ONSITE', 'REMOTE', 'HYBRID');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('SUBMITTED', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Profile related enums
DO $$ BEGIN
    CREATE TYPE profile_visibility AS ENUM ('PUBLIC', 'EMPLOYERS_ONLY', 'PRIVATE', 'APPLIED_ONLY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE employment_type AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE degree_type AS ENUM ('HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'DOCTORATE', 'CERTIFICATION', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE skill_level AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Company related enums
DO $$ BEGIN
    CREATE TYPE company_status AS ENUM ('PENDING', 'ACTIVE', 'VERIFIED', 'SUSPENDED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE company_size AS ENUM ('1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE team_role AS ENUM ('OWNER', 'ADMIN', 'RECRUITER', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE team_member_status AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE benefit_category AS ENUM ('HEALTH', 'FINANCIAL', 'VACATION', 'PROFESSIONAL_DEVELOPMENT', 'OFFICE_PERKS', 'FAMILY', 'WELLNESS', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE review_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'JOB_SEEKER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'EMAIL',
    google_id VARCHAR(255) UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- =====================================================
-- 2. AUTH TOKENS TABLES
-- =====================================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    device_info VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    failure_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. JOB CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS job_categories (
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

CREATE INDEX IF NOT EXISTS idx_job_categories_slug ON job_categories(slug);
CREATE INDEX IF NOT EXISTS idx_job_categories_parent_id ON job_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_job_categories_is_active ON job_categories(is_active);

-- =====================================================
-- 4. COMPANIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    tagline VARCHAR(255),
    description TEXT,
    industry VARCHAR(100) NOT NULL,
    sub_industry VARCHAR(100),
    company_size company_size NOT NULL,
    founded_year INTEGER,
    company_type VARCHAR(50),
    logo_url TEXT,
    cover_image_url TEXT,
    brand_color VARCHAR(7),
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    linkedin_url VARCHAR(255),
    twitter_url VARCHAR(255),
    facebook_url VARCHAR(255),
    instagram_url VARCHAR(255),
    mission TEXT,
    vision TEXT,
    culture_description TEXT,
    status company_status NOT NULL DEFAULT 'ACTIVE',
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    verification_documents TEXT[],
    rejection_reason TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    featured_until TIMESTAMP,
    total_jobs INTEGER DEFAULT 0,
    active_jobs INTEGER DEFAULT 0,
    total_employees INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    average_rating DECIMAL(2,1) DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);

-- =====================================================
-- 5. JOBS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    company_name VARCHAR(255) NOT NULL,
    company_logo_url TEXT,
    job_type job_type NOT NULL,
    experience_level experience_level NOT NULL,
    workplace_type workplace_type NOT NULL DEFAULT 'ONSITE',
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    salary_period VARCHAR(20) DEFAULT 'YEARLY',
    hide_salary BOOLEAN DEFAULT FALSE,
    skills TEXT[],
    education VARCHAR(255),
    years_experience_min INTEGER DEFAULT 0,
    years_experience_max INTEGER,
    benefits TEXT[],
    application_url TEXT,
    application_email VARCHAR(255),
    status job_status NOT NULL DEFAULT 'ACTIVE',
    rejection_reason TEXT,
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP,
    is_featured BOOLEAN DEFAULT FALSE,
    featured_until TIMESTAMP,
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    published_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON jobs(slug);

-- =====================================================
-- 6. JOB CATEGORY MAPPINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS job_category_mappings (
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, category_id)
);

-- =====================================================
-- 7. APPLICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_url TEXT NOT NULL,
    cover_letter TEXT,
    expected_salary INTEGER,
    available_from DATE,
    answers JSONB,
    status application_status NOT NULL DEFAULT 'SUBMITTED',
    status_updated_at TIMESTAMP,
    status_updated_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    employer_notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- =====================================================
-- 7B. APPLICATION STATUS HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS application_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_status_history_application_id ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_app_status_history_created_at ON application_status_history(created_at);

-- =====================================================
-- 8. SAVED JOBS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, job_id)
);

-- =====================================================
-- 9. USER PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(255),
    bio TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    avatar_url TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    willing_to_relocate BOOLEAN DEFAULT FALSE,
    current_title VARCHAR(255),
    current_company VARCHAR(255),
    total_experience_years DECIMAL(5,2) DEFAULT 0,
    expected_salary_min INTEGER,
    expected_salary_max INTEGER,
    expected_salary_currency VARCHAR(3) DEFAULT 'USD',
    notice_period_days INTEGER,
    available_from DATE,
    open_to_opportunities BOOLEAN DEFAULT TRUE,
    preferred_job_types TEXT[],
    preferred_workplace_types TEXT[],
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    website_url VARCHAR(500),
    visibility profile_visibility DEFAULT 'EMPLOYERS_ONLY',
    show_email BOOLEAN DEFAULT FALSE,
    show_phone BOOLEAN DEFAULT FALSE,
    completeness_score INTEGER DEFAULT 0,
    last_active TIMESTAMP,
    profile_views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- =====================================================
-- 10. RESUMES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);

-- =====================================================
-- 11. WORK EXPERIENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS work_experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    company_logo_url TEXT,
    title VARCHAR(255) NOT NULL,
    employment_type employment_type DEFAULT 'FULL_TIME',
    location VARCHAR(255),
    is_remote BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    achievements TEXT[],
    skills_used TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_work_exp_user_id ON work_experiences(user_id);

-- =====================================================
-- 12. EDUCATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    institution_logo_url TEXT,
    degree degree_type NOT NULL,
    field_of_study VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    grade VARCHAR(50),
    description TEXT,
    activities TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_education_user_id ON education(user_id);

-- =====================================================
-- 13. USER SKILLS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    level skill_level DEFAULT 'INTERMEDIATE',
    years_experience DECIMAL(3,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);

-- =====================================================
-- 14. CERTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    no_expiry BOOLEAN DEFAULT FALSE,
    credential_id VARCHAR(255),
    credential_url VARCHAR(500),
    certificate_file_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON certifications(user_id);

-- =====================================================
-- 15. PORTFOLIO PROJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    project_url VARCHAR(500),
    source_code_url VARCHAR(500),
    thumbnail_url TEXT,
    images TEXT[],
    technologies TEXT[],
    start_date DATE,
    end_date DATE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio_projects(user_id);

-- =====================================================
-- 16. COMPANY RELATED TABLES
-- =====================================================
CREATE TABLE IF NOT EXISTS company_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role team_role NOT NULL DEFAULT 'MEMBER',
    status team_member_status NOT NULL DEFAULT 'ACTIVE',
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMP,
    joined_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, user_id)
);

CREATE TABLE IF NOT EXISTS company_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role team_role NOT NULL DEFAULT 'MEMBER',
    token VARCHAR(255) UNIQUE NOT NULL,
    status invitation_status NOT NULL DEFAULT 'PENDING',
    invited_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(255),
    is_headquarters BOOLEAN DEFAULT FALSE,
    is_hiring BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category benefit_category NOT NULL,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type media_type NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(255),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    culture_rating INTEGER CHECK (culture_rating >= 1 AND culture_rating <= 5),
    work_life_rating INTEGER CHECK (work_life_rating >= 1 AND work_life_rating <= 5),
    compensation_rating INTEGER CHECK (compensation_rating >= 1 AND compensation_rating <= 5),
    management_rating INTEGER CHECK (management_rating >= 1 AND management_rating <= 5),
    title VARCHAR(255) NOT NULL,
    pros TEXT NOT NULL,
    cons TEXT NOT NULL,
    advice_to_management TEXT,
    job_title VARCHAR(255),
    employment_status VARCHAR(50),
    years_at_company INTEGER,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_current_employee BOOLEAN DEFAULT FALSE,
    status review_status NOT NULL DEFAULT 'PENDING',
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP,
    rejection_reason TEXT,
    company_response TEXT,
    company_response_by UUID REFERENCES users(id),
    company_response_at TIMESTAMP,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notify_new_jobs BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, user_id)
);

-- =====================================================
-- 17. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Email notification preferences
    email_application_status BOOLEAN DEFAULT TRUE,
    email_new_application BOOLEAN DEFAULT TRUE,
    email_new_job BOOLEAN DEFAULT TRUE,
    email_job_expiring BOOLEAN DEFAULT TRUE,
    email_profile_viewed BOOLEAN DEFAULT FALSE,
    email_company_review BOOLEAN DEFAULT TRUE,
    email_team_invitation BOOLEAN DEFAULT TRUE,
    email_job_moderation BOOLEAN DEFAULT TRUE,
    email_company_verification BOOLEAN DEFAULT TRUE,
    -- In-app notification preferences
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

-- =====================================================
-- 18. ADMIN SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 19. SAVED CANDIDATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS saved_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes TEXT,
    folder VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employer_id, candidate_id)
);

-- =====================================================
-- 20. JOB VIEWS TABLE (Analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS job_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_user_id ON job_views(user_id);
CREATE INDEX IF NOT EXISTS idx_job_views_viewed_at ON job_views(viewed_at);

-- =====================================================
-- 21. REVIEW HELPFUL VOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES company_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_user_id ON review_helpful_votes(user_id);

-- =====================================================
-- SEED DATA - Default Categories
-- =====================================================
INSERT INTO job_categories (name, slug, description, icon, sort_order, is_active)
SELECT * FROM (VALUES
    ('Technology', 'technology', 'Software development, IT, and tech roles', 'laptop-code', 1, true),
    ('Marketing', 'marketing', 'Digital marketing, content, and advertising', 'bullhorn', 2, true),
    ('Sales', 'sales', 'Sales, business development, and account management', 'chart-line', 3, true),
    ('Design', 'design', 'UI/UX, graphic design, and creative roles', 'palette', 4, true),
    ('Finance', 'finance', 'Accounting, finance, and analytics', 'dollar-sign', 5, true),
    ('Human Resources', 'human-resources', 'HR, recruitment, and people operations', 'users', 6, true),
    ('Customer Support', 'customer-support', 'Customer service and support roles', 'headset', 7, true),
    ('Operations', 'operations', 'Operations, logistics, and management', 'cogs', 8, true),
    ('Healthcare', 'healthcare', 'Medical, nursing, and healthcare roles', 'heartbeat', 9, true),
    ('Education', 'education', 'Teaching, training, and academic roles', 'graduation-cap', 10, true)
) AS v(name, slug, description, icon, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM job_categories LIMIT 1);

-- =====================================================
-- NEWSLETTER SUBSCRIPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_token ON newsletter_subscriptions(token);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Migration complete
SELECT 'Migration completed successfully' as status;
