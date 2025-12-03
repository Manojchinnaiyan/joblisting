-- Migration: 004_create_profile_tables.sql
-- Description: Create all user profile and resume management tables
-- Note: user_profiles table already exists from migration 001, we'll modify it if needed

BEGIN;

-- =====================================================
-- ENUMS
-- =====================================================

-- Profile visibility options
CREATE TYPE profile_visibility AS ENUM ('PUBLIC', 'EMPLOYERS_ONLY', 'PRIVATE', 'APPLIED_ONLY');

-- Employment type for work experiences
CREATE TYPE employment_type AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP');

-- Degree types for education
CREATE TYPE degree_type AS ENUM ('HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'DOCTORATE', 'CERTIFICATION', 'OTHER');

-- Skill proficiency levels
CREATE TYPE skill_level AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- =====================================================
-- 1. UPDATE USER_PROFILES TABLE
-- =====================================================

-- Drop existing user_profiles if it exists and recreate with full schema
DROP TABLE IF EXISTS user_profiles CASCADE;

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Basic Info
    headline VARCHAR(255),
    bio TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,

    -- Avatar
    avatar_url TEXT,

    -- Location
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    willing_to_relocate BOOLEAN DEFAULT FALSE,

    -- Professional Info
    current_title VARCHAR(255),
    current_company VARCHAR(255),
    total_experience_years DECIMAL(3,1) DEFAULT 0,

    -- Salary Expectations
    expected_salary_min INTEGER,
    expected_salary_max INTEGER,
    expected_salary_currency VARCHAR(3) DEFAULT 'USD',

    -- Availability
    notice_period_days INTEGER,
    available_from DATE,
    open_to_opportunities BOOLEAN DEFAULT TRUE,

    -- Job Preferences (stored as arrays)
    preferred_job_types TEXT[],
    preferred_workplace_types TEXT[],

    -- Social Links
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    website_url VARCHAR(255),

    -- Settings
    visibility profile_visibility DEFAULT 'EMPLOYERS_ONLY',
    show_email BOOLEAN DEFAULT FALSE,
    show_phone BOOLEAN DEFAULT FALSE,

    -- Completeness
    completeness_score INTEGER DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 100),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_visibility ON user_profiles(visibility);
CREATE INDEX idx_user_profiles_location ON user_profiles(city, country);
CREATE INDEX idx_user_profiles_open ON user_profiles(open_to_opportunities);
CREATE INDEX idx_user_profiles_experience ON user_profiles(total_experience_years);

-- =====================================================
-- 2. RESUMES TABLE
-- =====================================================

CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- File Info
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,

    -- Metadata
    title VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,

    -- Stats
    download_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_primary ON resumes(user_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_resumes_deleted ON resumes(deleted_at) WHERE deleted_at IS NOT NULL;

-- Constraint: Only one primary resume per user
CREATE UNIQUE INDEX idx_resumes_one_primary_per_user
ON resumes(user_id) WHERE (is_primary = TRUE AND deleted_at IS NULL);

-- =====================================================
-- 3. WORK EXPERIENCES TABLE
-- =====================================================

CREATE TABLE work_experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Company Info
    company_name VARCHAR(255) NOT NULL,
    company_logo_url TEXT,

    -- Position
    title VARCHAR(255) NOT NULL,
    employment_type employment_type DEFAULT 'FULL_TIME',
    location VARCHAR(255),
    is_remote BOOLEAN DEFAULT FALSE,

    -- Duration
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,

    -- Details
    description TEXT,
    achievements TEXT[],
    skills_used TEXT[],

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_work_exp_user_id ON work_experiences(user_id);
CREATE INDEX idx_work_exp_current ON work_experiences(user_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_work_exp_dates ON work_experiences(user_id, start_date DESC);

-- =====================================================
-- 4. EDUCATION TABLE
-- =====================================================

CREATE TABLE education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Institution
    institution VARCHAR(255) NOT NULL,
    institution_logo_url TEXT,

    -- Degree
    degree degree_type NOT NULL,
    field_of_study VARCHAR(255) NOT NULL,

    -- Duration
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,

    -- Details
    grade VARCHAR(50),
    description TEXT,
    activities TEXT[],

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_education_user_id ON education(user_id);
CREATE INDEX idx_education_current ON education(user_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_education_dates ON education(user_id, start_date DESC);

-- =====================================================
-- 5. USER SKILLS TABLE
-- =====================================================

CREATE TABLE user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Skill Info
    name VARCHAR(100) NOT NULL,
    level skill_level DEFAULT 'INTERMEDIATE',
    years_experience DECIMAL(3,1),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, name)
);

-- Indexes
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_name ON user_skills(name);
CREATE INDEX idx_user_skills_level ON user_skills(level);

-- =====================================================
-- 6. CERTIFICATIONS TABLE
-- =====================================================

CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Certificate Info
    name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,

    -- Dates
    issue_date DATE NOT NULL,
    expiry_date DATE,
    no_expiry BOOLEAN DEFAULT FALSE,

    -- Verification
    credential_id VARCHAR(255),
    credential_url VARCHAR(500),
    certificate_file_url TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_certifications_user_id ON certifications(user_id);
CREATE INDEX idx_certifications_expiry ON certifications(expiry_date) WHERE expiry_date IS NOT NULL;

-- =====================================================
-- 7. PORTFOLIO PROJECTS TABLE
-- =====================================================

CREATE TABLE portfolio_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Project Info
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- Links
    project_url VARCHAR(500),
    source_code_url VARCHAR(500),

    -- Media
    thumbnail_url TEXT,
    images TEXT[],

    -- Details
    technologies TEXT[],
    start_date DATE,
    end_date DATE,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_portfolio_user_id ON portfolio_projects(user_id);
CREATE INDEX idx_portfolio_featured ON portfolio_projects(user_id, is_featured) WHERE is_featured = TRUE;

-- Limit max 3 featured projects per user
CREATE UNIQUE INDEX idx_portfolio_max_3_featured
ON portfolio_projects(user_id, is_featured, id)
WHERE is_featured = TRUE;

-- =====================================================
-- 8. SAVED CANDIDATES TABLE (Employer feature)
-- =====================================================

CREATE TABLE saved_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notes
    notes TEXT,
    folder VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(employer_id, candidate_id)
);

-- Indexes
CREATE INDEX idx_saved_candidates_employer ON saved_candidates(employer_id);
CREATE INDEX idx_saved_candidates_candidate ON saved_candidates(candidate_id);
CREATE INDEX idx_saved_candidates_folder ON saved_candidates(employer_id, folder);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- resumes
CREATE TRIGGER update_resumes_updated_at
    BEFORE UPDATE ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- work_experiences
CREATE TRIGGER update_work_experiences_updated_at
    BEFORE UPDATE ON work_experiences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- education
CREATE TRIGGER update_education_updated_at
    BEFORE UPDATE ON education
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_skills
CREATE TRIGGER update_user_skills_updated_at
    BEFORE UPDATE ON user_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- certifications
CREATE TRIGGER update_certifications_updated_at
    BEFORE UPDATE ON certifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- portfolio_projects
CREATE TRIGGER update_portfolio_projects_updated_at
    BEFORE UPDATE ON portfolio_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- saved_candidates
CREATE TRIGGER update_saved_candidates_updated_at
    BEFORE UPDATE ON saved_candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- Function to limit featured projects to max 3 per user
CREATE OR REPLACE FUNCTION enforce_max_featured_projects()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_featured = TRUE THEN
        -- Count existing featured projects
        IF (SELECT COUNT(*)
            FROM portfolio_projects
            WHERE user_id = NEW.user_id
            AND is_featured = TRUE
            AND id != NEW.id) >= 3 THEN
            RAISE EXCEPTION 'Maximum 3 featured projects allowed per user';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_max_featured_projects
    BEFORE INSERT OR UPDATE ON portfolio_projects
    FOR EACH ROW
    EXECUTE FUNCTION enforce_max_featured_projects();

-- Function to ensure only one primary resume per user
CREATE OR REPLACE FUNCTION enforce_one_primary_resume()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE AND NEW.deleted_at IS NULL THEN
        -- Unset other primary resumes for this user
        UPDATE resumes
        SET is_primary = FALSE
        WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND is_primary = TRUE
        AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_one_primary_resume
    BEFORE INSERT OR UPDATE ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION enforce_one_primary_resume();

-- Function to auto-calculate profile completeness
CREATE OR REPLACE FUNCTION calculate_profile_completeness(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    profile_record RECORD;
BEGIN
    -- Get profile
    SELECT * INTO profile_record FROM user_profiles WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Basic Info (headline, bio, phone): 15%
    IF profile_record.headline IS NOT NULL AND profile_record.headline != '' THEN
        score := score + 5;
    END IF;
    IF profile_record.bio IS NOT NULL AND profile_record.bio != '' THEN
        score := score + 5;
    END IF;
    IF profile_record.phone IS NOT NULL AND profile_record.phone != '' THEN
        score := score + 5;
    END IF;

    -- Avatar uploaded: 5%
    IF profile_record.avatar_url IS NOT NULL AND profile_record.avatar_url != '' THEN
        score := score + 5;
    END IF;

    -- Location filled: 5%
    IF profile_record.city IS NOT NULL AND profile_record.country IS NOT NULL THEN
        score := score + 5;
    END IF;

    -- At least 1 Resume uploaded: 15%
    IF EXISTS (SELECT 1 FROM resumes WHERE user_id = p_user_id AND deleted_at IS NULL LIMIT 1) THEN
        score := score + 15;
    END IF;

    -- At least 1 Work Experience: 20%
    IF EXISTS (SELECT 1 FROM work_experiences WHERE user_id = p_user_id LIMIT 1) THEN
        score := score + 20;
    END IF;

    -- At least 1 Education: 15%
    IF EXISTS (SELECT 1 FROM education WHERE user_id = p_user_id LIMIT 1) THEN
        score := score + 15;
    END IF;

    -- At least 3 Skills: 10%
    IF (SELECT COUNT(*) FROM user_skills WHERE user_id = p_user_id) >= 3 THEN
        score := score + 10;
    END IF;

    -- Social Links (at least 1): 5%
    IF profile_record.linkedin_url IS NOT NULL OR
       profile_record.github_url IS NOT NULL OR
       profile_record.portfolio_url IS NOT NULL OR
       profile_record.website_url IS NOT NULL THEN
        score := score + 5;
    END IF;

    -- Job Preferences filled: 10%
    IF profile_record.preferred_job_types IS NOT NULL AND
       array_length(profile_record.preferred_job_types, 1) > 0 THEN
        score := score + 10;
    END IF;

    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE user_profiles IS 'Extended user profile information for job seekers';
COMMENT ON TABLE resumes IS 'User resume files stored in MinIO';
COMMENT ON TABLE work_experiences IS 'User work experience history';
COMMENT ON TABLE education IS 'User education history';
COMMENT ON TABLE user_skills IS 'User skills with proficiency levels';
COMMENT ON TABLE certifications IS 'Professional certifications';
COMMENT ON TABLE portfolio_projects IS 'User portfolio projects showcase';
COMMENT ON TABLE saved_candidates IS 'Employer saved/shortlisted candidates';

COMMENT ON COLUMN user_profiles.completeness_score IS 'Profile completeness percentage (0-100)';
COMMENT ON COLUMN resumes.is_primary IS 'Only one resume can be primary per user';
COMMENT ON COLUMN work_experiences.is_current IS 'User currently works here';
COMMENT ON COLUMN education.is_current IS 'User currently studying here';
COMMENT ON COLUMN portfolio_projects.is_featured IS 'Featured projects (max 3 per user)';

COMMIT;
