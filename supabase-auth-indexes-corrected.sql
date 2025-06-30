-- =====================================================================
-- AUTHENTICATION FOREIGN KEYS (CORRECTED)
-- =====================================================================

-- User sessions foreign keys
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id_fk ON user_sessions(user_id);

-- User two factor auth foreign keys
CREATE INDEX IF NOT EXISTS idx_user_two_factor_auth_user_id_fk ON user_two_factor_auth(user_id);

-- User invitations foreign keys (only for columns that exist)
CREATE INDEX IF NOT EXISTS idx_user_invitations_invited_by_fk ON user_invitations(invited_by);

-- Skip organization_id since it doesn't exist in user_invitations table

-- Success message
SELECT 'Authentication foreign key indexes created successfully!' as result;