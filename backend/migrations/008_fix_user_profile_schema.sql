-- Migration: Fix user_profiles schema to match Go model
-- This fixes column name mismatches between the Go model and database schema

-- 1. Add profile_views column (missing from schema)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

-- 2. Rename columns to match Go model field names
-- desired_salary_min -> expected_salary_min
-- desired_salary_max -> expected_salary_max
-- Note: Using DO block to check if columns exist before renaming

DO $$
BEGIN
    -- Rename desired_salary_min to expected_salary_min if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'desired_salary_min'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'expected_salary_min'
    ) THEN
        ALTER TABLE user_profiles RENAME COLUMN desired_salary_min TO expected_salary_min;
    END IF;

    -- Rename desired_salary_max to expected_salary_max if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'desired_salary_max'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'expected_salary_max'
    ) THEN
        ALTER TABLE user_profiles RENAME COLUMN desired_salary_max TO expected_salary_max;
    END IF;

    -- Add expected_salary_min if neither exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name IN ('desired_salary_min', 'expected_salary_min')
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN expected_salary_min INTEGER;
    END IF;

    -- Add expected_salary_max if neither exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name IN ('desired_salary_max', 'expected_salary_max')
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN expected_salary_max INTEGER;
    END IF;

    -- Rename preferred_work_locations to preferred_workplace_types if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'preferred_work_locations'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'preferred_workplace_types'
    ) THEN
        ALTER TABLE user_profiles RENAME COLUMN preferred_work_locations TO preferred_workplace_types;
    END IF;

    -- Add preferred_workplace_types if neither exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name IN ('preferred_work_locations', 'preferred_workplace_types')
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN preferred_workplace_types TEXT[];
    END IF;
END $$;

-- 3. Add expected_salary_currency if missing
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS expected_salary_currency VARCHAR(3) DEFAULT 'USD';

-- 4. Add current_title and current_company if missing
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS current_title VARCHAR(255);

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS current_company VARCHAR(255);

-- 5. Add notice_period_days if missing
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS notice_period_days INTEGER;

-- 6. Add website_url if missing
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS website_url VARCHAR(500);

SELECT 'user_profiles schema fixed successfully' as status;
