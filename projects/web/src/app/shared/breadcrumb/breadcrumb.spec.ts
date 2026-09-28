import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Breadcrumb, detailBreadcrumb } from './breadcrumb';

@Component({ template: '<app-breadcrumb />', imports: [Breadcrumb] })
class Page {}

const routes: Routes = [
  { path: '', component: Page },
  {
    path: 'bronzes',
    data: { breadcrumb: 'Bronzes' },
    children: [
      { path: '', component: Page },
      { path: ':id', component: Page, data: { breadcrumb: detailBreadcrumb } },
    ],
  },
  {
    path: 'statues/:id',
    component: Page,
    resolve: { statue: () => ({ name: 'Rearing Stallion' }) },
    data: { breadcrumb: detailBreadcrumb },
  },
  { path: 'contact', component: Page, data: { breadcrumb: 'Contact' } },
  { path: '**', component: Page },
];

describe('Breadcrumb', () => {
  let harness: RouterTestingHarness;

  function crumbs(): { text: string; href: string | null; current: boolean }[] {
    const items = harness.routeNativeElement?.querySelectorAll('li') ?? [];
    return Array.from(items, (li) => {
      const link = li.querySelector('a');
      return {
        text: li.textContent?.trim() ?? '',
        href: link?.getAttribute('href') ?? null,
        current: !!li.querySelector('[aria-current="page"]'),
      };
    });
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    harness = await RouterTestingHarness.create();
  });

  it('should render nothing on the home page', async () => {
    await harness.navigateByUrl('/');
    expect(harness.routeNativeElement?.querySelector('nav')).toBeNull();
  });

  it('should render nothing on a page without a breadcrumb', async () => {
    await harness.navigateByUrl('/nowhere');
    expect(harness.routeNativeElement?.querySelector('nav')).toBeNull();
  });

  it('should show Home and the section on a list page', async () => {
    await harness.navigateByUrl('/bronzes');
    expect(harness.routeNativeElement?.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Breadcrumb',
    );
    expect(crumbs()).toEqual([
      { text: 'Home', href: '/', current: false },
      { text: 'Bronzes', href: null, current: true },
    ]);
  });

  it('should not repeat the section for its empty-path child', async () => {
    await harness.navigateByUrl('/bronzes');
    expect(crumbs().map((c) => c.text)).toEqual(['Home', 'Bronzes']);
  });

  it('should fall back to "Details" on a detail page with no resolved document', async () => {
    await harness.navigateByUrl('/bronzes/abc');
    expect(crumbs()).toEqual([
      { text: 'Home', href: '/', current: false },
      { text: 'Bronzes', href: '/bronzes', current: false },
      { text: 'Details', href: null, current: true },
    ]);
  });

  it('should name a detail page after its resolved document', async () => {
    await harness.navigateByUrl('/statues/xyz');
    expect(crumbs().at(-1)).toEqual({ text: 'Rearing Stallion', href: null, current: true });
  });

  it('should update after navigating', async () => {
    await harness.navigateByUrl('/bronzes');
    await harness.navigateByUrl('/contact');
    expect(crumbs().map((c) => c.text)).toEqual(['Home', 'Contact']);
  });
});

describe('detailBreadcrumb', () => {
  const label = detailBreadcrumb as (data: object) => string;

  it('should use a media title', () => {
    expect(label({ media: { title: 'Interview' } })).toBe('Interview');
  });

  it('should skip non-document values', () => {
    expect(label({ resolver: true, doc: { name: 'Bison' } })).toBe('Bison');
  });

  it('should fall back when the name is empty', () => {
    expect(label({ doc: { name: '' } })).toBe('Details');
  });
});
