import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouterLinks } from '../../shared/router-links.enum';

// The home page's opening band: a dark, bronze-lit headline over the horse mark.
@Component({
  imports: [RouterLink],
  selector: 'app-home-hero',
  styleUrl: './home-hero.scss',
  template: `
    <div class="mark" aria-hidden="true"></div>
    <div class="inner">
      <p class="label">Dave Biehl · Bronze sculptor · Nebraska</p>
      <h1>Shaped by the <em>Nebraska</em> plains.</h1>
      <p class="sub">
        Rancher's son, veterinarian, self-taught sculptor. Horses, cattle and wildlife in bronze,
        from miniatures to life-size.
      </p>
      <div class="ctas">
        <a class="btn primary" [routerLink]="['/', links.BRONZES]">See the bronzes</a>
        <a class="btn" [routerLink]="['/', links.CONTACT]">Commission a piece</a>
      </div>
    </div>
  `,
})
export class HomeHero {
  protected readonly links = RouterLinks;
}
