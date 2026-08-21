import { BrowserWindow, app, ipcMain, net, protocol } from 'electron';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as pkg from '../package.json';

let mainWindow: BrowserWindow | null = null;

const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.flac',
  '.wav',
  '.m4a',
  '.ogg',
  '.aac',
]);

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const COVER_FILE_NAMES = ['folder', 'cover', 'front', 'album', 'albumart'];
const DEFAULT_COVER = '';

export interface TrackDto {
  title: string;
  duration: number;
  path: string;
  artist: string;
  album: string;
  cover: string;
}

export interface AlbumDto {
  title: string;
  cover: string;
  tracks: TrackDto[];
}

export interface ArtistDto {
  name: string;
  cover: string;
  albums: AlbumDto[];
}

type ParseFileFn = (
  filePath: string,
  options?: { duration?: boolean; skipCovers?: boolean },
) => Promise<{
  common: {
    title?: string;
    picture?: { format: string; data: Uint8Array }[];
  };
  format: { duration?: number };
}>;

let parseFileRef: ParseFileFn | null = null;

async function getParseFile(): Promise<ParseFileFn> {
  if (!parseFileRef) {
    const metadata = await import('music-metadata');
    parseFileRef = metadata.parseFile as unknown as ParseFileFn;
  }

  return parseFileRef;
}

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
  protocol.handle('media', async (request) => {
    const filePath = mediaUrlToFilePath(request.url);

    if (!filePath) {
      return new Response('Invalid media path', { status: 400 });
    }

    try {
      return await net.fetch(pathToFileURL(filePath).toString());
    } catch (error) {
      console.error(`Falha ao servir mídia: ${filePath}`, error);
      return new Response('Media not found', { status: 404 });
    }
  });
}

function toMediaUrl(filePath: string): string {
  return `media://local/${encodeURIComponent(filePath)}`;
}

function mediaUrlToFilePath(mediaUrl: string): string | null {
  const prefix = 'media://local/';

  if (!mediaUrl.startsWith(prefix)) {
    return null;
  }

  try {
    const encodedPath = mediaUrl.slice(prefix.length);
    return decodeURIComponent(encodedPath);
  } catch {
    return null;
  }
}

function pictureToDataUrl(picture?: {
  format: string;
  data: Uint8Array;
}): string {
  if (!picture?.data?.length) {
    return DEFAULT_COVER;
  }

  const base64 = Buffer.from(picture.data).toString('base64');
  return `data:${picture.format};base64,${base64}`;
}

async function isDirectory(fullPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(fullPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function findFolderCover(albumPath: string): Promise<string | null> {
  try {
    const entries = await fs.readdir(albumPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) continue;

      const extension = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(extension)) continue;

      const baseName = path.parse(entry.name).name.toLowerCase();
      if (COVER_FILE_NAMES.includes(baseName)) {
        return path.join(albumPath, entry.name);
      }
    }
  } catch (error) {
    console.error(`Falha ao procurar capa em: ${albumPath}`, error);
  }

  return null;
}

async function scanAlbum(
  artistName: string,
  albumName: string,
  albumPath: string,
): Promise<AlbumDto> {
  const parseFile = await getParseFile();
  const entries = await fs.readdir(albumPath, { withFileTypes: true });

  const audioFiles = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const folderCoverPath = await findFolderCover(albumPath);
  let albumCover = folderCoverPath
    ? toMediaUrl(folderCoverPath)
    : DEFAULT_COVER;

  const tracks: TrackDto[] = [];

  for (const file of audioFiles) {
    const filePath = path.join(albumPath, file.name);
    const needsEmbeddedCover = !albumCover;

    try {
      const metadata = await parseFile(filePath, {
        duration: true,
        skipCovers: !needsEmbeddedCover,
      });

      if (needsEmbeddedCover) {
        const embeddedCover = pictureToDataUrl(metadata.common.picture?.[0]);

        if (embeddedCover) {
          albumCover = embeddedCover;
        }
      }

      tracks.push({
        title: metadata.common.title || path.parse(file.name).name,
        duration: Math.round(metadata.format.duration ?? 0),
        path: filePath,
        artist: artistName,
        album: albumName,
        cover: '',
      });
    } catch (error) {
      console.error(`Falha ao ler metadados de "${filePath}":`, error);
    }
  }

  const finalCover = albumCover || DEFAULT_COVER;

  for (const track of tracks) {
    track.cover = finalCover;
  }

  return {
    title: albumName,
    cover: finalCover,
    tracks,
  };
}

async function scanArtist(
  artistName: string,
  artistPath: string,
): Promise<ArtistDto> {
  const entries = await fs.readdir(artistPath, { withFileTypes: true });
  const albumDirs = entries.filter((entry) => entry.isDirectory());
  const albums: AlbumDto[] = [];

  for (const albumDir of albumDirs) {
    const albumPath = path.join(artistPath, albumDir.name);
    const album = await scanAlbum(artistName, albumDir.name, albumPath);

    // Não exibe pastas que não possuem arquivos de áudio válidos.
    if (album.tracks.length > 0) {
      albums.push(album);
    }
  }

  albums.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { numeric: true }),
  );

  return {
    name: artistName,
    cover: albums.find((album) => album.cover)?.cover ?? DEFAULT_COVER,
    albums,
  };
}

async function scanLibrary(rootDir: string): Promise<ArtistDto[]> {
  if (!(await isDirectory(rootDir))) {
    console.warn(`Diretório de músicas não encontrado: ${rootDir}`);
    return [];
  }

  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const artistDirs = entries.filter((entry) => entry.isDirectory());
  const artists: ArtistDto[] = [];

  for (const artistDir of artistDirs) {
    const artistPath = path.join(rootDir, artistDir.name);
    const artist = await scanArtist(artistDir.name, artistPath);

    // Não exibe artistas sem álbuns com faixas válidas.
    if (artist.albums.length > 0) {
      artists.push(artist);
    }
  }

  artists.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true }),
  );
  return artists;
}

function getMusicDirectory(): string {
  // Durante o desenvolvimento, mantenha `musics` na raiz do projeto.
  if (!app.isPackaged) {
    return path.join(app.getAppPath(), 'musics');
  }

  // Em produção, mantenha as músicas fora do app.asar para facilitar atualização.
  return path.join(app.getPath('music'), 'kiosk-music-player');
}

function registerLibraryHandlers(): void {
  ipcMain.handle('library:scan', async () => {
    const musicsDir = getMusicDirectory();
    console.log(`Escaneando biblioteca: ${musicsDir}`);

    try {
      return await scanLibrary(musicsDir);
    } catch (error) {
      console.error('Falha ao escanear a biblioteca musical:', error);
      return [];
    }
  });
}

function getProductionIndexPath(): string {
  return path.join(
    app.getAppPath(),
    'dist',
    'kiosk-music-player',
    'index.html',
  );
}

function createWindow(): void {
  const version = (pkg as { version?: string }).version ?? '0.0.0';
  const appTitle = `NightShade's Music Player - ${version}`;
  const isKiosk = process.argv.includes('--kiosk');

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 600,
    useContentSize: true,
    fullscreen: true,
    resizable: false,
    autoHideMenuBar: true,
    kiosk: true,
    frame: false,
    backgroundColor: '#0f1d2a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setTitle(appTitle);

  const startUrl = process.env['ELECTRON_START_URL']
    ? process.env['ELECTRON_START_URL']
    : pathToFileURL(getProductionIndexPath()).toString();

  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app
  .whenReady()
  .then(() => {
    registerMediaProtocol();
    registerLibraryHandlers();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  })
  .catch((error) => {
    console.error('Erro ao inicializar o Electron:', error);
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
