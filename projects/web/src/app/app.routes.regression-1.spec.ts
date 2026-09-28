// Regression: ISSUE-001 — detail pages had no title, so a direct load showed the bare site name
// and in-app navigation kept the previous page's title.
// Found by /qa on 2026-09-28
// Report: .gstack/qa-reports/qa-report-localhost-2026-09-28.md
import { Routes } from '@angular/router';
import { routes } from './app.routes';
import { RouterLinks } from './shared/router-links.enum';

describe('detail route titles', () => {
  const sections = [
    RouterLinks.BRONZES,
    RouterLinks.STATUES,
    RouterLinks.GLASS,
    RouterLinks.EVENTS,
    RouterLinks.MEDIA,
  ];

  for (const path of sections) {
    it(`should title /${path}/:id`, async () => {
      const section = routes.find((r) => r.path === path);
      const children =
        section?.children ?? (await (section?.loadChildren as () => Promise<Routes>)());
      const list = children?.find((r) => r.path === '');
      const detail = children?.find((r) => r.path === ':id');
      expect(list?.title).toBeTruthy();
      // A static title, or a resolver that names the page after its document.
      expect(detail?.title).toBeTruthy();
    });
  }
});
