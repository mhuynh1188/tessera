-- Check the current structure of email_templates table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'email_templates' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what data exists
SELECT id, name, organization_id, created_at 
FROM email_templates 
LIMIT 5;

-- Check if we have any templates with organization_id
SELECT COUNT(*) as total_templates, 
       COUNT(organization_id) as templates_with_org_id
FROM email_templates;