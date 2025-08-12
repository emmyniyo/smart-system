-- /*
--   # IoT Smart Building Database Schema

--   1. New Tables
--     - `sensors`
--       - `id` (text, primary key)
--       - `type` (enum: temperature, humidity, co2, noise, presence)
--       - `value` (decimal)
--       - `unit` (text)
--       - `location` (text)
--       - `timestamp` (timestamptz)
--       - `status` (enum: normal, warning, critical)
--       - `created_at` (timestamptz)
--       - `updated_at` (timestamptz)
    
--     - `controls`
--       - `id` (text, primary key)
--       - `type` (enum: light, door, ac)
--       - `name` (text)
--       - `location` (text)
--       - `status` (boolean)
--       - `value` (integer, nullable)
--       - `created_at` (timestamptz)
--       - `updated_at` (timestamptz)
    
--     - `alerts`
--       - `id` (text, primary key)
--       - `type` (enum: info, warning, critical)
--       - `message` (text)
--       - `location` (text)
--       - `timestamp` (timestamptz)
--       - `acknowledged` (boolean)
--       - `acknowledged_at` (timestamptz, nullable)
--       - `acknowledged_by` (uuid, nullable)
--       - `created_at` (timestamptz)
    
--     - `access_logs`
--       - `id` (text, primary key)
--       - `user_id` (text)
--       - `user_name` (text)
--       - `action` (text)
--       - `location` (text)
--       - `timestamp` (timestamptz)
--       - `success` (boolean)
--       - `details` (jsonb, nullable)
--       - `created_at` (timestamptz)
    
--     - `system_status`
--       - `id` (text, primary key)
--       - `component` (text)
--       - `status` (enum: online, offline, error)
--       - `last_check` (timestamptz)
--       - `details` (jsonb, nullable)
--       - `created_at` (timestamptz)
--       - `updated_at` (timestamptz)

--   2. Security
--     - Enable RLS on all tables
--     - Add policies for authenticated users to read/write data
--     - Add policies for API access

--   3. Functions
--     - Function to update sensor data with automatic status calculation
--     - Function to create alerts based on sensor thresholds
--     - Function to get system health status
-- */

-- -- Create custom types
-- CREATE TYPE sensor_type AS ENUM ('temperature', 'humidity', 'co2', 'noise', 'presence');
-- CREATE TYPE sensor_status AS ENUM ('normal', 'warning', 'critical');
-- CREATE TYPE control_type AS ENUM ('light', 'door', 'ac');
-- CREATE TYPE alert_type AS ENUM ('info', 'warning', 'critical');
-- CREATE TYPE system_component_status AS ENUM ('online', 'offline', 'error');

-- -- Sensors table
-- CREATE TABLE IF NOT EXISTS sensors (
--   id text PRIMARY KEY,
--   type sensor_type NOT NULL,
--   value decimal(10,2) NOT NULL,
--   unit text NOT NULL,
--   location text NOT NULL,
--   timestamp timestamptz NOT NULL DEFAULT now(),
--   status sensor_status NOT NULL DEFAULT 'normal',
--   created_at timestamptz DEFAULT now(),
--   updated_at timestamptz DEFAULT now()
-- );

-- -- Controls table
-- CREATE TABLE IF NOT EXISTS controls (
--   id text PRIMARY KEY,
--   type control_type NOT NULL,
--   name text NOT NULL,
--   location text NOT NULL,
--   status boolean NOT NULL DEFAULT false,
--   value integer,
--   created_at timestamptz DEFAULT now(),
--   updated_at timestamptz DEFAULT now()
-- );

-- -- Alerts table
-- CREATE TABLE IF NOT EXISTS alerts (
--   id text PRIMARY KEY,
--   type alert_type NOT NULL,
--   message text NOT NULL,
--   location text NOT NULL,
--   timestamp timestamptz NOT NULL DEFAULT now(),
--   acknowledged boolean NOT NULL DEFAULT false,
--   acknowledged_at timestamptz,
--   acknowledged_by uuid REFERENCES auth.users(id),
--   created_at timestamptz DEFAULT now()
-- );

-- -- Access logs table
-- CREATE TABLE IF NOT EXISTS access_logs (
--   id text PRIMARY KEY,
--   user_id text NOT NULL,
--   user_name text NOT NULL,
--   action text NOT NULL,
--   location text NOT NULL,
--   timestamp timestamptz NOT NULL DEFAULT now(),
--   success boolean NOT NULL,
--   details jsonb,
--   created_at timestamptz DEFAULT now()
-- );

-- -- System status table
-- CREATE TABLE IF NOT EXISTS system_status (
--   id text PRIMARY KEY,
--   component text NOT NULL,
--   status system_component_status NOT NULL,
--   last_check timestamptz NOT NULL DEFAULT now(),
--   details jsonb,
--   created_at timestamptz DEFAULT now(),
--   updated_at timestamptz DEFAULT now()
-- );

-- -- Enable Row Level Security
-- ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_status ENABLE ROW LEVEL SECURITY;

-- -- Create policies for public access (for API integration)
-- CREATE POLICY "Allow public read access to sensors"
--   ON sensors FOR SELECT
--   TO public
--   USING (true);

-- CREATE POLICY "Allow public insert/update to sensors"
--   ON sensors FOR ALL
--   TO public
--   USING (true);

-- CREATE POLICY "Allow public read access to controls"
--   ON controls FOR SELECT
--   TO public
--   USING (true);

-- CREATE POLICY "Allow public update to controls"
--   ON controls FOR UPDATE
--   TO public
--   USING (true);

-- CREATE POLICY "Allow public read access to alerts"
--   ON alerts FOR SELECT
--   TO public
--   USING (true);

-- CREATE POLICY "Allow public insert/update to alerts"
--   ON alerts FOR ALL
--   TO public
--   USING (true);

-- CREATE POLICY "Allow public read access to access_logs"
--   ON access_logs FOR SELECT
--   TO public
--   USING (true);

-- CREATE POLICY "Allow public insert to access_logs"
--   ON access_logs FOR INSERT
--   TO public
--   WITH CHECK (true);

-- CREATE POLICY "Allow public read access to system_status"
--   ON system_status FOR SELECT
--   TO public
--   USING (true);

-- CREATE POLICY "Allow public update to system_status"
--   ON system_status FOR ALL
--   TO public
--   USING (true);

-- -- Create indexes for better performance
-- CREATE INDEX IF NOT EXISTS idx_sensors_timestamp ON sensors(timestamp DESC);
-- CREATE INDEX IF NOT EXISTS idx_sensors_location ON sensors(location);
-- CREATE INDEX IF NOT EXISTS idx_sensors_type ON sensors(type);
-- CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
-- CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
-- CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp DESC);
-- CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id);

-- -- Function to update sensor data with automatic status calculation
-- CREATE OR REPLACE FUNCTION update_sensor_data(
--   sensor_id text,
--   sensor_type sensor_type,
--   sensor_value decimal,
--   sensor_unit text,
--   sensor_location text
-- ) RETURNS void AS $$
-- DECLARE
--   calculated_status sensor_status := 'normal';
-- BEGIN
--   -- Calculate status based on thresholds
--   CASE sensor_type
--     WHEN 'temperature' THEN
--       IF sensor_value > 30 THEN calculated_status := 'critical';
--       ELSIF sensor_value > 25 THEN calculated_status := 'warning';
--       END IF;
--     WHEN 'humidity' THEN
--       IF sensor_value > 70 OR sensor_value < 30 THEN calculated_status := 'critical';
--       ELSIF sensor_value > 60 OR sensor_value < 40 THEN calculated_status := 'warning';
--       END IF;
--     WHEN 'co2' THEN
--       IF sensor_value > 1000 THEN calculated_status := 'critical';
--       ELSIF sensor_value > 800 THEN calculated_status := 'warning';
--       END IF;
--     WHEN 'noise' THEN
--       IF sensor_value > 70 THEN calculated_status := 'critical';
--       ELSIF sensor_value > 60 THEN calculated_status := 'warning';
--       END IF;
--   END CASE;

--   -- Insert or update sensor data
--   INSERT INTO sensors (id, type, value, unit, location, timestamp, status, updated_at)
--   VALUES (sensor_id, sensor_type, sensor_value, sensor_unit, sensor_location, now(), calculated_status, now())
--   ON CONFLICT (id) 
--   DO UPDATE SET 
--     value = EXCLUDED.value,
--     timestamp = EXCLUDED.timestamp,
--     status = EXCLUDED.status,
--     updated_at = now();

--   -- Create alert if status is warning or critical
--   IF calculated_status IN ('warning', 'critical') THEN
--     INSERT INTO alerts (id, type, message, location, timestamp)
--     VALUES (
--       'alert-' || extract(epoch from now()) || '-' || sensor_id,
--       calculated_status::alert_type,
--       sensor_type || ' ' || CASE 
--         WHEN calculated_status = 'critical' THEN 'critically high: '
--         ELSE 'elevated: '
--       END || sensor_value || sensor_unit,
--       sensor_location,
--       now()
--     )
--     ON CONFLICT (id) DO NOTHING;
--   END IF;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Function to get system health status
-- CREATE OR REPLACE FUNCTION get_system_health() RETURNS jsonb AS $$
-- DECLARE
--   result jsonb;
--   sensor_count integer;
--   active_alerts integer;
--   last_sensor_update timestamptz;
-- BEGIN
--   SELECT COUNT(*) INTO sensor_count FROM sensors;
--   SELECT COUNT(*) INTO active_alerts FROM alerts WHERE NOT acknowledged;
--   SELECT MAX(timestamp) INTO last_sensor_update FROM sensors;

--   result := jsonb_build_object(
--     'database', 'online',
--     'nodeRed', 'online',
--     'sensors', sensor_count,
--     'activeAlerts', active_alerts,
--     'lastUpdate', COALESCE(last_sensor_update, now())
--   );

--   RETURN result;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Insert initial sample data
-- INSERT INTO controls (id, type, name, location, status, value) VALUES
--   ('light-conf-a', 'light', 'Conference Room A Lights', 'Conference Room A', true, 75),
--   ('light-lobby', 'light', 'Lobby Lights', 'Lobby', true, 60),
--   ('door-main', 'door', 'Main Entrance', 'Lobby', false, null),
--   ('door-conf-a', 'door', 'Conference Room A', 'Conference Room A', false, null),
--   ('ac-conf-a', 'ac', 'Conference Room A HVAC', 'Conference Room A', true, 22),
--   ('ac-lobby', 'ac', 'Lobby HVAC', 'Lobby', true, 20)
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO system_status (id, component, status, last_check) VALUES
--   ('database', 'Database', 'online', now()),
--   ('node-red', 'Node-RED', 'online', now()),
--   ('mqtt', 'MQTT Broker', 'online', now()),
--   ('sensors', 'Sensor Network', 'online', now())
-- ON CONFLICT (id) DO UPDATE SET 
--   last_check = now(),
--   updated_at = now();

-- -- Insert sample sensor data
-- SELECT update_sensor_data('temp-conf-a', 'temperature', 22.5, '°C', 'Conference Room A');
-- SELECT update_sensor_data('hum-conf-a', 'humidity', 45.0, '%', 'Conference Room A');
-- SELECT update_sensor_data('co2-conf-a', 'co2', 400.0, 'ppm', 'Conference Room A');
-- SELECT update_sensor_data('noise-conf-a', 'noise', 35.0, 'dB', 'Conference Room A');
-- SELECT update_sensor_data('presence-conf-a', 'presence', 3.0, 'people', 'Conference Room A');

-- SELECT update_sensor_data('temp-lobby', 'temperature', 21.0, '°C', 'Lobby');
-- SELECT update_sensor_data('hum-lobby', 'humidity', 50.0, '%', 'Lobby');
-- SELECT update_sensor_data('co2-lobby', 'co2', 380.0, 'ppm', 'Lobby');
-- SELECT update_sensor_data('noise-lobby', 'noise', 40.0, 'dB', 'Lobby');
-- SELECT update_sensor_data('presence-lobby', 'presence', 5.0, 'people', 'Lobby');

-- -- Insert sample access logs
-- INSERT INTO access_logs (id, user_id, user_name, action, location, timestamp, success) VALUES
--   ('log-' || extract(epoch from now()), 'user1', 'John Doe', 'door_unlock', 'Main Entrance', now() - interval '5 minutes', true),
--   ('log-' || extract(epoch from now()) + 1, 'user2', 'Jane Smith', 'door_unlock', 'Conference Room A', now() - interval '10 minutes', true),
--   ('log-' || extract(epoch from now()) + 2, 'user3', 'Bob Wilson', 'door_unlock', 'Main Entrance', now() - interval '15 minutes', false)
-- ON CONFLICT (id) DO NOTHING;