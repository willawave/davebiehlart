import { Component, RESPONSE_INIT, inject } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-not-found-page',
  styleUrl: './not-found-page.scss',
  templateUrl: './not-found-page.html',
})
export class NotFoundPage {
  constructor() {
    // Server rendering only (null in the browser): answer with a real 404, not a soft 404
    // that search engines would index.
    const responseInit = inject(RESPONSE_INIT, { optional: true });
    if (responseInit) {
      responseInit.status = 404;
    }
  }
}
