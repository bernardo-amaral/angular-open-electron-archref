import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Howl } from 'howler';

declare global {
  interface Window {
    audioApi: {
      toMediaUrl: (filePath: string) => string;
    };
  }
}

export interface Track {
  title: string;
  duration: number; // segundos
  path: string;
  artist: string;
  album: string;
  cover: string;
}

export interface Album {
  title: string;
  cover: string;
  tracks: Track[];
}

export interface Artist {
  name: string;
  cover: string;
  albums: Album[];
}

type LibraryView = 'artists' | 'albums' | 'tracks';
type LayoutMode = 'grid' | 'list';

declare global {
  interface Window {
    audioApi: { toMediaUrl: (filePath: string) => string };
    libraryApi: { scan: () => Promise<Artist[]> };
  }
}

@Component({
  selector: 'app-music-player',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    MatSliderModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './music-player.component.html',
  styleUrl: './music-player.component.scss',
})
export class MusicPlayerComponent implements OnDestroy {
  library: Artist[] = [];
  isLoadingLibrary = true;

  async ngOnInit(): Promise<void> {
    try {
      this.library = await window.libraryApi.scan();
    } catch (error) {
      console.error('Falha ao carregar a biblioteca musical:', error);
    } finally {
      this.isLoadingLibrary = false;
    }
  }

  view: LibraryView = 'artists';
  selectedArtist: Artist | null = null;
  selectedAlbum: Album | null = null;

  layout: LayoutMode = 'grid';
  searchTerm = '';
  sortAscending = true;

  private sound: Howl | null = null;
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  currentTrack: Track | null = null;
  isPlaying = false;
  currentTime = 0;
  shuffle = false;
  repeat = false;
  volume = 80;

  get filteredArtists(): Artist[] {
    const term = this.searchTerm.trim().toLowerCase();
    const list = term
      ? this.library.filter((a) => a.name.toLowerCase().includes(term))
      : this.library;

    return [...list].sort((a, b) =>
      this.sortAscending
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name),
    );
  }

  get sectionTitle(): string {
    if (this.view === 'artists') return 'Artistas';
    if (this.view === 'albums') return this.selectedArtist?.name ?? 'Álbuns';
    return this.selectedAlbum?.title ?? 'Músicas';
  }

  get sectionCount(): string {
    if (this.view === 'artists')
      return `${this.filteredArtists.length} artistas`;
    if (this.view === 'albums')
      return `${this.selectedArtist?.albums.length ?? 0} álbuns`;
    return `${this.selectedAlbum?.tracks.length ?? 0} músicas`;
  }

  setLayout(mode: LayoutMode): void {
    this.layout = mode;
  }

  toggleSort(): void {
    this.sortAscending = !this.sortAscending;
  }

  goToArtists(): void {
    this.selectedArtist = null;
    this.selectedAlbum = null;
    this.view = 'artists';
  }

  selectArtist(artist: Artist): void {
    this.selectedArtist = artist;
    this.selectedAlbum = null;
    this.view = 'albums';
  }

  selectAlbum(album: Album): void {
    this.selectedAlbum = album;
    this.view = 'tracks';
  }

  goBack(): void {
    if (this.view === 'tracks') {
      this.selectedAlbum = null;
      this.view = 'albums';
    } else if (this.view === 'albums') {
      this.selectedArtist = null;
      this.view = 'artists';
    }
  }

  playTrack(track: Track): void {
    this.stopProgressTracking();
    this.sound?.unload();

    this.currentTrack = track;
    this.currentTime = 0;

    const mediaUrl = window.audioApi.toMediaUrl(track.path);

    this.sound = new Howl({
      src: [mediaUrl],
      html5: true,
      volume: this.volume / 100,
      onplay: () => {
        this.isPlaying = true;
        this.startProgressTracking();
      },
      onpause: () => {
        this.isPlaying = false;
        this.stopProgressTracking();
      },
      onstop: () => {
        this.isPlaying = false;
        this.stopProgressTracking();
      },
      onend: () => {
        this.isPlaying = false;
        this.stopProgressTracking();
        this.next();
      },
      onloaderror: (_id, error) => {
        console.error('Falha ao carregar a faixa:', track.path, error);
      },
      onplayerror: (_id, error) => {
        console.error('Falha ao reproduzir a faixa:', track.path, error);
      },
    });

    this.sound.play();
  }

  togglePlay(): void {
    if (!this.sound) return;

    if (this.isPlaying) {
      this.sound.pause();
    } else {
      this.sound.play();
    }
  }

  seekTo(seconds: number): void {
    if (!this.sound) return;
    this.sound.seek(seconds);
    this.currentTime = seconds;
  }

  setVolume(value: number): void {
    this.volume = value;
    this.sound?.volume(value / 100);
  }

  toggleShuffle(): void {
    this.shuffle = !this.shuffle;
  }

  toggleRepeat(): void {
    this.repeat = !this.repeat;
  }

  private get currentAlbumTracks(): Track[] {
    if (!this.currentTrack) return [];
    const artist = this.library.find(
      (a) => a.name === this.currentTrack!.artist,
    );
    const album = artist?.albums.find(
      (al) => al.title === this.currentTrack!.album,
    );
    return album?.tracks ?? [];
  }

  previous(): void {
    const tracks = this.currentAlbumTracks;
    if (!tracks.length || !this.currentTrack) return;
    const index = tracks.findIndex((t) => t.path === this.currentTrack!.path);
    const prevIndex = index > 0 ? index - 1 : tracks.length - 1;
    this.playTrack(tracks[prevIndex]);
  }

  next(): void {
    const tracks = this.currentAlbumTracks;
    if (!tracks.length || !this.currentTrack) return;
    const index = tracks.findIndex((t) => t.path === this.currentTrack!.path);
    const nextIndex = this.shuffle
      ? Math.floor(Math.random() * tracks.length)
      : index < tracks.length - 1
        ? index + 1
        : 0;
    this.playTrack(tracks[nextIndex]);
  }

  isCurrentTrack(track: Track): boolean {
    return this.currentTrack?.path === track.path;
  }

  private startProgressTracking(): void {
    this.stopProgressTracking();
    this.progressInterval = setInterval(() => {
      if (this.sound && this.isPlaying) {
        this.currentTime = this.sound.seek() as number;
      }
    }, 500);
  }

  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.stopProgressTracking();
    this.sound?.unload();
  }
}
