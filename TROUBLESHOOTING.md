# 🔧 Guide de Dépannage - Smart Meeting Room Dashboard

## ❌ Problèmes Courants et Solutions

### 1. Node-RED ne démarre pas

**Symptômes:**
- Erreur au lancement de `node-red`
- Port 1880 non accessible

**Solutions:**
```bash
# Vérifier si le port est occupé
lsof -i :1880
netstat -tulpn | grep 1880

# Tuer le processus si nécessaire
pkill -f node-red

# Démarrer avec logs détaillés
node-red --verbose

# Nettoyer la configuration si corrompue
mv ~/.node-red/settings.js ~/.node-red/settings.js.backup
```

### 2. Erreur de connexion MySQL

**Symptômes:**
- Nodes MySQL rouges dans Node-RED
- Erreur "Connection refused" ou "Access denied"

**Solutions:**
```bash
# Vérifier que MySQL fonctionne
sudo systemctl status mysql
brew services list | grep mysql  # macOS

# Tester la connexion manuellement
mysql -u smartroom_user -p smart_meeting_room

# Recréer l'utilisateur si nécessaire
mysql -u root -p
DROP USER 'smartroom_user'@'localhost';
CREATE USER 'smartroom_user'@'localhost' IDENTIFIED BY 'nouveau_mot_de_passe';
GRANT ALL PRIVILEGES ON smart_meeting_room.* TO 'smartroom_user'@'localhost';
FLUSH PRIVILEGES;
```

**Vérifier la configuration Node-RED:**
1. Double-cliquer sur un node MySQL rouge
2. Éditer la configuration de base de données
3. Tester la connexion
4. Redéployer les flows

### 3. Interface uibuilder ne se charge pas

**Symptômes:**
- Page blanche sur http://localhost:1880/smart-dashboard
- Erreur 404 ou 500

**Solutions:**
```bash
# Vérifier que uibuilder est installé
npm list node-red-contrib-uibuilder

# Réinstaller si nécessaire
npm install node-red-contrib-uibuilder

# Vérifier les fichiers
ls -la ~/.node-red/uibuilder/smart-dashboard/src/

# Recréer les fichiers si manquants
mkdir -p ~/.node-red/uibuilder/smart-dashboard/src
# Copier à nouveau les fichiers depuis le projet
```

**Via l'interface Node-RED:**
1. Double-cliquer sur le node uibuilder
2. Cliquer "Edit Source Files"
3. Vérifier que les fichiers HTML, CSS, JS sont présents
4. Redéployer

### 4. Authentification échoue

**Symptômes:**
- "Email ou mot de passe incorrect"
- Impossible de se connecter avec les comptes de test

**Solutions:**
```sql
-- Vérifier les utilisateurs en base
SELECT * FROM Utilisateur;

-- Recréer les mots de passe hachés
UPDATE Utilisateur SET password = '$2b$10$rOzJmZKjSqpkOvuBbgmhfOXhyrdtFgBV6FqVvVyAl4iV4yGGvGhCy' WHERE email = 'admin@smartroom.com';
```

**Vérifier le flow d'authentification:**
1. Aller dans l'onglet Debug de Node-RED
2. Tenter une connexion
3. Regarder les messages de debug
4. Vérifier la fonction "Authentication Handler"

### 5. Données ne s'affichent pas

**Symptômes:**
- Cartes du dashboard vides
- Graphiques sans données
- Statut "Déconnecté"

**Solutions:**
```sql
-- Vérifier les données en base
SELECT * FROM Donnee ORDER BY date_ DESC LIMIT 10;
SELECT * FROM Capteur;

-- Insérer des données de test manuellement
INSERT INTO Donnee (nom, valeur, unite, date_, description, id_capteur) 
VALUES ('Test Temp', 22.5, '°C', NOW(), 'Test', 1);
```

**Vérifier les flows:**
1. Contrôler que le simulateur de données fonctionne
2. Regarder l'onglet Debug pour les erreurs
3. Tester manuellement l'injection de données
4. Vérifier les requêtes SQL dans les functions

### 6. WebSocket ne fonctionne pas

**Symptômes:**
- Pas de mises à jour temps réel
- Statut "Déconnecté" persistant

**Solutions:**
1. Vérifier la configuration WebSocket dans le flow
2. Contrôler les CORS dans settings.js de Node-RED:
```javascript
// Dans ~/.node-red/settings.js
httpNodeCors: {
    origin: "*",
    methods: "GET,PUT,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization"
}
```

3. Redémarrer Node-RED après modification
4. Tester avec les outils de développement du navigateur (F12 → Network → WS)

### 7. Contrôles d'équipements ne fonctionnent pas

**Symptômes:**
- Switches ne changent pas d'état
- Erreur "Permission refusée"

**Solutions:**
```sql
-- Vérifier les équipements
SELECT * FROM Equipement;
SELECT * FROM Actionneurs;

-- Vérifier les permissions utilisateur
SELECT * FROM Utilisateur WHERE email = 'votre_email';
```

**Vérifier les flows:**
1. Tester le flow "control-action"
2. Regarder les logs dans Debug
3. Vérifier les requêtes SQL de mise à jour

### 8. Erreurs JavaScript dans le navigateur

**Symptômes:**
- Console du navigateur montre des erreurs
- Fonctionnalités ne marchent pas

**Solutions:**
1. Ouvrir F12 → Console
2. Identifier l'erreur spécifique
3. Vérifier que tous les scripts sont chargés:
   - Bootstrap
   - Chart.js
   - uibuilder.iife.min.js

**Erreurs communes:**
```javascript
// Si uibuilder n'est pas défini
// Vérifier que le script uibuilder est chargé avant index.js

// Si Chart n'est pas défini
// Vérifier le CDN Chart.js dans index.html
```

## 🔍 Outils de Diagnostic

### Vérifier l'état général
```bash
# Processus Node-RED
ps aux | grep node-red

# Ports ouverts
netstat -tulpn | grep -E "(1880|3306)"

# Logs système
journalctl -u mysql
tail -f ~/.node-red/node-red.log
```

### Tester les endpoints
```bash
# Test API sensors
curl http://localhost:1880/api/sensors

# Test avec authentification
curl -X POST http://localhost:1880/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartroom.com","password":"admin123"}'
```

### Vérifier la base de données
```sql
-- Statistiques générales
SELECT 
  (SELECT COUNT(*) FROM Utilisateur) as users,
  (SELECT COUNT(*) FROM Capteur) as sensors,
  (SELECT COUNT(*) FROM Donnee) as data_points,
  (SELECT COUNT(*) FROM Alerte) as alerts;

-- Dernières données
SELECT c.nom, d.valeur, d.unite, d.date_ 
FROM Capteur c 
JOIN Donnee d ON c.id_capteur = d.id_capteur 
ORDER BY d.date_ DESC LIMIT 10;
```

## 📞 Obtenir de l'aide

Si les solutions ci-dessus ne résolvent pas votre problème:

1. **Collecter les informations:**
   - Version de Node-RED: `node-red --version`
   - Version de MySQL: `mysql --version`
   - Logs d'erreur complets
   - Capture d'écran du problème

2. **Vérifier la configuration:**
   - Exporter vos flows Node-RED
   - Vérifier les paramètres de connexion MySQL
   - Lister les nodes installés: `npm list`

3. **Tests de base:**
   - Redémarrer Node-RED
   - Redémarrer MySQL
   - Vider le cache du navigateur
   - Tester avec un autre navigateur

Le système est conçu pour être robuste, la plupart des problèmes sont liés à la configuration initiale ! 🔧