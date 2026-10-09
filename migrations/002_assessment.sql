CREATE TABLE IF NOT EXISTS mission_sessions (id text PRIMARY KEY, participant_id text NOT NULL REFERENCES participants(id), mission_id text NOT NULL, document jsonb NOT NULL, updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS settings (name text PRIMARY KEY, value jsonb NOT NULL);
CREATE INDEX IF NOT EXISTS mission_participant ON mission_sessions(participant_id);
