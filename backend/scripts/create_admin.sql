-- Create Super Admin User
-- Email: superadmin@admin.jobsworld.com
-- Password: AdminPass123!
-- Password hash generated with bcrypt cost 12

DO $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_profile_id UUID := gen_random_uuid();
    v_password_history_id UUID := gen_random_uuid();
    -- This is bcrypt hash for 'AdminPass123!' with cost 12
    v_password_hash VARCHAR(255) := '$2a$12$tvuuhVdhst1RK3uOxFsDAOqID54FL59aqrsZH84z1d8UFK0X49XLK';
BEGIN
    -- Check if admin already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@admin.jobsworld.com') THEN
        RAISE NOTICE 'Admin user already exists!';
    ELSE
        -- Insert admin user
        INSERT INTO users (
            id, email, password, first_name, last_name, role,
            status, auth_provider, email_verified, two_factor_enabled,
            failed_login_attempts
        ) VALUES (
            v_user_id,
            'superadmin@admin.jobsworld.com',
            v_password_hash,
            'Super',
            'Admin',
            'ADMIN',
            'ACTIVE',
            'EMAIL',
            TRUE,
            FALSE,
            0
        );

        -- Create user profile
        INSERT INTO user_profiles (id, user_id) VALUES (v_profile_id, v_user_id);

        -- Create password history
        INSERT INTO password_history (id, user_id, password_hash)
        VALUES (v_password_history_id, v_user_id, v_password_hash);

        RAISE NOTICE 'Super Admin user created successfully!';
        RAISE NOTICE 'Email: superadmin@admin.jobsworld.com';
        RAISE NOTICE 'Password: AdminPass123!';
        RAISE NOTICE 'User ID: %', v_user_id;
    END IF;
END $$;
