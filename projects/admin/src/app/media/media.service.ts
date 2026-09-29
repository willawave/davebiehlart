import { Service, inject } from '@angular/core';
import { MediaDocument, MediaFormModel, parseMediaLink } from 'core';
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

const COLLECTION = 'media';

export type MediaFormValue = ReturnType<MediaFormModel['mediaForm']>;

// The document written for a form value. Lists every field so nothing else (like `id`)
// ever reaches Firestore; the shape must match production (core's MediaDocument).
export function toMediaDocument(value: MediaFormValue): MediaDocument {
  const { date } = value;
  const link = parseMediaLink(value.link);
  // The form's mediaLink() validator already refused anything that doesn't parse.
  if (!link) throw new Error('Cannot save an invalid media link.');
  return {
    // The start of the day, as the datepicker picks it; the untouched default is `new Date()`.
    date: Timestamp.fromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate())),
    description: value.description.trim(),
    // A YouTube link in any form is saved as its watch URL, as production always stored it.
    link: link.url,
    title: value.title.trim(),
    visible: value.visible,
  };
}

export function toMediaFormValue(item: MediaDocument): MediaFormValue {
  return {
    date: item.date.toDate(),
    description: item.description,
    link: item.link,
    title: item.title,
    visible: item.visible,
  };
}

function withId(snapshot: { id: string; data(): unknown }): MediaDocument {
  return { ...(snapshot.data() as MediaDocument), id: snapshot.id };
}

@Service()
export class MediaService {
  private readonly firestore = inject(FIRESTORE);

  // Every item, hidden ones included (admins may list the whole collection), newest first.
  async getAll(): Promise<MediaDocument[]> {
    const snapshot = await getDocs(collection(this.firestore, COLLECTION));
    return snapshot.docs.map(withId).sort((a, b) => b.date.toMillis() - a.date.toMillis());
  }

  async getById(id: string): Promise<MediaDocument | null> {
    const snapshot = await getDoc(doc(this.firestore, COLLECTION, id));
    return snapshot.exists() ? withId(snapshot) : null;
  }

  async add(value: MediaFormValue): Promise<string> {
    const ref = await addDoc(collection(this.firestore, COLLECTION), toMediaDocument(value));
    return ref.id;
  }

  async update(id: string, value: MediaFormValue): Promise<void> {
    await updateDoc(doc(this.firestore, COLLECTION, id), { ...toMediaDocument(value) });
  }

  async delete(item: MediaDocument): Promise<void> {
    if (!item.id) throw new Error('Cannot delete a media item without an id.');
    await deleteDoc(doc(this.firestore, COLLECTION, item.id));
  }
}
