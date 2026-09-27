-- Enable self yuppsies by modifying the insert policy
-- Also ensures target submission is APPROVED (publicly visible)

DROP POLICY IF EXISTS "Users can yuppsie others" ON yuppsies;
DROP POLICY IF EXISTS "Users can yuppsie" ON yuppsies;

CREATE POLICY "Users can yuppsie" ON yuppsies FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND status = 'ACTIVE' AND (suspended_until IS NULL OR suspended_until <= NOW())) AND
    EXISTS (SELECT 1 FROM submissions WHERE id = submission_id AND status = 'APPROVED')
);
