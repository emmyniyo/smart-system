# Structure complète des fichiers uibuilder pour Smart Meeting Room Dashboard

## 📁 Structure des dossiers requise

Voici la structure exacte que vous devez avoir dans votre dossier uibuilder :

```
~/.node-red/uibuilder/smart-dashboard/
├── src/
│   ├── index.html          # Page principale (OBLIGATOIRE)
│   ├── index.css           # Styles CSS (OBLIGATOIRE)
│   ├── index.js            # JavaScript principal (OBLIGATOIRE)
│   └── manifest.json       # Métadonnées (OPTIONNEL)
├── dist/                   # Généré automatiquement par uibuilder
└── package.json            # Généré automatiquement par uibuilder
```

## 🔍 Vérification de votre installation

### 1. Vérifier que uibuilder est installé
```bash
# Dans Node-RED, aller dans Manage Palette
# Chercher "node-red-contrib-uibuilder"
# Doit être installé et activé
```

### 2. Vérifier la configuration du node uibuilder
Dans Node-RED, double-cliquer sur le node uibuilder et vérifier :
- **URL** : `smart-dashboard`
- **Template** : `Blank` ou `Vue`
- **Title** : `Smart Meeting Room Dashboard`

### 3. Vérifier les fichiers
```bash
# Aller dans le dossier uibuilder
cd ~/.node-red/uibuilder/smart-dashboard/src/

# Lister les fichiers
ls -la

# Vous devez voir :
# index.html
# index.css  
# index.js
```

## 🚨 Problèmes courants

### Problème 1 : Seule la page de login s'affiche
**Cause** : Le JavaScript ne charge pas correctement l'interface principale après connexion

**Solution** :
1. Vérifier que `index.js` contient la fonction `showMainApp()`
2. Vérifier que Bootstrap et les autres CDN se chargent
3. Ouvrir F12 → Console pour voir les erreurs JavaScript

### Problème 2 : Page blanche après login
**Cause** : Erreur JavaScript ou CSS manquant

**Solution** :
1. Ouvrir F12 → Console
2. Regarder les erreurs
3. Vérifier que tous les CDN sont accessibles

### Problème 3 : uibuilder ne trouve pas les fichiers
**Cause** : Fichiers dans le mauvais dossier

**Solution** :
```bash
# Créer le dossier s'il n'existe pas
mkdir -p ~/.node-red/uibuilder/smart-dashboard/src/

# Copier les fichiers au bon endroit
cp index.html ~/.node-red/uibuilder/smart-dashboard/src/
cp index.css ~/.node-red/uibuilder/smart-dashboard/src/
cp index.js ~/.node-red/uibuilder/smart-dashboard/src/
```

## 🔧 Commandes de diagnostic

### Vérifier l'installation uibuilder
```bash
# Dans Node-RED, aller dans l'éditeur de flows
# Le node uibuilder doit être disponible dans la palette
```

### Vérifier les logs Node-RED
```bash
# Dans le terminal où Node-RED tourne
# Regarder les messages d'erreur
```

### Tester l'accès direct
```bash
# Ouvrir dans le navigateur
http://localhost:1880/smart-dashboard

# Doit afficher la page de login
# Après connexion, doit afficher le dashboard complet
```

## 📋 Checklist de vérification

- [ ] Node-RED fonctionne sur le port 1880
- [ ] uibuilder est installé dans Node-RED
- [ ] Le node uibuilder est configuré avec URL "smart-dashboard"
- [ ] Les 3 fichiers (HTML, CSS, JS) sont dans le bon dossier
- [ ] Les flows Node-RED sont importés et déployés
- [ ] La base MySQL est configurée et accessible
- [ ] Aucune erreur dans la console du navigateur (F12)

## 🆘 Si ça ne marche toujours pas

1. **Redémarrer Node-RED** complètement
2. **Vider le cache du navigateur** (Ctrl+F5)
3. **Tester avec un autre navigateur**
4. **Vérifier les logs Node-RED** pour les erreurs
5. **Recréer le node uibuilder** depuis zéro