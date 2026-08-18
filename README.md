# NightShade's Music Player

A modern music player application built with Angular and Electron, featuring a responsive interface optimized for desktops and kiosk-mode operation.

## Table of contents

- [Overview](#overview)
- [Tech stack](#tech-stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Running in development](#running-in-development)
- [Production build](#production-build)
- [Project structure](#project-structure)
- [Available scripts](#available-scripts)
- [Features](#features)
- [Electron configuration](#electron-configuration)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Linux deployment (Kiosk)](#linux-deployment-kiosk)
- [Roadmap](#roadmap)

## Overview

The project is an elegant music player, organized around the **Artist → Album → Tracks** hierarchy, featuring:

- **Frontend** built with Angular standalone components
- **Responsive design** optimized for 1024x768 resolution
- **Angular Material** for high-quality UI components
- **Electron** for running as a native desktop application
- **TypeScript** and **SCSS** for type safety and scalable styling
- **Material Icons** for intuitive player controls

## Tech stack

| Layer              | Technology                           |
| ------------------ | ------------------------------------ |
| Framework          | Angular (standalone components)      |
| UI                 | Angular Material (Indigo/Pink theme) |
| Desktop runtime    | Electron                             |
| Language           | TypeScript                           |
| Styling            | SCSS                                 |
| Development server | Express                              |

## Requirements

- **Node.js 22.13.1+**
- **npm 12.0.2+**

## Installation

```bash
npm install
```

## Running in development

**Web (browser):**

```bash
npm start
```

The app is available at `http://localhost:4200/`.

**Desktop (Electron):**

```bash
npm run electron:dev
```

Starts Angular in dev mode and opens the Electron window pointing to the same dev server, at the default 1024x768 resolution.

## Production build

**Web:**

```bash
npm run build
```

The generated artifacts are placed in the `dist/kiosk-music-player` folder.

**Desktop:**

```bash
npm run electron:build
```

Builds the desktop executable via `electron-builder`.

## Project structure

```
.
├── src/
│   ├── app/
│   │   ├── music-player/
│   │   │   ├── music-player.component.ts
│   │   │   ├── music-player.component.html
│   │   │   └── music-player.component.scss
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── electron/
│   ├── main.ts        # 1024x768 window configuration
│   └── preload.ts
├── public/
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

## Available scripts

| Script                        | Description                                   |
| ----------------------------- | --------------------------------------------- |
| `npm start`                   | Starts the Angular dev server on port 4200    |
| `npm run build`               | Generates a production build                  |
| `npm run watch`               | Build in watch mode                           |
| `npm test`                    | Runs tests with Karma/Jasmine                 |
| `npm run electron:dev`        | Starts Angular and Electron simultaneously    |
| `npm run electron:build`      | Builds the desktop app executable             |
| `npm run electron:build-main` | Compiles the Electron main process TypeScript |

## Features

- ✨ **Responsive design** — fluid interface using percentage-based dimensions to adapt to different resolutions
- 🎵 **Library navigation** — Artist → Album → Tracks hierarchy, with no need to manage playlists
- 🎨 **Custom theme** — purple/pink palette with modern gradients
- 📱 **Optimized resolution** — minimum size of 800x600, default 1024x768
- 🚀 **Native desktop** — packageable as an Electron app for macOS, Windows, and Linux

## Electron configuration

The Electron window is configured with:

- **Default resolution**: 1024x768
- **Minimum resolution**: 800x600
- **Dynamic title**: `NightShade's Music Player - {version}`
- **Context isolation** and other security best practices enabled

## Development

### Adding new components

```bash
ng generate component components/new-component
```

### Styles

Styles use SCSS with a percentage-based design system for responsiveness:

- Neutral colors and modern gradients
- Typography with Inter and Segoe UI
- Grid layout with media queries for smaller screens

### Icons

Material icons are imported automatically. Usage:

```html
<mat-icon>icon_name</mat-icon>
```

Full list available at [Material Symbols & Icons](https://fonts.google.com/icons).

## Troubleshooting

**Icons not showing up?**

- Check that the Material Icons import is present in `src/index.html`
- Clear your browser cache

**Node version error?**

```bash
nvm install 22.13.1
nvm use 22.13.1
```

**`npm install` failing?**

```bash
rm -rf node_modules package-lock.json
npm install
```

## Linux deployment (Kiosk)

The project is optimized to run as a **music kiosk** on a dedicated Linux image, booting directly into the application interface instead of the system desktop.

### Kiosk setup

1. **Install on the Linux machine**

   ```bash
   git clone <repository> kiosk-music-player
   cd kiosk-music-player

   npm install
   npm run electron:build
   ```

2. **Autostart in kiosk mode**
   - Configure automatic login and Electron startup alongside the graphical session (via `.desktop` autostart or a `systemd` service)
   - The app runs at the configured resolution (adjustable)
   - Interface optimized for reading at a distance

3. **Fullscreen mode**
   - Electron can be configured with `fullscreen: true` and `kiosk: true`
   - Hides the taskbar and system controls

4. **Remote management** (roadmap)
   - Update the music library via an HTTP endpoint
   - Sync content across instances
   - Monitor application health

### Requirements for Linux Kiosk

- Linux with Xorg or Wayland
- Node.js 22.13.1+
- ~500MB of disk space
- GPU with 2D/3D acceleration support (recommended)

## Roadmap

- Implement real audio playback (Web Audio API / native module)
- Automatic directory scanning to populate the library (e.g., `D:/music`)
- Playback history and favorites
- Sync between web and desktop
- REST API for remote kiosk management
- Instance monitoring dashboard
