-- Check what columns exist in user_invitations table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_invitations'
ORDER BY ordinal_position;