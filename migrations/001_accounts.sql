CREATE TABLE IF NOT EXISTS participants (id text PRIMARY KEY, real_name text NOT NULL, alias text NOT NULL, alias_key text UNIQUE NOT NULL, class_name text NOT NULL, attendance integer NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS teachers (id text PRIMARY KEY, username text UNIQUE NOT NULL, password_hash text NOT NULL);
CREATE TABLE IF NOT EXISTS auth_sessions (token_hash text PRIMARY KEY, user_id text NOT NULL, role text NOT NULL, csrf text NOT NULL, expires_at timestamptz NOT NULL);
