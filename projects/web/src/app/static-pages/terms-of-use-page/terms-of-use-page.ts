import { Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { setPageMeta } from '../../shared/page-meta';
import { RouterLinks } from '../../shared/router-links.enum';
import { Site } from '../../shared/site.enum';

@Component({
  imports: [RouterLink],
  selector: 'app-terms-of-use-page',
  styleUrl: './terms-of-use-page.scss',
  templateUrl: './terms-of-use-page.html',
})
export class TermsOfUsePage {
  protected readonly updated = 'September 29, 2026';
  protected readonly contactLink = `/${RouterLinks.CONTACT}`;
  protected readonly privacyPolicyLink = `/${RouterLinks.PRIVACY_POLICY}`;

  constructor() {
    setPageMeta(inject(Meta), {
      title: `Terms of Use | ${Site.TITLE}`,
      description:
        "Terms for using Dave Biehl Art's website, including copyright on Dave Biehl's artwork and photos.",
      path: `/${RouterLinks.TERMS_OF_USE}`,
    });
  }
}
