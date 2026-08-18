import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

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
export class MusicPlayerComponent {
  // --- Biblioteca (resultado da varredura de D:/musicas) ---
  library: Artist[] = [
    {
      name: 'Wu-Tang Clan',
      cover:
        'https://s2-oglobo.glbimg.com/ur-lS-fAyjWPY2VYEvsricBcwHE=/0x0:705x527/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_da025474c0c44edd99332dddb09cabe8/internal_photos/bs/2023/Y/t/x4Zzo3SVC0RL8tz105Dg/wu-tang-clan.png',
      albums: [
        {
          title: 'Enter the Wu-Tang (36 Chambers)',
          cover:
            'https://upload.wikimedia.org/wikipedia/pt/thumb/d/d1/Enter_the_Wu-Tang.jpg/250px-Enter_the_Wu-Tang.jpg',
          tracks: [
            {
              title: 'C.R.E.A.M.',
              duration: 246,
              path: 'D:/musicas/Wu-Tang Clan/Enter the Wu-Tang (36 Chambers)/cream.mp3',
              artist: 'Wu-Tang Clan',
              album: 'Enter the Wu-Tang (36 Chambers)',
              cover:
                'https://upload.wikimedia.org/wikipedia/pt/thumb/d/d1/Enter_the_Wu-Tang.jpg/250px-Enter_the_Wu-Tang.jpg',
            },
            {
              title: 'Method Man',
              duration: 212,
              path: 'D:/musicas/Wu-Tang Clan/Enter the Wu-Tang (36 Chambers)/method_man.mp3',
              artist: 'Wu-Tang Clan',
              album: 'Enter the Wu-Tang (36 Chambers)',
              cover:
                'https://upload.wikimedia.org/wikipedia/pt/thumb/d/d1/Enter_the_Wu-Tang.jpg/250px-Enter_the_Wu-Tang.jpg',
            },
          ],
        },
      ],
    },
    {
      name: 'Eminem',
      cover:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYBEFDNttAFnoNjmgyQVcFm8F_GDMKy6GwPwgwsUOL-29NlNdEog5EvU6o&s=10',
      albums: [
        {
          title: 'The Eminem Show',
          cover:
            'https://upload.wikimedia.org/wikipedia/pt/3/35/The_Eminem_Show.jpg?utm_source=pt.wikipedia.org&utm_campaign=index&utm_content=original',
          tracks: [
            {
              title: 'Without Me',
              duration: 229,
              path: 'D:/musicas/Eminem/The Eminem Show/01 Without Me.mp3',
              artist: 'Eminem',
              album: 'The Eminem Show',
              cover:
                'https://upload.wikimedia.org/wikipedia/pt/3/35/The_Eminem_Show.jpg?utm_source=pt.wikipedia.org&utm_campaign=index&utm_content=original',
            },
          ],
        },
      ],
    },
    {
      name: 'Naughty By Nature',
      cover: 'https://miro.medium.com/v2/1*JcNdpXLnupuIKr4dyuPP6A.png',
      albums: [
        {
          title: 'Naughty Naughty III',
          cover:
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFlmVpfkK6hirFmQ4wfuBxjNwUDnO4vvSpbK_DccEz4hHOETzsLu-diCZc&s=10',
          tracks: [
            {
              title: 'Sleeping on ya kitten',
              duration: 280,
              path: 'D:/musicas/Naughty By Nature/Naughty Naughty III/01 Sleeping on ya kitten.mp3',
              artist: 'Naughty By Nature',
              album: 'Naughty Naughty III',
              cover:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFlmVpfkK6hirFmQ4wfuBxjNwUDnO4vvSpbK_DccEz4hHOETzsLu-diCZc&s=10',
            },
          ],
        },
      ],
    },
  ];

  // --- Estado de navegação da biblioteca ---
  view: LibraryView = 'artists';
  selectedArtist: Artist | null = null;
  selectedAlbum: Album | null = null;

  layout: LayoutMode = 'grid';
  searchTerm = '';
  sortAscending = true;

  // --- Estado do player ---
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
    this.currentTrack = track;
    this.currentTime = 0;
    this.isPlaying = true;
    // Aqui entra a chamada real ao serviço de áudio (Electron/Node) usando track.path
  }

  togglePlay(): void {
    if (!this.currentTrack) return;
    this.isPlaying = !this.isPlaying;
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
    const nextIndex = index < tracks.length - 1 ? index + 1 : 0;
    this.playTrack(tracks[nextIndex]);
  }

  isCurrentTrack(track: Track): boolean {
    return this.currentTrack?.path === track.path;
  }
}
