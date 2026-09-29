import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatEventTime, isUpcoming } from 'core';
import { SinglePointMap } from '../../shared/single-point-map/single-point-map';
import { EventStore } from '../event.store';

// eventDetailResolver has already loaded the event, or sent the visitor to not found.
// Laid out like a statue page: heading, date line, description, then where it is. A past
// event (an old shared link) still renders, saying it has ended.
@Component({
  imports: [DatePipe, RouterLink, SinglePointMap],
  selector: 'app-event-detail',
  styleUrl: './event-detail.scss',
  templateUrl: './event-detail.html',
})
export class EventDetail {
  protected readonly store = inject(EventStore);
  protected readonly formatTime = formatEventTime;
  protected readonly ended = computed(() => {
    const event = this.store.selectedEvent();
    return event ? !isUpcoming(event, Date.now()) : false;
  });
}
