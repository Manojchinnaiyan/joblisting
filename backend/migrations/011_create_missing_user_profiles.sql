-- Migration: Create missing user profiles
-- This fixes users who were created without profiles due to transaction bug

INSERT INTO user_profiles (id, user_id, visibility, open_to_opportunities, show_email, show_phone, completeness_score, created_at, updated_at)
SELECT
    gen_random_uuid(),
    u.id,
    'EMPLOYERS_ONLY',
    true,
    false,
    false,
    0,
    NOW(),
    NOW()
FROM users u
WHERE u.id NOT IN (SELECT user_id FROM user_profiles WHERE user_id IS NOT NULL)
  AND u.deleted_at IS NULL;

SELECT 'Created missing user profiles' as status;
