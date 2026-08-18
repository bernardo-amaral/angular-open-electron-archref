import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('audioApi', {
  toMediaUrl: (filePath: string) =>
    `media://local/${encodeURIComponent(filePath)}`,
});
