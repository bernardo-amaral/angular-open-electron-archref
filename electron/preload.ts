import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('audioApi', {
  toMediaUrl: (filePath: string) =>
    `media://local/${encodeURIComponent(filePath)}`,
});

contextBridge.exposeInMainWorld('libraryApi', {
  scan: () => ipcRenderer.invoke('library:scan'),
});
