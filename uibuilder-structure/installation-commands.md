# Commandes d'installation pour uibuilder

## 🚀 Installation rapide

### 1. Créer la structure de dossiers
```bash
# Créer le dossier uibuilder pour smart-dashboard
mkdir -p ~/.node-red/uibuilder/smart-dashboard/src/
```

### 2. Copier les fichiers
```bash
# Copier tous les fichiers depuis le projet
cp uibuilder-structure/src/index.html ~/.node-red/uibuilder/smart-dashboard/src/
cp uibuilder-structure/src/index.css ~/.node-red/uibuilder/smart-dashboard/src/
cp uibuilder-structure/src/index.js ~/.node-red/uibuilder/smart-dashboard/src/
cp uibuilder-structure/src/manifest.json ~/.node-red/uibuilder/smart-dashboard/src/
```

### 3. Vérifier l'installation
```bash
# Lister les fichiers installés
ls -la ~/.node-red/uibuilder/smart-dashboard/src/

# Vous devez voir :
# index.html
# index.css
# index.js
# manifest.json
```

### 4. Redémarrer Node-RED
```bash
# Arrêter Node-RED (Ctrl+C)
# Puis redémarrer
node-red
```

### 5. Tester l'interface
```bash
# Ouvrir dans le navigateur
http://localhost:1880/smart-dashboard

# Comptes de test :
# admin@smartroom.com / admin123
# tech@smartroom.com / admin123
# employe@smartroom.com / admin123
# invite@smartroom.com / admin123
```

## 🔧 Alternative : Via l'éditeur uibuilder

Si vous préférez utiliser l'éditeur intégré :

1. Dans Node-RED, double-cliquer sur le node uibuilder
2. Cliquer sur "Edit Source Files"
3. Copier-coller le contenu de chaque fichier :
   - `index.html` → onglet HTML
   - `index.css` → onglet CSS
   - `index.js` → onglet JavaScript
4. Sauvegarder et fermer l'éditeur
5. Déployer les flows

## ✅ Vérification finale

Votre interface doit maintenant afficher :
- ✅ Page de connexion au démarrage
- ✅ Interface complète après connexion
- ✅ Toutes les sections (Dashboard, Capteurs, Contrôles, etc.)
- ✅ Thème sombre/clair fonctionnel
- ✅ Notifications en temps réel
- ✅ Indicateur de connexion

Si vous ne voyez que la page de login, vérifiez :
1. Que tous les fichiers sont bien copiés
2. Qu'il n'y a pas d'erreurs dans la console (F12)
3. Que les flows Node-RED sont déployés
4. Que la base MySQL est accessible