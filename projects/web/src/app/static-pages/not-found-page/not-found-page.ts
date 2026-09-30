import { DOCUMENT } from '@angular/common';
import { Component, RESPONSE_INIT, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NAV_LINKS } from '../../shared/nav-links';
import { setCanonical } from '../../shared/page-meta';
import { setStructuredData } from '../../shared/structured-data';

@Component({
  imports: [RouterLink],
  selector: 'app-not-found-page',
  styleUrl: './not-found-page.scss',
  templateUrl: './not-found-page.html',
})
export class NotFoundPage {
  // Home already has its own link above the list.
  protected readonly links = NAV_LINKS.filter((link) => link.path !== '/');

  constructor() {
    // Server rendering only (null in the browser): answer with a real 404, not a soft 404
    // that search engines would index.
    const responseInit = inject(RESPONSE_INIT, { optional: true });
    if (responseInit) {
      responseInit.status = 404;
    }
    // A client-side visit can arrive from a page that set these; they don't describe this one.
    const document = inject(DOCUMENT);
    setCanonical(document, null);
    setStructuredData(document, 'ld-page', null);
  }
}
