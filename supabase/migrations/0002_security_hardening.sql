-- 0002_security_hardening.sql
-- 1. Create a secure RPC function for users to claim their pen name during onboarding
-- 2. Harden column-level updates using REVOKE/GRANT
-- 3. Restrict RLS policies to prevent suspended/banned users from bypassing rules

-- ==========================================
-- 1. SECURE PEN NAME RPC
-- ==========================================
CREATE OR REPLACE FUNCTION public.claim_pen_name(new_pen_name TEXT, new_pen_name_normalized TEXT)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_user public.users;
    user_email TEXT;
    is_verified BOOLEAN;
BEGIN
    -- 1. Ensure the user is authenticated via auth.uid()
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Verify the authenticated user's actual email domain and verification status
    user_email := (auth.jwt() ->> 'email')::TEXT;
    is_verified := (auth.jwt() ->> 'email_verified')::BOOLEAN;
    
    IF user_email IS NULL OR user_email NOT LIKE '%@hyderabad.bits-pilani.ac.in' THEN
        RAISE EXCEPTION 'Unauthorized domain';
    END IF;

    IF is_verified IS NOT TRUE THEN
        RAISE EXCEPTION 'Email not verified';
    END IF;

    -- 3. Insert the new user profile
    -- The table schema already defaults role to 'USER' and status to 'ACTIVE'
    -- Using INSERT guarantees a new row and enforces the primary key and unique pen name constraints.
    INSERT INTO public.users (id, pen_name, pen_name_normalized)
    VALUES (auth.uid(), new_pen_name, new_pen_name_normalized)
    RETURNING * INTO new_user;

    RETURN new_user;
END;
$$;

-- Secure the function: Revoke public access and grant only to authenticated users
REVOKE EXECUTE ON FUNCTION public.claim_pen_name(TEXT, TEXT) FROM public;
REVOKE EXECUTE ON FUNCTION public.claim_pen_name(TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_pen_name(TEXT, TEXT) TO authenticated;


-- ==========================================
-- 2. COLUMN-LEVEL PRIVILEGE HARDENING
-- ==========================================
-- Ensure 'authenticated' users cannot update 'role' or 'status' in users table
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (pen_name, pen_name_normalized, updated_at) ON public.users TO authenticated;

-- Ensure 'authenticated' users cannot update 'status', 'user_id' in submissions table
REVOKE UPDATE ON public.submissions FROM authenticated;
GRANT UPDATE (day, prompt_id, category, genre, title, writing_content, cloudinary_public_id, cloudinary_url, cloudinary_metadata, anonymous, updated_at) ON public.submissions TO authenticated;


-- ==========================================
-- 3. RLS POLICY HARDENING (PREVENT BAN BYPASS)
-- ==========================================
-- Submissions Insert: Must be ACTIVE
DROP POLICY IF EXISTS "Authors can insert own submissions" ON public.submissions;
CREATE POLICY "Authors can insert own submissions" ON public.submissions FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND status = 'ACTIVE')
);

-- Submissions Update: Must be ACTIVE
DROP POLICY IF EXISTS "Authors can update own submissions" ON public.submissions;
CREATE POLICY "Authors can update own submissions" ON public.submissions FOR UPDATE USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND status = 'ACTIVE')
) WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND status = 'ACTIVE')
);

-- Yuppsies Insert: Must be ACTIVE
DROP POLICY IF EXISTS "Users can yuppsie others" ON public.yuppsies;
CREATE POLICY "Users can yuppsie others" ON public.yuppsies FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND status = 'ACTIVE') AND
    NOT EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND user_id = auth.uid())
);

-- Users Update: Must be ACTIVE
DROP POLICY IF EXISTS "Users can update their own pen_name" ON public.users;
CREATE POLICY "Users can update their own pen_name" ON public.users FOR UPDATE USING (
    auth.uid() = id AND status = 'ACTIVE'
) WITH CHECK (
    auth.uid() = id AND status = 'ACTIVE'
);

-- Notify PostgREST to reload the schema cache so the new function and grants are immediately visible
NOTIFY pgrst, 'reload schema';
