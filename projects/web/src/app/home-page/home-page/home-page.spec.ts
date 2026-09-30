import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { HomePage } from './home-page';

describe('HomePage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('should show every section, with the hero holding the only h1', async () => {
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    for (const section of [
      'app-home-hero',
      'app-home-story',
      'app-home-places',
      'app-home-explore',
    ]) {
      expect(element.querySelector(section), section).not.toBeNull();
    }
    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(element.querySelector('app-home-hero h1')?.textContent).toBe(
      'Shaped by the Nebraska plains.',
    );
  });

  it('should set its description and share tags', () => {
    TestBed.createComponent(HomePage);
    const meta = TestBed.inject(Meta);
    expect(meta.getTag("name='description'")?.content).toContain('Nebraska artist Dave Biehl');
    expect(meta.getTag("property='og:title'")?.content).toBe('Dave Biehl Art');
    expect(meta.getTag("property='og:url'")?.content).toBe('https://davebiehlart.com/');
  });
});
