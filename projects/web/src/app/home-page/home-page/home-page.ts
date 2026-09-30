import { Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { setPageMeta } from '../../shared/page-meta';
import { Site } from '../../shared/site.enum';
import { HomeExplore } from '../home-explore/home-explore';
import { HomeHero } from '../home-hero/home-hero';
import { HomePlaces } from '../home-places/home-places';
import { HomeStory } from '../home-story/home-story';

// Static by design: no artwork photos (not every upload is hero quality), so the page is
// type, the horse mark and CSS motion. It reads no data.
@Component({
  imports: [HomeHero, HomeStory, HomePlaces, HomeExplore],
  selector: 'app-home-page',
  styleUrl: './home-page.scss',
  templateUrl: './home-page.html',
})
export class HomePage {
  constructor() {
    setPageMeta(inject(Meta), {
      title: Site.TITLE,
      description:
        'Bronze sculpture by Nebraska artist Dave Biehl: horses, cattle and wildlife, from miniatures to life-size public works. Commissions welcome.',
      path: '/',
    });
  }
}
