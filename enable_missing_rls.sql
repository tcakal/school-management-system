-- Enabling RLS on tables where policies exist but enforcement is disabled
-- Fixes "policy_exists_rls_disabled" and "rls_disabled_in_public" errors

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE maker_project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE maker_project_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE maker_project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE maker_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
