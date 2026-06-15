-- Align column name with production schema (registered_at instead of created_at).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'training_participants'
      AND column_name = 'created_at'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'training_participants'
      AND column_name = 'registered_at'
  ) THEN
    ALTER TABLE public.training_participants
      RENAME COLUMN created_at TO registered_at;
  END IF;
END $$;

ALTER TABLE public.training_participants
  ADD COLUMN IF NOT EXISTS registered_at timestamptz NOT NULL DEFAULT now();
