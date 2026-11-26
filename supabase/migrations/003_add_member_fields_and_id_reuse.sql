-- ============================================================================
-- Migration 003:
-- 1. Add email, wife_name, children_count, children_details, house_status,
--    shaikhuna_connection, shaikhuna_lineage columns to members
-- 2. Update get_next_membership_id() to reuse the lowest freed HUD-XXXX ID
--    when members are rejected (membership_id cleared) or deleted.
-- ============================================================================

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS wife_name TEXT,
  ADD COLUMN IF NOT EXISTS children_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS children_details JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS house_status TEXT,
  ADD COLUMN IF NOT EXISTS shaikhuna_connection TEXT,
  ADD COLUMN IF NOT EXISTS shaikhuna_lineage TEXT;

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
