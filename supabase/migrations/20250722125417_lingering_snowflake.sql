/*
  # Système de rôles utilisateur

  1. Nouvelles Tables
    - `user_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key vers auth.users)
      - `role` (enum: administrator, technician, employee, guest)
      - `permissions` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `role_permissions`
      - `id` (uuid, primary key)
      - `role` (enum: administrator, technician, employee, guest)
      - `resource` (text)
      - `actions` (text array)
      - `created_at` (timestamptz)

  2. Sécurité
    - Activer RLS sur les nouvelles tables
    - Ajouter des politiques basées sur les rôles
    - Mettre à jour les politiques existantes pour utiliser les rôles

  3. Fonctions
    - Fonction pour obtenir le rôle d'un utilisateur
    - Fonction pour vérifier les permissions
    - Fonction pour assigner des rôles
*/

-- Créer le type enum pour les rôles
CREATE TYPE user_role_type AS ENUM ('administrator', 'technician', 'employee', 'guest');

-- Table des rôles utilisateur
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'guest',
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Table des permissions par rôle
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role_type NOT NULL,
  resource text NOT NULL,
  actions text[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, resource)
);

-- Activer RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_roles
CREATE POLICY "Les utilisateurs peuvent voir leur propre rôle"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Les administrateurs peuvent gérer tous les rôles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'administrator'
    )
  );

CREATE POLICY "Accès public en lecture pour les permissions de rôle"
  ON role_permissions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Seuls les administrateurs peuvent modifier les permissions"
  ON role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'administrator'
    )
  );

-- Fonction pour obtenir le rôle d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS user_role_type AS $$
DECLARE
  user_role user_role_type;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = user_uuid;
  
  -- Si aucun rôle n'est trouvé, retourner 'guest'
  RETURN COALESCE(user_role, 'guest');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier les permissions
CREATE OR REPLACE FUNCTION check_user_permission(
  resource_name text,
  action_name text,
  user_uuid uuid DEFAULT auth.uid()
)
RETURNS boolean AS $$
DECLARE
  user_role user_role_type;
  has_permission boolean := false;
BEGIN
  -- Obtenir le rôle de l'utilisateur
  SELECT get_user_role(user_uuid) INTO user_role;
  
  -- Vérifier les permissions
  SELECT action_name = ANY(actions) INTO has_permission
  FROM role_permissions
  WHERE role = user_role AND resource = resource_name;
  
  RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour assigner un rôle à un utilisateur
CREATE OR REPLACE FUNCTION assign_user_role(
  target_user_id uuid,
  new_role user_role_type,
  assigner_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean AS $$
DECLARE
  assigner_role user_role_type;
BEGIN
  -- Vérifier que l'assigneur est administrateur
  SELECT get_user_role(assigner_user_id) INTO assigner_role;
  
  IF assigner_role != 'administrator' THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent assigner des rôles';
  END IF;
  
  -- Insérer ou mettre à jour le rôle
  INSERT INTO user_roles (user_id, role, updated_at)
  VALUES (target_user_id, new_role, now())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = now();
    
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insérer les permissions par défaut pour chaque rôle
INSERT INTO role_permissions (role, resource, actions) VALUES
  -- Administrateur - Accès complet
  ('administrator', 'sensors', ARRAY['read', 'write', 'delete', 'manage']),
  ('administrator', 'controls', ARRAY['read', 'write', 'delete', 'manage']),
  ('administrator', 'alerts', ARRAY['read', 'write', 'delete', 'acknowledge', 'manage']),
  ('administrator', 'access_logs', ARRAY['read', 'write', 'delete', 'manage']),
  ('administrator', 'system_status', ARRAY['read', 'write', 'manage']),
  ('administrator', 'users', ARRAY['read', 'write', 'delete', 'manage']),
  
  -- Technicien - Accès technique complet
  ('technician', 'sensors', ARRAY['read', 'write', 'manage']),
  ('technician', 'controls', ARRAY['read', 'write', 'manage']),
  ('technician', 'alerts', ARRAY['read', 'write', 'acknowledge', 'manage']),
  ('technician', 'access_logs', ARRAY['read', 'write']),
  ('technician', 'system_status', ARRAY['read', 'write']),
  ('technician', 'users', ARRAY['read']),
  
  -- Employé - Accès limité aux opérations courantes
  ('employee', 'sensors', ARRAY['read']),
  ('employee', 'controls', ARRAY['read', 'write']),
  ('employee', 'alerts', ARRAY['read', 'acknowledge']),
  ('employee', 'access_logs', ARRAY['read']),
  ('employee', 'system_status', ARRAY['read']),
  ('employee', 'users', ARRAY[]),
  
  -- Invité - Accès en lecture seule
  ('guest', 'sensors', ARRAY['read']),
  ('guest', 'controls', ARRAY['read']),
  ('guest', 'alerts', ARRAY['read']),
  ('guest', 'access_logs', ARRAY[]),
  ('guest', 'system_status', ARRAY['read']),
  ('guest', 'users', ARRAY[])
ON CONFLICT (role, resource) DO NOTHING;

-- Créer un utilisateur administrateur par défaut (optionnel)
-- Note: Ceci sera exécuté seulement si un utilisateur avec cet email existe
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Chercher un utilisateur admin existant
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@smartbuilding.com'
  LIMIT 1;
  
  -- Si trouvé, lui assigner le rôle administrateur
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (admin_user_id, 'administrator')
    ON CONFLICT (user_id) DO UPDATE SET role = 'administrator';
  END IF;
END $$;

-- Mettre à jour les politiques existantes pour utiliser les rôles

-- Politiques pour sensors
DROP POLICY IF EXISTS "Allow public read access to sensors" ON sensors;
DROP POLICY IF EXISTS "Allow public insert/update to sensors" ON sensors;

CREATE POLICY "Lecture des capteurs basée sur les rôles"
  ON sensors FOR SELECT
  TO authenticated
  USING (check_user_permission('sensors', 'read'));

CREATE POLICY "Écriture des capteurs pour techniciens et administrateurs"
  ON sensors FOR INSERT
  TO authenticated
  WITH CHECK (check_user_permission('sensors', 'write'));

CREATE POLICY "Mise à jour des capteurs pour techniciens et administrateurs"
  ON sensors FOR UPDATE
  TO authenticated
  USING (check_user_permission('sensors', 'write'));

CREATE POLICY "Suppression des capteurs pour administrateurs"
  ON sensors FOR DELETE
  TO authenticated
  USING (check_user_permission('sensors', 'delete'));

-- Politiques pour controls
DROP POLICY IF EXISTS "Allow public read access to controls" ON controls;
DROP POLICY IF EXISTS "Allow public update to controls" ON controls;

CREATE POLICY "Lecture des contrôles basée sur les rôles"
  ON controls FOR SELECT
  TO authenticated
  USING (check_user_permission('controls', 'read'));

CREATE POLICY "Mise à jour des contrôles pour employés et plus"
  ON controls FOR UPDATE
  TO authenticated
  USING (check_user_permission('controls', 'write'));

-- Politiques pour alerts
DROP POLICY IF EXISTS "Allow public read access to alerts" ON alerts;
DROP POLICY IF EXISTS "Allow public insert/update to alerts" ON alerts;

CREATE POLICY "Lecture des alertes basée sur les rôles"
  ON alerts FOR SELECT
  TO authenticated
  USING (check_user_permission('alerts', 'read'));

CREATE POLICY "Accusé de réception des alertes pour employés et plus"
  ON alerts FOR UPDATE
  TO authenticated
  USING (check_user_permission('alerts', 'acknowledge'));

-- Politiques pour access_logs
DROP POLICY IF EXISTS "Allow public read access to access_logs" ON access_logs;
DROP POLICY IF EXISTS "Allow public insert to access_logs" ON access_logs;

CREATE POLICY "Lecture des logs d'accès pour techniciens et administrateurs"
  ON access_logs FOR SELECT
  TO authenticated
  USING (check_user_permission('access_logs', 'read'));

CREATE POLICY "Insertion des logs d'accès pour tous les utilisateurs authentifiés"
  ON access_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politiques pour system_status
DROP POLICY IF EXISTS "Allow public read access to system_status" ON system_status;
DROP POLICY IF EXISTS "Allow public update to system_status" ON system_status;

CREATE POLICY "Lecture du statut système basée sur les rôles"
  ON system_status FOR SELECT
  TO authenticated
  USING (check_user_permission('system_status', 'read'));

CREATE POLICY "Mise à jour du statut système pour techniciens et administrateurs"
  ON system_status FOR ALL
  TO authenticated
  USING (check_user_permission('system_status', 'write'));

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON role_permissions(resource);