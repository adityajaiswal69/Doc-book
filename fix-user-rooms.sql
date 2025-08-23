-- Fix user_rooms table by updating old user IDs to current Supabase user ID
-- Replace '1d11ff22-f6ad-4751-8e66-d8ef5f72d5ae' with your actual current user ID

-- First, let's see what we have
SELECT 'Current user_rooms entries:' as info;
SELECT * FROM user_rooms;

-- Update all user_rooms to use the current Supabase user ID
UPDATE user_rooms 
SET user_id = '1d11ff22-f6ad-4751-8e66-d8ef5f72d5ae'::uuid
WHERE user_id IN (
  'user_31dxMkEMHHsHHJEFJAcMQOpb5Mk',
  'jaiszaditya@gmail.com'
);

-- Show the updated results
SELECT 'Updated user_rooms entries:' as info;
SELECT * FROM user_rooms;

-- Verify documents are now accessible
SELECT 'Documents accessible to current user:' as info;
SELECT d.id, d.title, d.created_at, ur.role
FROM documents d
JOIN user_rooms ur ON d.id = ur.room_id
WHERE ur.user_id = '1d11ff22-f6ad-4751-8e66-d8ef5f72d5ae'::uuid;
