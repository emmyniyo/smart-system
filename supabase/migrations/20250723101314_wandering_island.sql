-- Schéma de base de données pour Smart Meeting Room Dashboard
-- Compatible avec le système existant mentionné dans le cahier des charges

-- Table des capteurs
CREATE TABLE IF NOT EXISTS Capteur (
    id_capteur INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    type ENUM('temperature', 'humidity', 'co2', 'noise', 'presence', 'light') NOT NULL,
    description TEXT,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des données de capteurs
CREATE TABLE IF NOT EXISTS Donnee (
    id_donnee INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    valeur DECIMAL(10,2) NOT NULL,
    unite VARCHAR(20) NOT NULL,
    date_ TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    id_capteur INT,
    status ENUM('normal', 'warning', 'critical') DEFAULT 'normal',
    FOREIGN KEY (id_capteur) REFERENCES Capteur(id_capteur) ON DELETE CASCADE,
    INDEX idx_capteur_date (id_capteur, date_),
    INDEX idx_date (date_)
);

-- Table des utilisateurs avec gestion des rôles
CREATE TABLE IF NOT EXISTS Utilisateur (
    id_utilisateur INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Hash du mot de passe
    role ENUM('administrateur', 'technicien', 'employe', 'invite') DEFAULT 'invite',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    active BOOLEAN DEFAULT TRUE
);

-- Table des actionneurs/équipements contrôlables
CREATE TABLE IF NOT EXISTS Actionneurs (
    id_actionneur INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    type ENUM('light', 'door', 'hvac', 'window', 'projector') NOT NULL,
    description TEXT,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de l'état des équipements
CREATE TABLE IF NOT EXISTS Equipement (
    id_equipement INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    etat ENUM('on', 'off', 'auto', 'error') DEFAULT 'off',
    date_ TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_capteur INT NULL, -- Lien optionnel vers un capteur
    id_actionneur INT NULL, -- Lien vers l'actionneur
    value INT NULL, -- Valeur numérique (ex: intensité lumière, température)
    FOREIGN KEY (id_capteur) REFERENCES Capteur(id_capteur) ON DELETE SET NULL,
    FOREIGN KEY (id_actionneur) REFERENCES Actionneurs(id_actionneur) ON DELETE CASCADE
);

-- Table des entités extérieures (systèmes externes, APIs, etc.)
CREATE TABLE IF NOT EXISTS Entite_exterieur (
    id_entite_exte INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    type ENUM('api', 'mqtt', 'webhook', 'database') NOT NULL,
    endpoint VARCHAR(255),
    credentials JSON, -- Stockage sécurisé des identifiants
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des règles automatiques
CREATE TABLE IF NOT EXISTS Reglage_automatique (
    id_reglage INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    condition_sql TEXT, -- Condition SQL pour déclencher la règle
    action_type ENUM('control', 'alert', 'notification') NOT NULL,
    action_params JSON, -- Paramètres de l'action
    active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 1, -- Priorité d'exécution
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Utilisateur(id_utilisateur) ON DELETE SET NULL
);

-- Table de déclenchement des règles (log des exécutions)
CREATE TABLE IF NOT EXISTS Declanche (
    id_declanche INT PRIMARY KEY AUTO_INCREMENT,
    id_reglage INT NOT NULL,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trigger_data JSON, -- Données qui ont déclenché la règle
    execution_result ENUM('success', 'error', 'skipped') DEFAULT 'success',
    error_message TEXT NULL,
    FOREIGN KEY (id_reglage) REFERENCES Reglage_automatique(id_reglage) ON DELETE CASCADE,
    INDEX idx_reglage_date (id_reglage, triggered_at)
);

-- Table des actions effectuées (log des contrôles)
CREATE TABLE IF NOT EXISTS Agit (
    id_action INT PRIMARY KEY AUTO_INCREMENT,
    id_utilisateur INT NULL, -- NULL pour actions automatiques
    id_actionneur INT NOT NULL,
    action_type ENUM('manual', 'automatic', 'scheduled') NOT NULL,
    old_state VARCHAR(50),
    new_state VARCHAR(50),
    timestamp_ TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT NULL,
    FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur) ON DELETE SET NULL,
    FOREIGN KEY (id_actionneur) REFERENCES Actionneurs(id_actionneur) ON DELETE CASCADE,
    INDEX idx_user_date (id_utilisateur, timestamp_),
    INDEX idx_actionneur_date (id_actionneur, timestamp_)
);

-- Table des alertes
CREATE TABLE IF NOT EXISTS Alerte (
    id_alerte INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    type ENUM('info', 'warning', 'critical', 'maintenance') DEFAULT 'info',
    date_ TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by INT NULL,
    acknowledged_at TIMESTAMP NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP NULL,
    source_type ENUM('sensor', 'system', 'user', 'automatic') DEFAULT 'system',
    source_id INT NULL, -- ID de la source (capteur, utilisateur, etc.)
    priority INT DEFAULT 1,
    FOREIGN KEY (acknowledged_by) REFERENCES Utilisateur(id_utilisateur) ON DELETE SET NULL,
    INDEX idx_date_type (date_, type),
    INDEX idx_acknowledged (acknowledged, date_)
);

-- Table des réservations de salle
CREATE TABLE IF NOT EXISTS Reservation (
    id_reservation INT PRIMARY KEY AUTO_INCREMENT,
    date_reservation DATE NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    description TEXT,
    user_id INT NOT NULL,
    status ENUM('active', 'cancelled', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
    INDEX idx_date_time (date_reservation, heure_debut),
    INDEX idx_user_date (user_id, date_reservation)
);

-- Table des sessions utilisateur (pour la sécurité)
CREATE TABLE IF NOT EXISTS User_Sessions (
    id_session INT PRIMARY KEY AUTO_INCREMENT,
    id_utilisateur INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
    INDEX idx_token (session_token),
    INDEX idx_user_active (id_utilisateur, active)
);

-- Insertion de données d'exemple
INSERT INTO Capteur (nom, type, description, location) VALUES
('Température Salle', 'temperature', 'Capteur de température principal', 'Salle de réunion principale'),
('Humidité Salle', 'humidity', 'Capteur d\'humidité principal', 'Salle de réunion principale'),
('CO2 Salle', 'co2', 'Capteur de CO2 pour qualité air', 'Salle de réunion principale'),
('Détecteur Bruit', 'noise', 'Capteur de niveau sonore', 'Salle de réunion principale'),
('Détecteur Présence', 'presence', 'Capteur de présence PIR', 'Salle de réunion principale'),
('Luminosité', 'light', 'Capteur de luminosité ambiante', 'Salle de réunion principale');

INSERT INTO Actionneurs (nom, type, description, location) VALUES
('Éclairage Principal', 'light', 'Éclairage LED principal de la salle', 'Salle de réunion principale'),
('Éclairage Ambiance', 'light', 'Éclairage d\'ambiance', 'Salle de réunion principale'),
('Porte Principale', 'door', 'Porte d\'entrée de la salle', 'Salle de réunion principale'),
('Climatisation', 'hvac', 'Système de climatisation', 'Salle de réunion principale'),
('Projecteur', 'projector', 'Projecteur de présentation', 'Salle de réunion principale');

INSERT INTO Equipement (nom, description, etat, id_actionneur, value) VALUES
('Éclairage Principal', 'Contrôle éclairage principal', 'off', 1, 0),
('Éclairage Ambiance', 'Contrôle éclairage ambiance', 'off', 2, 0),
('Porte Principale', 'Contrôle porte d\'entrée', 'off', 3, NULL),
('Climatisation', 'Contrôle température', 'auto', 4, 22),
('Projecteur', 'Contrôle projecteur', 'off', 5, NULL);

-- Utilisateur administrateur par défaut (mot de passe: admin123)
INSERT INTO Utilisateur (nom, prenom, email, password, role) VALUES
('Admin', 'Système', 'admin@smartroom.com', '$2b$10$rOzJmZKjSqpkOvuBbgmhfOXhyrdtFgBV6FqVvVyAl4iV4yGGvGhCy', 'administrateur'),
('Technicien', 'Principal', 'tech@smartroom.com', '$2b$10$rOzJmZKjSqpkOvuBbgmhfOXhyrdtFgBV6FqVvVyAl4iV4yGGvGhCy', 'technicien'),
('Employé', 'Test', 'employe@smartroom.com', '$2b$10$rOzJmZKjSqpkOvuBbgmhfOXhyrdtFgBV6FqVvVyAl4iV4yGGvGhCy', 'employe'),
('Invité', 'Demo', 'invite@smartroom.com', '$2b$10$rOzJmZKjSqpkOvuBbgmhfOXhyrdtFgBV6FqVvVyAl4iV4yGGvGhCy', 'invite');

-- Règles automatiques d'exemple
INSERT INTO Reglage_automatique (nom, description, condition_sql, action_type, action_params, created_by) VALUES
('Alerte Température Élevée', 'Déclenche une alerte si température > 26°C', 
 'SELECT * FROM Donnee WHERE type="temperature" AND valeur > 26 AND date_ > DATE_SUB(NOW(), INTERVAL 5 MINUTE)', 
 'alert', '{"type": "warning", "message": "Température élevée détectée"}', 1),
('Alerte CO2 Critique', 'Déclenche une alerte critique si CO2 > 1000ppm', 
 'SELECT * FROM Donnee WHERE type="co2" AND valeur > 1000 AND date_ > DATE_SUB(NOW(), INTERVAL 5 MINUTE)', 
 'alert', '{"type": "critical", "message": "Niveau CO2 critique"}', 1),
('Éclairage Auto Présence', 'Active l\'éclairage si présence détectée', 
 'SELECT * FROM Donnee WHERE type="presence" AND valeur > 0 AND date_ > DATE_SUB(NOW(), INTERVAL 2 MINUTE)', 
 'control', '{"actionneur_id": 1, "action": "on", "value": 80}', 1);

-- Vues utiles pour l'interface
CREATE VIEW IF NOT EXISTS Vue_Capteurs_Recents AS
SELECT 
    c.nom as capteur_nom,
    c.type,
    c.location,
    d.nom,
    d.valeur,
    d.unite,
    d.date_,
    d.status,
    ROW_NUMBER() OVER (PARTITION BY c.id_capteur ORDER BY d.date_ DESC) as rn
FROM Capteur c
LEFT JOIN Donnee d ON c.id_capteur = d.id_capteur
WHERE d.date_ >= DATE_SUB(NOW(), INTERVAL 1 HOUR);

CREATE VIEW IF NOT EXISTS Vue_Alertes_Actives AS
SELECT 
    a.*,
    u.nom as acknowledged_by_nom,
    u.prenom as acknowledged_by_prenom
FROM Alerte a
LEFT JOIN Utilisateur u ON a.acknowledged_by = u.id_utilisateur
WHERE a.resolved = FALSE
ORDER BY a.priority DESC, a.date_ DESC;

CREATE VIEW IF NOT EXISTS Vue_Equipements_Status AS
SELECT 
    act.nom as actionneur_nom,
    act.type,
    act.location,
    eq.etat,
    eq.value,
    eq.date_ as last_update
FROM Actionneurs act
LEFT JOIN Equipement eq ON act.id_actionneur = eq.id_actionneur
ORDER BY act.nom;

-- Procédures stockées utiles
DELIMITER //

-- Procédure pour insérer une nouvelle donnée de capteur avec vérification des seuils
CREATE PROCEDURE IF NOT EXISTS InsererDonneeCapteur(
    IN p_nom VARCHAR(100),
    IN p_valeur DECIMAL(10,2),
    IN p_unite VARCHAR(20),
    IN p_id_capteur INT,
    IN p_description TEXT
)
BEGIN
    DECLARE v_status ENUM('normal', 'warning', 'critical') DEFAULT 'normal';
    DECLARE v_type VARCHAR(20);
    
    -- Récupérer le type de capteur
    SELECT type INTO v_type FROM Capteur WHERE id_capteur = p_id_capteur;
    
    -- Déterminer le status selon le type et la valeur
    CASE v_type
        WHEN 'temperature' THEN
            IF p_valeur > 30 THEN SET v_status = 'critical';
            ELSEIF p_valeur > 26 THEN SET v_status = 'warning';
            END IF;
        WHEN 'humidity' THEN
            IF p_valeur > 70 OR p_valeur < 30 THEN SET v_status = 'critical';
            ELSEIF p_valeur > 60 OR p_valeur < 40 THEN SET v_status = 'warning';
            END IF;
        WHEN 'co2' THEN
            IF p_valeur > 1000 THEN SET v_status = 'critical';
            ELSEIF p_valeur > 800 THEN SET v_status = 'warning';
            END IF;
        WHEN 'noise' THEN
            IF p_valeur > 70 THEN SET v_status = 'critical';
            ELSEIF p_valeur > 60 THEN SET v_status = 'warning';
            END IF;
    END CASE;
    
    -- Insérer la donnée
    INSERT INTO Donnee (nom, valeur, unite, date_, description, id_capteur, status)
    VALUES (p_nom, p_valeur, p_unite, NOW(), p_description, p_id_capteur, v_status);
    
    -- Créer une alerte si nécessaire
    IF v_status IN ('warning', 'critical') THEN
        INSERT INTO Alerte (nom, description, type, source_type, source_id)
        VALUES (
            CONCAT(v_type, ' ', v_status),
            CONCAT(p_nom, ': ', p_valeur, p_unite, ' - Seuil dépassé'),
            v_status,
            'sensor',
            p_id_capteur
        );
    END IF;
END //

-- Procédure pour contrôler un équipement
CREATE PROCEDURE IF NOT EXISTS ControlerEquipement(
    IN p_id_actionneur INT,
    IN p_nouvel_etat VARCHAR(50),
    IN p_nouvelle_valeur INT,
    IN p_id_utilisateur INT
)
BEGIN
    DECLARE v_ancien_etat VARCHAR(50);
    
    -- Récupérer l'ancien état
    SELECT etat INTO v_ancien_etat 
    FROM Equipement 
    WHERE id_actionneur = p_id_actionneur;
    
    -- Mettre à jour l'équipement
    UPDATE Equipement 
    SET etat = p_nouvel_etat, 
        value = COALESCE(p_nouvelle_valeur, value),
        date_ = NOW()
    WHERE id_actionneur = p_id_actionneur;
    
    -- Logger l'action
    INSERT INTO Agit (id_utilisateur, id_actionneur, action_type, old_state, new_state, timestamp_)
    VALUES (p_id_utilisateur, p_id_actionneur, 'manual', v_ancien_etat, p_nouvel_etat, NOW());
    
    -- Logger dans les alertes pour traçabilité
    INSERT INTO Alerte (nom, description, type, source_type, source_id)
    VALUES (
        'Action manuelle',
        CONCAT('Équipement ', p_id_actionneur, ' changé de ', v_ancien_etat, ' à ', p_nouvel_etat),
        'info',
        'user',
        p_id_utilisateur
    );
END //

DELIMITER ;

-- Index pour optimiser les performances
CREATE INDEX idx_donnee_capteur_date ON Donnee(id_capteur, date_ DESC);
CREATE INDEX idx_alerte_date_type ON Alerte(date_ DESC, type);
CREATE INDEX idx_reservation_date ON Reservation(date_reservation, heure_debut);
CREATE INDEX idx_agit_timestamp ON Agit(timestamp_ DESC);
CREATE INDEX idx_user_email ON Utilisateur(email);
CREATE INDEX idx_session_token ON User_Sessions(session_token);
CREATE INDEX idx_session_expires ON User_Sessions(expires_at);

-- Trigger pour nettoyer les sessions expirées
DELIMITER //
CREATE TRIGGER IF NOT EXISTS CleanExpiredSessions
    BEFORE INSERT ON User_Sessions
    FOR EACH ROW
BEGIN
    DELETE FROM User_Sessions WHERE expires_at < NOW();
END //
DELIMITER ;