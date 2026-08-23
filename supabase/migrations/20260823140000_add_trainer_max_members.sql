-- Add a real max_members capacity field to trainers
-- ============================================================================
-- AssignTrainerModal previously hardcoded every trainer's capacity to 15 for
-- its "has room for more members" filter and the "X/Y members" display, with
-- a comment noting the field didn't exist yet. This adds it as a real,
-- editable column with a sane default matching the value that was hardcoded.

BEGIN;

ALTER TABLE public.trainers
  ADD COLUMN IF NOT EXISTS max_members INTEGER NOT NULL DEFAULT 15
    CHECK (max_members > 0);

COMMIT;
