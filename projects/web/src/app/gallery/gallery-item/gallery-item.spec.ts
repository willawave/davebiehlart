import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { GalleryDocument } from 'core';
import { galleryItem } from '../gallery.testing';
import { GalleryItem } from './gallery-item';

const previous = signal<GalleryDocument | null>(null);
const next = signal<GalleryDocument | null>(null);

@Component({
  imports: [GalleryItem],
  template: `<app-gallery-item
    [item]="item"
    kind="Bronze"
    sectionLabel="bronzes"
    [previous]="previous()"
    [next]="next()"
  />`,
})
class DetailPage {
  protected readonly item = galleryItem({ id: 'b', name: 'Middle' });
  protected readonly previous = previous;
  protected readonly next = next;
}

describe('GalleryItem pager', () => {
  let harness: RouterTestingHarness;
  const pager = () => harness.routeNativeElement?.querySelector('nav[aria-label="More bronzes"]');

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'bronzes/:id', component: DetailPage }])],
    });
    harness = await RouterTestingHarness.create();
  });

  it('should link to the newer and older neighbors in the same section', async () => {
    previous.set(galleryItem({ id: 'a', name: 'Newer' }));
    next.set(galleryItem({ id: 'c', name: 'Older' }));
    await harness.navigateByUrl('/bronzes/b');

    const prev = pager()?.querySelector<HTMLAnchorElement>('a[rel="prev"]');
    const nxt = pager()?.querySelector<HTMLAnchorElement>('a[rel="next"]');
    expect(prev?.getAttribute('href')).toBe('/bronzes/a');
    expect(prev?.textContent).toContain('Previous');
    expect(prev?.textContent).toContain('Newer');
    expect(nxt?.getAttribute('href')).toBe('/bronzes/c');
    expect(nxt?.textContent).toContain('Older');
  });

  it('should leave out the missing side at either end', async () => {
    previous.set(null);
    next.set(galleryItem({ id: 'c', name: 'Older' }));
    await harness.navigateByUrl('/bronzes/b');

    expect(pager()?.querySelector('a[rel="prev"]')).toBeNull();
    expect(pager()?.querySelector('a[rel="next"]')).not.toBeNull();
  });

  it('should render no pager without neighbors', async () => {
    previous.set(null);
    next.set(null);
    await harness.navigateByUrl('/bronzes/b');
    expect(pager()).toBeNull();
  });
});

describe('GalleryItem', () => {
  let fixture: ComponentFixture<GalleryItem>;
  let element: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(GalleryItem);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('kind', 'Bronze');
  });

  function dimensions(): string[] {
    return Array.from(element.querySelectorAll('dt'), (dt) =>
      `${dt.textContent}: ${dt.nextElementSibling?.textContent}`.trim(),
    );
  }

  it('should show the name, date line, description, photos and dimensions', async () => {
    fixture.componentRef.setInput('item', galleryItem());
    await fixture.whenStable();

    expect(element.querySelector('h1')?.textContent).toBe('Mustang at Dawn');
    expect(element.querySelector('.kicker')?.textContent?.trim()).toBe(
      'Bronze · Created March 2024',
    );
    expect(element.querySelector('.description')?.textContent).toBe(
      'Cast bronze on a walnut base.',
    );
    expect(element.querySelectorAll('app-image-track img').length).toBe(2);
    expect(dimensions()).toEqual([
      'Height: 18 in',
      'Width: 22 in',
      'Depth: 9 in',
      'Weight: 34 lbs',
    ]);
  });

  it('should leave out an empty description, no photos, and no weight', async () => {
    fixture.componentRef.setInput(
      'item',
      galleryItem({ description: '', imageUrls: [], weight: null }),
    );
    await fixture.whenStable();

    expect(element.querySelector('.description')).toBeNull();
    expect(element.querySelector('app-image-track')).toBeNull();
    expect(dimensions()).not.toContain('Weight: null lbs');
    expect(element.querySelectorAll('dt').length).toBe(3);
  });
});
