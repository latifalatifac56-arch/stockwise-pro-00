# Guide de Build Electron - GestionPro

## Prérequis

1. **Node.js** version 18+ installé
2. **Git** installé
3. **Icône Windows** : Créez `public/icon.ico` (256x256 pixels minimum)

## Installation des dépendances

Exécutez ces commandes dans votre terminal :

```bash
# Installer les dépendances de production
npm install

# Installer Electron et electron-builder (dev dependencies)
npm install --save-dev electron electron-builder concurrently wait-on electron-squirrel-startup
```

## Scripts à ajouter dans package.json

Ajoutez ces scripts dans la section `"scripts"` de votre `package.json` :

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && ELECTRON_DEV=true electron .\"",
    "electron:start": "electron .",
    "electron:build": "vite build && electron-builder --config electron-builder.json",
    "electron:build:win": "vite build && electron-builder --config electron-builder.json --win",
    "electron:build:mac": "vite build && electron-builder --config electron-builder.json --mac",
    "electron:build:linux": "vite build && electron-builder --config electron-builder.json --linux"
  }
}
```

Ajoutez aussi le champ `"main"` :

```json
{
  "main": "electron/main.js"
}
```

## Configuration Vite pour Electron

Modifiez `vite.config.ts` pour ajouter la base relative :

```typescript
export default defineConfig({
  base: './', // Important pour Electron
  // ... reste de la config
});
```

## Commandes

### Mode développement (React + Electron)

```bash
npm run electron:dev
```

Cela lance :
- Le serveur Vite sur http://localhost:5173
- Electron qui charge cette URL
- Hot reload activé

### Générer le .exe Windows

```bash
npm run electron:build:win
```

Le fichier sera créé dans : `release/GestionPro-Setup-{version}.exe`

### Lancer l'app Electron (après build)

```bash
npm run build
npm run electron:start
```

## Vérification IndexedDB

IndexedDB fonctionne nativement dans Electron. Pour vérifier :

1. Lancez l'app en mode dev : `npm run electron:dev`
2. Ouvrez DevTools (Ctrl+Shift+I)
3. Allez dans Application > IndexedDB
4. Vous devriez voir la base `stock-management`

Les données sont stockées dans :
- **Windows** : `%APPDATA%/GestionPro/IndexedDB/`
- **Mac** : `~/Library/Application Support/GestionPro/IndexedDB/`
- **Linux** : `~/.config/GestionPro/IndexedDB/`

## Structure des fichiers

```
project/
├── electron/
│   ├── main.js          # Point d'entrée Electron
│   └── preload.js       # Script preload sécurisé
├── public/
│   └── icon.ico         # Icône Windows (à créer)
├── release/             # Dossier de sortie (créé automatiquement)
├── electron-builder.json
└── package.json
```

## Création de l'icône

Vous avez besoin d'un fichier `public/icon.ico` pour Windows.

Options :
1. Convertissez votre PNG en ICO : https://convertico.com/
2. Utilisez les tailles : 16x16, 32x32, 48x48, 256x256

## Résolution de problèmes

### "electron-squirrel-startup not found"
```bash
npm install --save-dev electron-squirrel-startup
```

### "Cannot find module 'electron'"
```bash
npm install --save-dev electron
```

### L'app ne trouve pas les fichiers
Vérifiez que `base: './'` est dans `vite.config.ts`

### IndexedDB vide après rebuild
Les données IndexedDB sont persistantes. Si elles disparaissent :
1. Vérifiez le chemin de stockage Electron
2. Assurez-vous de ne pas utiliser `session.clearStorageData()`

## Notes importantes

- **Supabase** : L'app utilise aussi Supabase pour la sync cloud. IndexedDB est pour le cache local.
- **Offline** : L'app fonctionne offline grâce à IndexedDB
- **Sécurité** : `contextIsolation: true` et `nodeIntegration: false` sont activés
