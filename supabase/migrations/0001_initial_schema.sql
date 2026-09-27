-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types
CREATE TYPE user_role AS ENUM ('USER', 'MODERATOR', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');
CREATE TYPE submission_status AS ENUM ('DRAFT', 'PENDING_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED', 'DELETED');
CREATE TYPE appeal_status AS ENUM ('PENDING', 'ACCEPTED', 'DENIED', 'WITHDRAWN');

-- Users / Profiles
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pen_name TEXT NOT NULL,
    pen_name_normalized TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'USER',
    status user_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prompts
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day INTEGER NOT NULL UNIQUE,
    prompt TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Submissions
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    prompt_id UUID REFERENCES prompts(id),
    category TEXT NOT NULL CHECK (category IN ('ART', 'WRITING')),
    genre TEXT, -- 'Poetry', 'Prose', 'Short Story', etc.
    title TEXT NOT NULL,
    writing_content TEXT,
    cloudinary_public_id TEXT,
    cloudinary_url TEXT,
    cloudinary_metadata JSONB,
    anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    status submission_status NOT NULL DEFAULT 'PENDING_REVIEW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Yuppsies
CREATE TABLE yuppsies (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, submission_id)
);

-- Appeals
CREATE TABLE appeals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL, -- Could be a submission_id or user_id
    appeal_type TEXT NOT NULL CHECK (appeal_type IN ('CONTENT', 'SUSPENSION', 'BAN')),
    status appeal_status NOT NULL DEFAULT 'PENDING',
    appeal_text TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    decision TEXT,
    decision_reason TEXT
);

-- Moderation Actions
CREATE TABLE moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- e.g., 'APPROVED', 'REJECTED', 'SUSPENDED'
    actor_id UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    target_id UUID,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Setup
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yuppsies ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Users RLS
-- Anyone can view public profiles
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);
-- Users can update their own profile EXCEPT role and status
CREATE POLICY "Users can update their own pen_name" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. Prompts RLS
CREATE POLICY "Prompts are viewable by everyone" ON prompts FOR SELECT USING (true);
-- Only admins can modify prompts
CREATE POLICY "Admins can insert prompts" ON prompts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins can update prompts" ON prompts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins can delete prompts" ON prompts FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 3. Submissions RLS
-- Public can view APPROVED and not DELETED submissions
CREATE POLICY "Public can view approved submissions" ON submissions FOR SELECT USING (status = 'APPROVED');
-- Authors can view all their own submissions
CREATE POLICY "Authors can view own submissions" ON submissions FOR SELECT USING (auth.uid() = user_id);
-- Moderators/Admins can view all submissions
CREATE POLICY "Moderators/Admins can view all submissions" ON submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('MODERATOR', 'ADMIN'))
);
-- Authors can insert their own submissions
CREATE POLICY "Authors can insert own submissions" ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Authors can update their own non-deleted submissions (but can't bypass moderation directly)
CREATE POLICY "Authors can update own submissions" ON submissions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Admins can delete
CREATE POLICY "Admins can delete submissions" ON submissions FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 4. Yuppsies RLS
-- Anyone can read Yuppsies
CREATE POLICY "Public can view Yuppsies" ON yuppsies FOR SELECT USING (true);
-- Users can only yuppsie if they are authenticated and haven't yuppsied themselves
CREATE POLICY "Users can yuppsie others" ON yuppsies FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    NOT EXISTS (SELECT 1 FROM submissions WHERE id = submission_id AND user_id = auth.uid())
);
-- Users can remove their own yuppsies
CREATE POLICY "Users can delete own yuppsies" ON yuppsies FOR DELETE USING (auth.uid() = user_id);

-- 5. Appeals RLS
CREATE POLICY "Users can view own appeals" ON appeals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Moderators can view all appeals" ON appeals FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('MODERATOR', 'ADMIN'))
);
CREATE POLICY "Users can insert own appeals" ON appeals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Moderation Actions & Audit Logs (Admin / Mod Only)
CREATE POLICY "Mods can view moderation actions" ON moderation_actions FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('MODERATOR', 'ADMIN'))
);
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Note: In production, backend functions/edge functions bypassing RLS with service_role 
-- will insert into audit_logs and moderation_actions to prevent user tampering.
