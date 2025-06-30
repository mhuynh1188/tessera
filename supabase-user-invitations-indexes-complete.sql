-- =====================================================================
-- USER INVITATIONS FOREIGN KEY INDEXES (BASED ON ACTUAL COLUMNS)
-- =====================================================================

-- Foreign key indexes for user_invitations table
CREATE INDEX IF NOT EXISTS idx_user_invitations_role_id_fk ON user_invitations(role_id);

CREATE INDEX IF NOT EXISTS idx_user_invitations_subscription_plan_id_fk ON user_invitations(subscription_plan_id);

CREATE INDEX IF NOT EXISTS idx_user_invitations_invited_by_fk ON user_invitations(invited_by);

-- Success message
SELECT 'User invitations foreign key indexes created successfully!' as result;