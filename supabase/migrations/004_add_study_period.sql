-- ============================================================================
-- Migration 004: Add study_from_year and study_to_year (പഠന കാലഘട്ടം)
-- ============================================================================

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS study_from_year INTEGER,
  ADD COLUMN IF NOT EXISTS study_to_year INTEGER;
