-- Fix classes.updated_at trigger crash
-- update_classes_updated_at (BEFORE UPDATE ON classes) calls update_updated_at_column(),
-- which sets NEW.updated_at. The classes table was created without an updated_at column,
-- unlike every other table wired to the same trigger function, so any UPDATE on classes
-- (reschedule, cancel, capacity/booking changes, etc.) has always failed with:
--   ERROR: record "new" has no field "updated_at"
-- Bring classes in line with the rest of the schema.

BEGIN;

ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
UPDATE public.classes SET updated_at = created_at WHERE updated_at IS NULL;

COMMIT;
