import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { formatEventTime } from 'core';
import { setPageMeta } from '../../shared/page-meta';
import { RouterLinks } from '../../shared/router-links.enum';
import { Site } from '../../shared/site.enum';
import { EventStore } from '../event.store';

// Upcoming events only, soonest first, as a ledger: a date block, then name, time and
// place. Most of the time there are none, so the empty state points somewhere useful.
@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-event-list',
  styleUrl: './event-list.scss',
  templateUrl: './event-list.html',
})
export class EventList {
  protected readonly store = inject(EventStore);
  protected readonly formatTime = formatEventTime;
  protected readonly contactLink = `/${RouterLinks.CONTACT}`;

  constructor() {
    void this.store.loadUpcoming();
    setPageMeta(inject(Meta), {
      title: `Events | ${Site.TITLE}`,
      description: 'Upcoming shows, open studios and dedications with artist Dave Biehl.',
      path: `/${RouterLinks.EVENTS}`,
    });
  }
}
