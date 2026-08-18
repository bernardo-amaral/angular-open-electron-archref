import { Component } from '@angular/core';
import { MusicPlayerComponent } from './music-player/music-player.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MusicPlayerComponent],
  template: '<app-music-player></app-music-player>',
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }
    `,
  ],
})
export class AppComponent {}
