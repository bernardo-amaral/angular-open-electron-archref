import { BrowserWindow, app, ipcMain, protocol, net } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { pathToFileURL } from 'url';
import * as pkg from '../package.json';

let mainWindow: BrowserWindow | null = null;

const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.wav', '.m4a', '.ogg', '.aac'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

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
  common: { title?: string; picture?: { format: string; data: Uint8Array }[] };
  format: { duration?: number };
}>;

let parseFileRef: ParseFileFn | null = null;

async function getParseFile(): Promise<ParseFileFn> {
  if (!parseFileRef) {
    const mm = await import('music-metadata');
    parseFileRef = mm.parseFile as unknown as ParseFileFn;
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
  protocol.handle('media', (request) => {
    const encodedPath = request.url.replace('media://local/', '');
    const filePath = decodeURIComponent(encodedPath);
    return net.fetch(pathToFileURL(filePath).toString());
  });
}

function toMediaUrl(filePath: string): string {
  return `media://local/${encodeURIComponent(filePath)}`;
}

function pictureToDataUrl(picture?: {
  format: string;
  data: Uint8Array;
}): string {
  if (!picture) return DEFAULT_COVER;
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
  let entries: Awaited<ReturnType<typeof fs.readdir>> | any = [];
  try {
    entries = await fs.readdir(albumPath, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.includes(ext)) continue;

    const baseName = path.parse(entry.name).name.toLowerCase();
    if (COVER_FILE_NAMES.includes(baseName)) {
      return path.join(albumPath, entry.name);
    }
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
        AUDIO_EXTENSIONS.includes(path.extname(entry.name).toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

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

      const title = metadata.common.title || path.parse(file.name).name;
      const duration = Math.round(metadata.format.duration ?? 0);

      if (needsEmbeddedCover) {
        const embeddedCover = pictureToDataUrl(metadata.common.picture?.[0]);
        if (embeddedCover) {
          albumCover = embeddedCover;
        }
      }

      tracks.push({
        title,
        duration,
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
  tracks.forEach((track) => {
    track.cover = finalCover;
  });

  return { title: albumName, cover: finalCover, tracks };
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
    albums.push(await scanAlbum(artistName, albumDir.name, albumPath));
  }

  albums.sort((a, b) => a.title.localeCompare(b.title));

  return {
    name: artistName,
    cover: albums.find((a) => a.cover)?.cover ?? DEFAULT_COVER,
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
    artists.push(await scanArtist(artistDir.name, artistPath));
  }

  artists.sort((a, b) => a.name.localeCompare(b.name));
  return artists;
}

function registerLibraryHandlers(): void {
  ipcMain.handle('library:scan', async () => {
    const musicsDir = path.join(app.getAppPath(), 'musics');

    try {
      return await scanLibrary(musicsDir);
    } catch (error) {
      console.error('Falha ao escanear a biblioteca musical:', error);
      return [];
    }
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
    `file://${path.join(__dirname, '../dist/kiosk-music-player/browser/index.html')}`;

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
