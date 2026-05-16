-- Add admin flag to profiles table
ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;

-- Set initial admin user (update with actual admin user's ID after first registration)
-- Example: UPDATE profiles SET is_admin = true WHERE id = '<admin-user-id>';
