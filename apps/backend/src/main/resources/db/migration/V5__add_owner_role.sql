-- V5: Add OWNER role to user_role enum
-- OWNER is the supreme admin, auto-created on first boot

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'OWNER' BEFORE 'ADMIN';
