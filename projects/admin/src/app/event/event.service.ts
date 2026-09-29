import { Service, inject } from '@angular/core';
import { EventDocument, EventFormModel } from 'core';
import { FIRESTORE } from 'core/firebase';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

// Singular, as in production.
const COLLECTION = 'event';

export type EventFormValue = ReturnType<EventFormModel['eventForm']>;

// The document written for a form value. Lists every field so nothing else (like `id`)
// ever reaches Firestore; the shape must match production (core's EventDocument).
export function toEventDocument(value: EventFormValue): EventDocument {
  const { location, date } = value;
  return {
    // The start of the day, as the datepicker picks it. A new event's untouched default is
    // `new Date()`, whose time of day would skew isUpcoming, sorting, and the shown date.
    date: Timestamp.fromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate())),
    description: value.description.trim(),
    link: value.link.trim() || null,
    location: {
      city: location.city.trim(),
      latitude: location.latitude,
      longitude: location.longitude,
      state: location.state.trim(),
      street: location.street.trim(),
      venue: location.venue.trim(),
    },
    name: value.name.trim(),
    time: value.time.trim(),
    visible: value.visible,
  };
}

export function toEventFormValue(item: EventDocument): EventFormValue {
  const { location } = item;
  return {
    date: item.date.toDate(),
    description: item.description,
    link: item.link ?? '',
    location: {
      city: location.city,
      latitude: location.latitude,
      longitude: location.longitude,
      state: location.state,
      street: location.street,
      venue: location.venue,
    },
    name: item.name,
    time: item.time,
    visible: item.visible,
  };
}

function withId(snapshot: { id: string; data(): unknown }): EventDocument {
  return { ...(snapshot.data() as EventDocument), id: snapshot.id };
}

@Service()
export class EventService {
  private readonly firestore = inject(FIRESTORE);

  // Every event, hidden ones included (admins may list the whole collection), latest first.
  async getAll(): Promise<EventDocument[]> {
    const snapshot = await getDocs(collection(this.firestore, COLLECTION));
    return snapshot.docs.map(withId).sort((a, b) => b.date.toMillis() - a.date.toMillis());
  }

  async getById(id: string): Promise<EventDocument | null> {
    const snapshot = await getDoc(doc(this.firestore, COLLECTION, id));
    return snapshot.exists() ? withId(snapshot) : null;
  }

  async add(value: EventFormValue): Promise<string> {
    const ref = await addDoc(collection(this.firestore, COLLECTION), toEventDocument(value));
    return ref.id;
  }

  async update(id: string, value: EventFormValue): Promise<void> {
    await updateDoc(doc(this.firestore, COLLECTION, id), { ...toEventDocument(value) });
  }

  async delete(item: EventDocument): Promise<void> {
    if (!item.id) throw new Error('Cannot delete an event without an id.');
    await deleteDoc(doc(this.firestore, COLLECTION, item.id));
  }
}
