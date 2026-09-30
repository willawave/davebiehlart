import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NAV_LINKS } from '../../shared/nav-links';
import { RouterLinks } from '../../shared/router-links.enum';

// The site's sections as big type, then a closing call to commission a piece.
@Component({
  imports: [RouterLink],
  selector: 'app-home-explore',
  styleUrl: './home-explore.scss',
  template: `
    <nav class="explore" aria-labelledby="explore-title">
      <h2 id="explore-title" class="label">Explore</h2>
      <ol>
        @for (link of sections; track link.path) {
          <li>
            <a [routerLink]="link.path">
              <span class="index" aria-hidden="true">{{ link.index }}</span>
              {{ link.label }}
              <span class="arrow" aria-hidden="true">→</span>
            </a>
          </li>
        }
      </ol>
    </nav>

    <section class="commission" aria-labelledby="commission-title">
      <p class="label">Commissions</p>
      <h2 id="commission-title">Have a horse, a herd, or a moment worth <em>casting</em>?</h2>
      <a class="btn" [routerLink]="['/', links.CONTACT]">Talk with Dave</a>
    </section>
  `,
})
export class HomeExplore {
  protected readonly links = RouterLinks;
  // Home is this page, and Contact gets its own call to action below.
  protected readonly sections = NAV_LINKS.filter(
    (link) => link.path !== '/' && link.path !== `/${RouterLinks.CONTACT}`,
  ).map((link, i) => ({ ...link, index: String(i + 1).padStart(2, '0') }));
}
