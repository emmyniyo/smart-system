# 🚀 Guide de Déploiement - Smart Meeting Room Dashboard

## Étape 1: Prérequis et Installation

### 1.1 Vérifier Node-RED
```bash
# Vérifier que Node-RED est installé
node-red --version

# Si pas installé:
npm install -g node-red
```

### 1.2 Installer les nodes requis
```bash
# Arrêter Node-RED s'il tourne
# Ctrl+C dans le terminal Node-RED

# Installer les nodes nécessaires
npm install node-red-node-mysql
npm install node-red-contrib-uibuilder
npm install node-red-contrib-bcrypt
npm install node-red-contrib-moment
```

### 1.3 Vérifier MySQL
```bash
# Vérifier que MySQL est installé et fonctionne
mysql --version
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # macOS
```

## Étape 2: Configuration de la Base de Données

### 2.1 Créer la base de données
```sql
-- Se connecter à MySQL
mysql -u root -p

-- Créer la base de données
CREATE DATABASE smart_meeting_room CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer un utilisateur dédié (recommandé)
CREATE USER 'smartroom_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON smart_meeting_room.* TO 'smartroom_user'@'localhost';
FLUSH PRIVILEGES;

-- Utiliser la base
USE smart_meeting_room;
```

### 2.2 Importer le schéma
```bash
# Depuis le terminal, importer le schéma
mysql -u smartroom_user -p smart_meeting_room < database-schema/meeting-room-schema.sql
```

### 2.3 Vérifier l'import
```sql
-- Se reconnecter et vérifier
mysql -u smartroom_user -p smart_meeting_room

-- Lister les tables
SHOW TABLES;

-- Vérifier les données d'exemple
SELECT * FROM Utilisateur;
SELECT * FROM Capteur;
```

## Étape 3: Configuration Node-RED

### 3.1 Démarrer Node-RED
```bash
# Démarrer Node-RED
node-red

# L'interface sera disponible sur http://localhost:1880
```

### 3.2 Configurer la connexion MySQL
1. Ouvrir http://localhost:1880
2. Aller dans le menu ☰ → Manage palette
3. Vérifier que `node-red-node-mysql` est installé
4. Glisser un node `mysql` sur le workspace
5. Double-cliquer pour configurer:
   - **Host**: `localhost`
   - **Port**: `3306`
   - **Database**: `smart_meeting_room`
   - **Username**: `smartroom_user`
   - **Password**: `votre_mot_de_passe_securise`
   - **Name**: `meeting-room-db`

### 3.3 Importer les flows
1. Copier le contenu du fichier `node-red-flows/smart-meeting-room-flows.json`
2. Dans Node-RED: Menu ☰ → Import
3. Coller le JSON et cliquer "Import"
4. Les flows apparaîtront dans un nouvel onglet

### 3.4 Configurer les nodes MySQL
1. Double-cliquer sur chaque node MySQL rouge
2. Sélectionner la configuration `meeting-room-db` créée précédemment
3. Cliquer "Done"

## Étape 4: Configuration uibuilder

### 4.1 Installer uibuilder
```bash
# Si pas déjà fait
npm install node-red-contrib-uibuilder
```

### 4.2 Configurer le node uibuilder
1. Double-cliquer sur le node `uibuilder` dans le flow
2. Configuration:
   - **URL**: `smart-dashboard`
   - **Template**: `Blank`
   - **Title**: `Smart Meeting Room Dashboard`
3. Cliquer "Done"

### 4.3 Copier les fichiers interface
```bash
# Trouver le dossier uibuilder de Node-RED
# Généralement dans ~/.node-red/uibuilder/

# Créer le dossier si nécessaire
mkdir -p ~/.node-red/uibuilder/smart-dashboard/src

# Copier les fichiers depuis le projet
cp uibuilder/smart-dashboard/src/index.html ~/.node-red/uibuilder/smart-dashboard/src/
cp uibuilder/smart-dashboard/src/index.css ~/.node-red/uibuilder/smart-dashboard/src/
cp uibuilder/smart-dashboard/src/index.js ~/.node-red/uibuilder/smart-dashboard/src/
```

### 4.4 Alternative: Utiliser l'éditeur uibuilder
1. Dans Node-RED, cliquer sur le node uibuilder
2. Cliquer sur "Open uibuilder editor" dans les propriétés
3. Copier-coller le contenu de chaque fichier:
   - `index.html` → onglet HTML
   - `index.css` → onglet CSS  
   - `index.js` → onglet JavaScript

## Étape 5: Déploiement et Test

### 5.1 Déployer les flows
1. Cliquer sur le bouton rouge "Deploy" en haut à droite
2. Vérifier qu'il n'y a pas d'erreurs dans l'onglet Debug

### 5.2 Tester la connexion base de données
1. Aller dans l'onglet Debug de Node-RED
2. Les flows de simulation devraient insérer des données toutes les 30 secondes
3. Vérifier dans MySQL:
```sql
SELECT * FROM Donnee ORDER BY date_ DESC LIMIT 10;
```

### 5.3 Accéder à l'interface
1. Ouvrir http://localhost:1880/smart-dashboard
2. Vous devriez voir la page de connexion
3. Utiliser les comptes de test:
   - **Admin**: `admin@smartroom.com` / `admin123`
   - **Technicien**: `tech@smartroom.com` / `admin123`
   - **Employé**: `employe@smartroom.com` / `admin123`
   - **Invité**: `invite@smartroom.com` / `admin123`

## Étape 6: Vérification du Fonctionnement

### 6.1 Test de l'authentification
- [ ] La page de connexion s'affiche
- [ ] Connexion réussie avec différents rôles
- [ ] Interface adaptée selon le rôle
- [ ] Déconnexion fonctionne

### 6.2 Test des données temps réel
- [ ] Les cartes du tableau de bord affichent des données
- [ ] Les graphiques se mettent à jour
- [ ] Les capteurs montrent des valeurs récentes
- [ ] Le statut de connexion est "Connecté"

### 6.3 Test des contrôles
- [ ] Les switches des équipements fonctionnent
- [ ] Les changements sont enregistrés en base
- [ ] Les logs d'actions sont créés

### 6.4 Test des alertes
- [ ] Des alertes apparaissent si seuils dépassés
- [ ] L'accusé de réception fonctionne
- [ ] Le badge d'alertes se met à jour

## Étape 7: Personnalisation (Optionnel)

### 7.1 Modifier les seuils d'alerte
```javascript
// Dans le flow "Generate Sensor Data", modifier:
if ((sensor.type === 'temperature' && value > 26) || 
    (sensor.type === 'co2' && value > 1000) ||
    (sensor.type === 'humidity' && (value > 65 || value < 35))) {
```

### 7.2 Ajouter de nouveaux capteurs
```sql
-- Ajouter un nouveau capteur
INSERT INTO Capteur (nom, type, description, location) 
VALUES ('Nouveau Capteur', 'temperature', 'Description', 'Lieu');
```

### 7.3 Personnaliser l'interface
- Modifier `index.css` pour changer les couleurs/styles
- Adapter `index.html` pour ajouter des sections
- Étendre `index.js` pour de nouvelles fonctionnalités

## 🔧 Dépannage

### Problème: Node-RED ne démarre pas
```bash
# Vérifier les logs
node-red --verbose

# Nettoyer le cache si nécessaire
rm -rf ~/.node-red/.config.json.backup
```

### Problème: Erreur de connexion MySQL
1. Vérifier que MySQL fonctionne: `sudo systemctl status mysql`
2. Tester la connexion: `mysql -u smartroom_user -p smart_meeting_room`
3. Vérifier les permissions utilisateur

### Problème: Interface ne se charge pas
1. Vérifier que uibuilder est installé
2. Contrôler les fichiers dans `~/.node-red/uibuilder/smart-dashboard/src/`
3. Regarder la console du navigateur (F12)

### Problème: Données ne s'affichent pas
1. Vérifier l'onglet Debug de Node-RED
2. Contrôler que les flows sont déployés
3. Vérifier les données en base: `SELECT * FROM Donnee LIMIT 5;`

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifier les logs Node-RED
2. Contrôler la console du navigateur
3. Tester les endpoints avec curl:
```bash
curl http://localhost:1880/api/sensors
```

L'interface est maintenant prête à être utilisée ! 🎉