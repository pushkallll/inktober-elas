-- 0008_fix_claim_pen_name.sql
-- Fix the claim_pen_name function to use a secure email verification check
-- via auth.users.email_confirmed_at rather than the JWT payload.

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

    -- 2. Verify the authenticated user's actual email domain via JWT
    user_email := (auth.jwt() ->> 'email')::TEXT;
    
    IF user_email IS NULL OR user_email NOT LIKE '%@hyderabad.bits-pilani.ac.in' THEN
        RAISE EXCEPTION 'Unauthorized domain';
    END IF;

    -- 3. Securely verify email confirmation via auth.users
    -- SECURITY DEFINER allows this function to securely read from the auth schema
    SELECT (email_confirmed_at IS NOT NULL) INTO is_verified
    FROM auth.users
    WHERE id = auth.uid();

    IF is_verified IS NOT TRUE THEN
        RAISE EXCEPTION 'Email not verified';
    END IF;

    -- 4. Insert the new user profile
    INSERT INTO public.users (id, pen_name, pen_name_normalized)
    VALUES (auth.uid(), new_pen_name, new_pen_name_normalized)
    RETURNING * INTO new_user;

    RETURN new_user;
END;
$$;
