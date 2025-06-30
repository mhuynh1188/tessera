-- SIMPLE COLUMN CHECK - See what columns exist
-- Run this after the table check to see columns

SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name IN ('users', 'organizations', 'workspaces', 'hexie_cards')
ORDER BY table_name, ordinal_position;