# ⚡ Quick Start - Smart Meeting Room Dashboard

## 🚀 Démarrage Rapide (5 minutes)

### Étape 1: Préparer l'environnement
```bash
# 1. Installer les dépendances Node-RED
npm install node-red-node-mysql node-red-contrib-uibuilder node-red-contrib-bcrypt

# 2. Créer la base de données MySQL
mysql -u root -p -e "CREATE DATABASE smart_meeting_room;"
mysql -u root -p smart_meeting_room < database-schema/meeting-room-schema.sql
```

### Étape 2: Configurer Node-RED
```bash
# 1. Démarrer Node-RED
node-red

# 2. Ouvrir http://localhost:1880
# 3. Importer le fichier: node-red-flows/smart-meeting-room-flows.json
# 4. Configurer la connexion MySQL dans les nodes
# 5. Cliquer "Deploy"
```

### Étape 3: Installer l'interface
```bash
# Copier les fichiers uibuilder
cp -r uibuilder/smart-dashboard/src/* ~/.node-red/uibuilder/smart-dashboard/src/
```

### Étape 4: Tester
```bash
# Ouvrir http://localhost:1880/smart-dashboard
# Se connecter avec: admin@smartroom.com / admin123
```

## ✅ Checklist de vérification

- [ ] Node-RED démarre sans erreur
- [ ] Base MySQL créée avec données d'exemple
- [ ] Flows importés et déployés
- [ ] Interface accessible sur /smart-dashboard
- [ ] Connexion admin fonctionne
- [ ] Données temps réel s'affichent
- [ ] Contrôles d'équipements fonctionnent

## 🔑 Comptes de test

| Rôle | Email | Mot de passe | Accès |
|------|-------|--------------|-------|
| Admin | admin@smartroom.com | admin123 | Complet |
| Technicien | tech@smartroom.com | admin123 | Technique |
| Employé | employe@smartroom.com | admin123 | Limité |
| Invité | invite@smartroom.com | admin123 | Lecture |

## 🛠️ Commandes utiles

```bash
# Redémarrer Node-RED
pkill -f node-red && node-red

# Vérifier les données MySQL
mysql -u root -p smart_meeting_room -e "SELECT * FROM Donnee ORDER BY date_ DESC LIMIT 5;"

# Voir les logs Node-RED
tail -f ~/.node-red/node-red.log
```

C'est tout ! Votre dashboard est opérationnel ! 🎉