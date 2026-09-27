-- 0005_moderation_refinements.sql

-- 1. Community Guidelines Table
CREATE TABLE IF NOT EXISTS community_guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed an initial guideline
INSERT INTO community_guidelines (version, title, content, active) 
VALUES (1, 'V1 Community Guidelines', '1. Respectful Content\n2. No NSFW\n3. Keep it campus appropriate.', true)
ON CONFLICT (version) DO NOTHING;

-- Add accepted_guideline_version to submissions
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS accepted_guideline_version INTEGER REFERENCES community_guidelines(version);

-- Update existing submissions
UPDATE submissions SET accepted_guideline_version = 1 WHERE accepted_guideline_version IS NULL;

-- 2. Moderation Feedback for individual highlighted issues
CREATE TABLE IF NOT EXISTS moderation_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    action_id UUID REFERENCES moderation_actions(id) ON DELETE CASCADE,
    text_range JSONB, -- e.g. { "start": 10, "end": 20 } or similar, useful for highlighting
    selected_text TEXT,
    comment TEXT NOT NULL,
    guideline_id UUID REFERENCES community_guidelines(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for Moderation Feedback
ALTER TABLE moderation_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view moderation feedback on their submissions" ON moderation_feedback;
CREATE POLICY "Users can view moderation feedback on their submissions" ON moderation_feedback FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM submissions 
        WHERE id = submission_id AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Mods can view all moderation feedback" ON moderation_feedback;
CREATE POLICY "Mods can view all moderation feedback" ON moderation_feedback FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('MODERATOR', 'ADMIN'))
);

-- 3. Users Table Updates for Suspension
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- (Note: audit_logs is intentionally omitted here because it was already created by 0001_initial_schema.sql)

-- 4. Enforce suspended_until in RLS
DROP POLICY IF EXISTS "Authors can insert own submissions" ON submissions;
CREATE POLICY "Authors can insert own submissions" ON submissions FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND status = 'ACTIVE' AND (suspended_until IS NULL OR suspended_until <= NOW()))
);

DROP POLICY IF EXISTS "Authors can update own submissions" ON submissions;
CREATE POLICY "Authors can update own submissions" ON submissions FOR UPDATE USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND status = 'ACTIVE' AND (suspended_until IS NULL OR suspended_until <= NOW()))
) WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND status = 'ACTIVE' AND (suspended_until IS NULL OR suspended_until <= NOW()))
);

DROP POLICY IF EXISTS "Users can yuppsie others" ON yuppsies;
CREATE POLICY "Users can yuppsie others" ON yuppsies FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND status = 'ACTIVE' AND (suspended_until IS NULL OR suspended_until <= NOW())) AND
    NOT EXISTS (SELECT 1 FROM submissions WHERE id = submission_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own pen_name" ON users;
CREATE POLICY "Users can update their own pen_name" ON users FOR UPDATE USING (
    auth.uid() = id AND status = 'ACTIVE' AND (suspended_until IS NULL OR suspended_until <= NOW())
) WITH CHECK (
    auth.uid() = id AND status = 'ACTIVE' AND (suspended_until IS NULL OR suspended_until <= NOW())
);

-- 5. Admin Publish on Behalf RLS
DROP POLICY IF EXISTS "Admins can insert any submission" ON submissions;
CREATE POLICY "Admins can insert any submission" ON submissions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
);

DROP POLICY IF EXISTS "Admins can update any submission" ON submissions;
CREATE POLICY "Admins can update any submission" ON submissions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
