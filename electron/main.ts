import { BrowserWindow, app, ipcMain } from 'electron';
import * as path from 'path';
import * as pkg from '../package.json';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const version = (pkg as any).version || '0.0.0';
  const appTitle = `NightShade's Music Player - ${version}`;

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setTitle(appTitle);

  const startUrl =
    process.env['ELECTRON_START_URL'] ||
    `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
