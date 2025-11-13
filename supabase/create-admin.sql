-- Create Admin Account in Supabase
-- Run this in Supabase SQL Editor after running schema.sql
-- Password: test1234 (hashed with bcrypt)

-- Create Admin Account
-- Password: test1234
-- Run this AFTER running schema.sql

INSERT INTO "users" (
    "id",
    "email",
    "password",
    "name",
    "role",
    "phone",
    "emailVerified",
    "failedLoginAttempts",
    "accountLockedUntil",
    "createdAt",
    "updatedAt"
) VALUES (
    'admin_' || gen_random_uuid()::text,
    'infoajumapro@gmail.com',
    '$2a$10$JCHeIGx0u8OrD7eEfxHxDO46aO6IYufnytERiYVxhvw.4VIFJzaCK',
    'Admin',
    'ADMIN',
    '123-456-7899',
    CURRENT_TIMESTAMP,
    0,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("email") DO UPDATE SET
    "role" = 'ADMIN',
    "password" = '$2a$10$JCHeIGx0u8OrD7eEfxHxDO46aO6IYufnytERiYVxhvw.4VIFJzaCK',
    "updatedAt" = CURRENT_TIMESTAMP;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Admin account created/updated successfully!';
    RAISE NOTICE '📝 Email: infoajumapro@gmail.com';
    RAISE NOTICE '🔑 Password: test1234';
END $$;

