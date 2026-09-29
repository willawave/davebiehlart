import { Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { setPageMeta } from '../../shared/page-meta';
import { RouterLinks } from '../../shared/router-links.enum';
import { Site } from '../../shared/site.enum';

// The third parties a visitor's browser talks to. Keep in sync with the site's actual
// requests (Firebase, the maps' OSM tiles, the media pages' YouTube embeds).
const SERVICES = [
  {
    name: 'Google Firebase',
    use: 'hosts the site, its content, and the artwork photos.',
    policy: 'https://firebase.google.com/support/privacy',
  },
  {
    name: 'OpenStreetMap',
    use: 'supplies the map tiles on statue and event pages.',
    policy: 'https://osmfoundation.org/wiki/Privacy_Policy',
  },
  {
    name: 'YouTube',
    use: "plays videos on the Media page in privacy-enhanced mode (youtube-nocookie.com), loaded only on a video's page.",
    policy: 'https://policies.google.com/privacy',
  },
];

@Component({
  imports: [RouterLink],
  selector: 'app-privacy-policy-page',
  styleUrl: './privacy-policy-page.scss',
  templateUrl: './privacy-policy-page.html',
})
export class PrivacyPolicyPage {
  protected readonly updated = 'September 29, 2026';
  protected readonly services = SERVICES;
  protected readonly contactLink = `/${RouterLinks.CONTACT}`;

  constructor() {
    setPageMeta(inject(Meta), {
      title: `Privacy Policy | ${Site.TITLE}`,
      description:
        'How Dave Biehl Art handles your privacy: no accounts, no analytics, and no tracking cookies.',
      path: `/${RouterLinks.PRIVACY_POLICY}`,
    });
  }
}
