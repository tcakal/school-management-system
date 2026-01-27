ALTER TABLE schools ADD COLUMN IF NOT EXISTS event_dates TEXT[];
COMMENT ON COLUMN schools.event_dates IS 'List of dates for the event';
