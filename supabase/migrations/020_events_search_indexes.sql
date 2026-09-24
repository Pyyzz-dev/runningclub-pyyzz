-- Search/filter indexes for public.events
-- rollback: DROP INDEX IF EXISTS idx_events_date_name;
-- rollback: DROP INDEX IF EXISTS idx_events_event_date;
-- rollback: DROP INDEX IF EXISTS idx_events_name_trgm;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_events_name_trgm
  ON public.events USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_events_event_date
  ON public.events (event_date);

CREATE INDEX IF NOT EXISTS idx_events_date_name
  ON public.events (event_date, name);
