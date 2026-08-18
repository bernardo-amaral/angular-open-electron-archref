import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-music-player',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatRippleModule,
    MatSliderModule,
  ],
  templateUrl: './music-player.component.html',
  styleUrl: './music-player.component.scss',
})
export class MusicPlayerComponent {
  currentTrack = {
    title: 'Midnight City',
    artist: 'M83',
    album: 'Hurry Up, We’re Dreaming',
    duration: 246,
    currentTime: 128,
    cover:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
  };

  playlist = [
    'Midnight City',
    'Electric Feel',
    'Starlight',
    'Dreams',
    'Summer Love',
  ];

  isPlaying = true;

  togglePlay(): void {
    this.isPlaying = !this.isPlaying;
  }

  previous(): void {
    console.log('Previous track');
  }

  next(): void {
    console.log('Next track');
  }
}
