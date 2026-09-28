import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NAV_LINKS } from '../../shared/nav-links';
import { RouterLinks } from '../../shared/router-links.enum';
import { Site } from '../../shared/site.enum';

@Component({
  imports: [RouterLink],
  selector: 'app-footer',
  styleUrl: './footer.scss',
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly links = NAV_LINKS;
  protected readonly siteTitle = Site.TITLE;
  protected readonly privacyPolicyLink = `/${RouterLinks.PRIVACY_POLICY}`;
  protected readonly termsOfUseLink = `/${RouterLinks.TERMS_OF_USE}`;
  protected readonly year = new Date().getFullYear();
}
