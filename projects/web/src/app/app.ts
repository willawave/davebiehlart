import { Component, signal } from '@angular/core';
import { Navigation } from './shell/navigation/navigation';

@Component({
  imports: [Navigation],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('web');
}
