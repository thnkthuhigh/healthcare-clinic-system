-- V6: Update seed users with proper BCrypt passwords so they can login
-- Default password for all seed users: "password123"
-- Using pgcrypto's crypt function to generate BCrypt hashes

UPDATE users SET password_hash = crypt('password123', gen_salt('bf', 10))
WHERE id IN (
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003'
);
