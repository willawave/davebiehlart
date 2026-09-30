import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouterLinks } from '../../shared/router-links.enum';

// Where Dave's public work is on permanent display.
@Component({
  imports: [RouterLink],
  selector: 'app-home-places',
  styleUrl: './home-places.scss',
  template: `
    <section aria-labelledby="places-title">
      <p class="label">On permanent display</p>
      <h2 id="places-title">Where to see it</h2>
      <ul>
        @for (place of places; track place) {
          <li>{{ place }}</li>
        }
      </ul>
      <a class="more" [routerLink]="['/', links.STATUES]">See the statues</a>
    </section>
  `,
})
export class HomePlaces {
  protected readonly links = RouterLinks;
  protected readonly places = [
    'Henry Doorly Zoo',
    'Stuhr Museum',
    'Hastings Museum',
    'The Archway',
    'Hastings College',
    'Adams Central High School',
    'Lexington High School',
    'Downtown Hastings',
  ];
}
