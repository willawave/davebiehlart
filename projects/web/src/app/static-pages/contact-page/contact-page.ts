import { Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { VisitHours } from '../../schedule/visit-hours/visit-hours';
import { setPageMeta } from '../../shared/page-meta';
import { RouterLinks } from '../../shared/router-links.enum';
import { Site } from '../../shared/site.enum';

// Lazily loaded (see app.routes.ts), so the gallery hours' Firestore read stays out of the
// initial bundle.
@Component({
  imports: [VisitHours],
  selector: 'app-contact-page',
  styleUrl: './contact-page.scss',
  templateUrl: './contact-page.html',
})
export class ContactPage {
  protected readonly email = Site.EMAIL;
  protected readonly emailHref = `mailto:${Site.EMAIL}?subject=${encodeURIComponent(Site.TITLE)}`;
  protected readonly phone = Site.PHONE;
  protected readonly phoneHref = Site.PHONE_HREF;

  constructor() {
    setPageMeta(inject(Meta), {
      title: `Contact | ${Site.TITLE}`,
      description:
        'Contact artist Dave Biehl about bronze sculptures, commissions, and gallery visits in Elkhorn, Nebraska.',
      path: `/${RouterLinks.CONTACT}`,
    });
  }
}
