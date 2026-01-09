UPDATE system_settings
SET logo_url = '/logo_v3.png'
WHERE id = (SELECT id FROM system_settings LIMIT 1);
