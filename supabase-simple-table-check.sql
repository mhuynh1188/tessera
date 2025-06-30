-- SIMPLE TABLE CHECK - Basic version
-- Run this to see what tables exist in your database

-- Check what tables exist in the public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;