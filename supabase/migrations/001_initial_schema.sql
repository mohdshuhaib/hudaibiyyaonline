-- ============================================================================
-- Hudaibiyya Islamic Trust (ഹുദൈബിയ്യ ഇസ്ലാമിക് ട്രസ്റ്റ്)
-- Phase 1 Initial Database Schema, RLS Policies & Storage Bucket
-- ============================================================================

-- 1. Create members table
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  fathers_name TEXT NOT NULL,
  photo_url TEXT,
  dob DATE NOT NULL,
  blood_group TEXT,
  marital_status TEXT,
  wife_name TEXT,
  children_count INTEGER DEFAULT 0,
  children_details JSONB DEFAULT '[]'::jsonb,
  phone TEXT NOT NULL UNIQUE,
  whatsapp TEXT NOT NULL,
  email TEXT,
  islamic_qualification TEXT[],
  general_education TEXT NOT NULL,
  profession TEXT NOT NULL,
  residence_type TEXT NOT NULL CHECK (residence_type IN ('Naatil', 'Abroad')),
  current_region TEXT NOT NULL,
  current_address TEXT NOT NULL,
  house_name TEXT NOT NULL,
  place_po TEXT NOT NULL,
  post_office TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL,
  pincode TEXT NOT NULL,
  house_status TEXT,
  shaikhuna_connection TEXT,
  shaikhuna_lineage TEXT,
  study_from_year INTEGER,
  study_to_year INTEGER,
  subscription_type TEXT NOT NULL DEFAULT 'Maasavari' CHECK (subscription_type IN ('Maasavari')),
  subscription_amount TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  validity_date DATE NOT NULL DEFAULT '2028-12-31',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast admin search and verification lookup
CREATE INDEX IF NOT EXISTS idx_members_membership_id ON public.members (membership_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members (status);
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members (phone);
CREATE INDEX IF NOT EXISTS idx_members_created_at ON public.members (created_at DESC);

-- 2. Sequential Membership ID generator (HUD-0001, HUD-0002, ...) with gap reuse
CREATE OR REPLACE FUNCTION public.get_next_membership_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_num INTEGER;
  next_num INTEGER;
BEGIN
  SELECT COALESCE(
    MAX(
      CASE
        WHEN membership_id ~ '^HUD-[0-9]+$'
        THEN SUBSTRING(membership_id FROM 5)::INTEGER
        ELSE 0
      END
    ),
    0
  )
  INTO max_num
  FROM public.members;

  SELECT gs
  INTO next_num
  FROM generate_series(1, max_num + 1) AS gs
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.members m
    WHERE m.membership_id = 'HUD-' || LPAD(gs::TEXT, 4, '0')
  )
  ORDER BY gs ASC
  LIMIT 1;

  RETURN 'HUD-' || LPAD(next_num::TEXT, 4, '0');
END;
$$;

-- Atomic approval function: assigns next HUD-XXXX if not already assigned
CREATE OR REPLACE FUNCTION public.approve_member(target_id UUID)
RETURNS public.members
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row public.members;
  next_id TEXT;
BEGIN
  -- Lock table row updates to prevent duplicate HUD numbers under concurrent approvals
  LOCK TABLE public.members IN SHARE ROW EXCLUSIVE MODE;

  SELECT * INTO updated_row FROM public.members WHERE id = target_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF updated_row.membership_id IS NULL THEN
    next_id := public.get_next_membership_id();
  ELSE
    next_id := updated_row.membership_id;
  END IF;

  UPDATE public.members
  SET
    status = 'approved',
    membership_id = next_id
  WHERE id = target_id
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

-- 3. Enable Row Level Security (RLS) on members & grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT INSERT ON TABLE public.members TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.members TO service_role;
GRANT EXECUTE ON FUNCTION public.get_next_membership_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.approve_member(UUID) TO service_role;

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Allow anonymous public registration ONLY when status = 'pending' and membership_id IS NULL
DROP POLICY IF EXISTS "Allow public pending registration insert" ON public.members;
CREATE POLICY "Allow public pending registration insert"
  ON public.members
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND membership_id IS NULL
  );

-- Note:
-- SELECT, UPDATE, and DELETE are intentionally NOT granted to `anon` or general `authenticated` roles.
-- All Admin Portal operations and /verify/[memberId] public lookups run server-side using
-- SUPABASE_SERVICE_ROLE_KEY after verifying `process.env.ADMIN_EMAILS` (for admin routes)
-- or selecting strictly public non-PII columns (for /verify/[memberId]).

-- 4. Create public Storage bucket `member-photos` (<= 500KB, JPEG/PNG only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-photos',
  'member-photos',
  true,
  512000,
  ARRAY['image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read access for member photos (needed for verification page & print engine)
DROP POLICY IF EXISTS "Public read access for member photos" ON storage.objects;
CREATE POLICY "Public read access for member photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'member-photos');

-- Allow public upload of compressed photos to member-photos bucket
DROP POLICY IF EXISTS "Public upload access for member photos" ON storage.objects;
CREATE POLICY "Public upload access for member photos"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'member-photos');
