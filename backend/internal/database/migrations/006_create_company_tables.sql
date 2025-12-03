-- Migration: Create Company Management Tables
-- Description: Complete company profile, team, locations, benefits, media, reviews, and followers

-- =====================================================
-- 1. CREATE ENUMS
-- =====================================================

CREATE TYPE company_status AS ENUM ('PENDING', 'ACTIVE', 'VERIFIED', 'SUSPENDED', 'REJECTED');
CREATE TYPE company_size AS ENUM ('1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+');
CREATE TYPE team_role AS ENUM ('OWNER', 'ADMIN', 'RECRUITER', 'MEMBER');
CREATE TYPE team_member_status AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');
CREATE TYPE invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');
CREATE TYPE benefit_category AS ENUM (
    'HEALTH', 'FINANCIAL', 'VACATION', 'PROFESSIONAL_DEVELOPMENT',
    'OFFICE_PERKS', 'FAMILY', 'WELLNESS', 'OTHER'
);
CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO');
CREATE TYPE review_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- =====================================================
-- 2. COMPANIES TABLE
-- =====================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    tagline VARCHAR(255),
    description TEXT,

    -- Industry
    industry VARCHAR(100) NOT NULL,
    sub_industry VARCHAR(100),

    -- Size & Type
    company_size company_size NOT NULL,
    founded_year INTEGER,
    company_type VARCHAR(50),

    -- Branding
    logo_url TEXT,
    cover_image_url TEXT,
    brand_color VARCHAR(7),

    -- Contact
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),

    -- Social Links
    linkedin_url VARCHAR(255),
    twitter_url VARCHAR(255),
    facebook_url VARCHAR(255),
    instagram_url VARCHAR(255),

    -- Culture
    mission TEXT,
    vision TEXT,
    culture_description TEXT,

    -- Status & Verification
    status company_status NOT NULL DEFAULT 'ACTIVE',
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    verification_documents TEXT[],
    rejection_reason TEXT,

    -- Featuring
    is_featured BOOLEAN DEFAULT FALSE,
    featured_until TIMESTAMP,

    -- Stats (denormalized for performance)
    total_jobs INTEGER DEFAULT 0,
    active_jobs INTEGER DEFAULT 0,
    total_employees INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    average_rating DECIMAL(2,1) DEFAULT 0,

    -- Owner
    created_by UUID NOT NULL REFERENCES users(id),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_verified ON companies(is_verified);
CREATE INDEX idx_companies_featured ON companies(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_companies_created_by ON companies(created_by);
CREATE INDEX idx_companies_deleted_at ON companies(deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- 3. COMPANY TEAM MEMBERS TABLE
-- =====================================================

CREATE TABLE company_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Role & Status
    role team_role NOT NULL DEFAULT 'MEMBER',
    status team_member_status NOT NULL DEFAULT 'ACTIVE',

    -- Permissions (JSON for flexibility)
    permissions JSONB DEFAULT '{}',

    -- Invitation
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMP,
    joined_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(company_id, user_id)
);

CREATE INDEX idx_team_members_company ON company_team_members(company_id);
CREATE INDEX idx_team_members_user ON company_team_members(user_id);
CREATE INDEX idx_team_members_role ON company_team_members(role);
CREATE INDEX idx_team_members_status ON company_team_members(status);

-- =====================================================
-- 4. COMPANY INVITATIONS TABLE
-- =====================================================

CREATE TABLE company_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Invitee
    email VARCHAR(255) NOT NULL,
    role team_role NOT NULL DEFAULT 'MEMBER',

    -- Token
    token VARCHAR(255) UNIQUE NOT NULL,

    -- Status
    status invitation_status NOT NULL DEFAULT 'PENDING',

    -- Inviter
    invited_by UUID NOT NULL REFERENCES users(id),

    -- Dates
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invitations_company ON company_invitations(company_id);
CREATE INDEX idx_invitations_email ON company_invitations(email);
CREATE INDEX idx_invitations_token ON company_invitations(token);
CREATE INDEX idx_invitations_status ON company_invitations(status);

-- =====================================================
-- 5. COMPANY LOCATIONS TABLE
-- =====================================================

CREATE TABLE company_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Location Info
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),

    -- Geo
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Contact
    phone VARCHAR(20),
    email VARCHAR(255),

    -- Type
    is_headquarters BOOLEAN DEFAULT FALSE,
    is_hiring BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_company_locations_company ON company_locations(company_id);
CREATE INDEX idx_company_locations_city ON company_locations(city, country);
CREATE INDEX idx_company_locations_hq ON company_locations(company_id, is_headquarters) WHERE is_headquarters = TRUE;

-- =====================================================
-- 6. COMPANY BENEFITS TABLE
-- =====================================================

CREATE TABLE company_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Benefit Info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category benefit_category NOT NULL,
    icon VARCHAR(50),

    -- Order
    sort_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_company_benefits_company ON company_benefits(company_id);
CREATE INDEX idx_company_benefits_category ON company_benefits(category);

-- =====================================================
-- 7. COMPANY MEDIA TABLE
-- =====================================================

CREATE TABLE company_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Media Info
    type media_type NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(255),
    description TEXT,

    -- Order
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_company_media_company ON company_media(company_id);
CREATE INDEX idx_company_media_featured ON company_media(is_featured) WHERE is_featured = TRUE;

-- =====================================================
-- 8. COMPANY REVIEWS TABLE
-- =====================================================

CREATE TABLE company_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Ratings (1-5)
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    culture_rating INTEGER CHECK (culture_rating >= 1 AND culture_rating <= 5),
    work_life_rating INTEGER CHECK (work_life_rating >= 1 AND work_life_rating <= 5),
    compensation_rating INTEGER CHECK (compensation_rating >= 1 AND compensation_rating <= 5),
    management_rating INTEGER CHECK (management_rating >= 1 AND management_rating <= 5),

    -- Review Content
    title VARCHAR(255) NOT NULL,
    pros TEXT NOT NULL,
    cons TEXT NOT NULL,
    advice_to_management TEXT,

    -- Employment Info
    job_title VARCHAR(255),
    employment_status VARCHAR(50),
    years_at_company INTEGER,

    -- Settings
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_current_employee BOOLEAN DEFAULT FALSE,

    -- Moderation
    status review_status NOT NULL DEFAULT 'PENDING',
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP,
    rejection_reason TEXT,

    -- Company Response
    company_response TEXT,
    company_response_by UUID REFERENCES users(id),
    company_response_at TIMESTAMP,

    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_company_reviews_company ON company_reviews(company_id);
CREATE INDEX idx_company_reviews_user ON company_reviews(user_id);
CREATE INDEX idx_company_reviews_status ON company_reviews(status);
CREATE INDEX idx_company_reviews_rating ON company_reviews(overall_rating);
CREATE UNIQUE INDEX idx_company_reviews_unique ON company_reviews(company_id, user_id);

-- =====================================================
-- 9. COMPANY FOLLOWERS TABLE
-- =====================================================

CREATE TABLE company_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notifications
    notify_new_jobs BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_followers_company ON company_followers(company_id);
CREATE INDEX idx_company_followers_user ON company_followers(user_id);

-- =====================================================
-- 10. REVIEW HELPFUL VOTES TABLE
-- =====================================================

CREATE TABLE review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES company_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(review_id, user_id)
);

CREATE INDEX idx_review_votes_review ON review_helpful_votes(review_id);
CREATE INDEX idx_review_votes_user ON review_helpful_votes(user_id);

-- =====================================================
-- 11. UPDATE JOBS TABLE
-- =====================================================

-- Add company_id to jobs table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='jobs' AND column_name='company_id') THEN
        ALTER TABLE jobs ADD COLUMN company_id UUID REFERENCES companies(id);
        CREATE INDEX idx_jobs_company_id ON jobs(company_id);
    END IF;
END $$;

-- =====================================================
-- 12. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON company_team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON company_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON company_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_benefits_updated_at BEFORE UPDATE ON company_benefits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON company_media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON company_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
