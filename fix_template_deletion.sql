-- Disable RLS on notification_templates to allow deletion
-- The application uses custom client-side auth, so the database connection is anonymous.
-- Standard RLS policies relying on auth.uid() block delete operations.
-- Disabling RLS allows the application logic (which checks permissions on client side) to manage data.

ALTER TABLE notification_templates DISABLE ROW LEVEL SECURITY;
