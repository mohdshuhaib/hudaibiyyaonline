-- ============================================================================
-- Migration 006: Add Nominee and Varis (അനന്തരാവകാശി) fields
-- ============================================================================

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS nominee_name TEXT,
  ADD COLUMN IF NOT EXISTS nominee_relation TEXT,
  ADD COLUMN IF NOT EXISTS nominee_phone TEXT,
  ADD COLUMN IF NOT EXISTS varis_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS varis_details JSONB DEFAULT '[]'::jsonb;
