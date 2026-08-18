import { BrowserWindow, app, protocol, net } from 'electron';
import * as path from 'path';
import { pathToFileURL } from 'url';
import * as pkg from '../package.json';

let mainWindow: BrowserWindow | null = null;

// O registro de esquemas privilegiados precisa ocorrer ANTES do app.whenReady(),
// caso contrário o Electron ignora as flags de segurança/streaming do protocolo.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
    },
  },
]);

function registerMediaProtocol(): void {
  protocol.handle('media', (request) => {
    const encodedPath = request.url.replace('media://local/', '');
    const filePath = decodeURIComponent(encodedPath);

    return net.fetch(pathToFileURL(filePath).toString());
  });
}

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
    `file://${path.join(__dirname, '../dist/open-pdv/browser/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  registerMediaProtocol();
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
