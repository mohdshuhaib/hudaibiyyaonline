-- ============================================================================
-- Run this in Supabase SQL Editor to fix "permission denied for table members"
-- and add the separate `post_office` column.
-- ============================================================================

-- 1. Add post_office column if it does not exist
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS post_office TEXT NOT NULL DEFAULT '';

-- 2. Grant schema & table permissions required by Supabase PostgREST
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT INSERT ON TABLE public.members TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.members TO service_role;

GRANT EXECUTE ON FUNCTION public.get_next_membership_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.approve_member(UUID) TO service_role;

-- 3. Ensure RLS policy for public registration insert is active
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public pending registration insert" ON public.members;
CREATE POLICY "Allow public pending registration insert"
  ON public.members
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND membership_id IS NULL
  );
