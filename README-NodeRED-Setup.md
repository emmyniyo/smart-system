# Configuration Node-RED pour Smart Meeting Room Dashboard

## 🚀 Installation et Configuration

### 1. Prérequis
- Node-RED installé et fonctionnel
- MySQL/MariaDB configuré avec le schéma fourni
- Accès aux ports 1880 (Node-RED) et 3306 (MySQL)

### 2. Nodes Node-RED requis

Installez les nodes suivants via le gestionnaire de palette Node-RED :

```bash
# Nodes pour base de données
npm install node-red-node-mysql

# Nodes pour WebSocket
npm install node-red-contrib-websocket-listener

# Nodes pour sécurité et CORS
npm install node-red-contrib-http-cors

# Nodes pour hachage des mots de passe
npm install node-red-contrib-bcrypt

# Nodes utilitaires
npm install node-red-contrib-moment
npm install node-red-dashboard (optionnel pour debug)
```

### 3. Configuration de la base de données

1. **Créer la base de données MySQL** :
```sql
CREATE DATABASE smart_meeting_room;
USE smart_meeting_room;
-- Exécuter le script database-schema/meeting-room-schema.sql
```

2. **Configurer le node MySQL dans Node-RED** :
   - Host: `localhost` (ou votre serveur MySQL)
   - Port: `3306`
   - Database: `smart_meeting_room`
   - Username/Password: vos identifiants MySQL

### 4. Import des flows Node-RED

1. Ouvrir l'éditeur Node-RED (`http://localhost:1880`)
2. Menu ☰ → Import → Clipboard
3. Coller le contenu du fichier `node-red-flows/smart-meeting-room-flows.json`
4. Cliquer "Import"

### 5. Configuration uibuilder

1. **Installer uibuilder** :
```bash
npm install node-red-contrib-uibuilder
```

2. **Configurer le node uibuilder** :
   - URL: `smart-dashboard`
   - Template: `Vue` ou `Blank`
   - Copier les fichiers depuis `uibuilder/smart-dashboard/src/` vers le dossier uibuilder

3. **Structure des fichiers uibuilder** :
```
~/.node-red/uibuilder/smart-dashboard/
├── src/
│   ├── index.html
│   ├── index.css
│   └── index.js
└── dist/ (généré automatiquement)
```

### 6. Configuration des endpoints

Les endpoints suivants seront disponibles après déploiement :

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/smart-dashboard` | GET | Interface web principale |
| `/api/sensors` | GET | Données des capteurs |
| `/api/controls` | GET/PUT | Contrôles des équipements |
| `/api/alerts` | GET/POST | Gestion des alertes |
| `/api/reservations` | GET/POST | Réservations de salle |
| `/api/users` | GET/POST | Gestion utilisateurs (admin) |

### 7. WebSocket pour temps réel

Le WebSocket est configuré sur `/ws` et gère :
- Mises à jour temps réel des capteurs
- Notifications d'alertes
- Changements d'état des équipements
- Messages de contrôle

### 8. Sécurité et authentification

#### Configuration des mots de passe :
Les mots de passe sont hachés avec bcrypt. Mots de passe par défaut :
- **admin@smartroom.com** : `admin123`
- **tech@smartroom.com** : `admin123`
- **employe@smartroom.com** : `admin123`
- **invite@smartroom.com** : `admin123`

#### Sessions utilisateur :
- Durée de session : 5 jours
- Token de session stocké en base
- Vérification des permissions par rôle

### 9. Test de l'installation

1. **Démarrer Node-RED** :
```bash
node-red
```

2. **Accéder à l'interface** :
   - Interface principale : `http://localhost:1880/smart-dashboard`
   - Éditeur Node-RED : `http://localhost:1880`

3. **Tester l'authentification** :
   - Se connecter avec `admin@smartroom.com` / `admin123`
   - Vérifier l'accès aux différentes sections selon le rôle

### 10. Simulation de données

Le flow inclut un simulateur de données de capteurs qui :
- Génère des valeurs aléatoires toutes les 30 secondes
- Insère les données en base
- Déclenche des alertes si seuils dépassés
- Envoie les mises à jour via WebSocket

### 11. Personnalisation

#### Modifier les seuils d'alerte :
Éditer la fonction `Generate Sensor Data` dans Node-RED pour ajuster :
- Plages de valeurs des capteurs
- Seuils d'alerte (warning/critical)
- Fréquence de mise à jour

#### Ajouter de nouveaux capteurs :
1. Insérer dans la table `Capteur`
2. Modifier le simulateur de données
3. Mettre à jour l'interface web

#### Personnaliser l'interface :
- Modifier `index.html` pour la structure
- Éditer `index.css` pour le style
- Adapter `index.js` pour les fonctionnalités

### 12. Dépannage

#### Problèmes courants :

**Erreur de connexion MySQL** :
- Vérifier les identifiants de connexion
- S'assurer que MySQL est démarré
- Vérifier les permissions utilisateur

**Interface web ne se charge pas** :
- Vérifier que uibuilder est installé
- Contrôler les fichiers dans le dossier src/
- Regarder les logs Node-RED

**WebSocket ne fonctionne pas** :
- Vérifier la configuration CORS
- Contrôler les ports ouverts
- Tester avec les outils de développement du navigateur

**Authentification échoue** :
- Vérifier les mots de passe hachés en base
- Contrôler la configuration bcrypt
- Regarder les logs de la fonction d'authentification

### 13. Production

Pour un déploiement en production :

1. **Sécurité** :
   - Changer tous les mots de passe par défaut
   - Configurer HTTPS
   - Limiter les accès réseau

2. **Performance** :
   - Optimiser les requêtes MySQL
   - Configurer un reverse proxy (nginx)
   - Mettre en place un monitoring

3. **Sauvegarde** :
   - Sauvegarder la base de données
   - Exporter les flows Node-RED
   - Sauvegarder les fichiers uibuilder

### 14. Support

Pour toute question ou problème :
1. Vérifier les logs Node-RED
2. Contrôler la console du navigateur
3. Tester les endpoints avec un outil comme Postman
4. Consulter la documentation Node-RED et uibuilder

---

## 📋 Checklist de déploiement

- [ ] MySQL installé et configuré
- [ ] Base de données créée avec le schéma
- [ ] Node-RED installé avec tous les nodes requis
- [ ] Flows importés et configurés
- [ ] uibuilder configuré avec les fichiers interface
- [ ] Test de connexion à l'interface web
- [ ] Test d'authentification avec différents rôles
- [ ] Vérification des données temps réel
- [ ] Test des contrôles d'équipements
- [ ] Configuration des alertes
- [ ] Test des réservations

L'interface est maintenant prête à être utilisée ! 🎉