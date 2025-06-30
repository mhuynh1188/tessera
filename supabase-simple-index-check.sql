-- SIMPLE INDEX CHECK - See what indexes exist
-- Run this to see existing indexes

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;