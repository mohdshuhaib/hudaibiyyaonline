-- ============================================================================
-- Migration 005: Remove Varshavari option (Maasavari only)
-- ============================================================================

UPDATE public.members
SET subscription_type = 'Maasavari'
WHERE subscription_type <> 'Maasavari' OR subscription_type IS NULL;

ALTER TABLE public.members
  DROP CONSTRAINT IF EXISTS members_subscription_type_check;

ALTER TABLE public.members
  ALTER COLUMN subscription_type SET DEFAULT 'Maasavari',
  ADD CONSTRAINT members_subscription_type_check CHECK (subscription_type IN ('Maasavari'));
