import { Service, inject } from '@angular/core';
import { StatueDocument, StatueFormModel } from 'core';
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
import { FileService } from '../shared/file.service';

// Singular, as in production; the photo folder is plural (see storage.rules).
const COLLECTION = 'statue';
export const STATUE_FOLDER = 'statues';

export type StatueFormValue = ReturnType<StatueFormModel['statueForm']>;

// The document written for a form value. Lists every field so nothing else (like `id`)
// ever reaches Firestore; the shape must match production (core's StatueDocument).
export function toStatueDocument(value: StatueFormValue, storageKey: string): StatueDocument {
  const { location } = value;
  return {
    dedicated: Timestamp.fromDate(value.dedicated),
    description: value.description.trim(),
    imageUrls: [...value.imageUrls],
    location: {
      city: location.city.trim(),
      latitude: location.latitude,
      longitude: location.longitude,
      state: location.state.trim(),
      street: location.street.trim(),
      venue: location.venue.trim(),
    },
    name: value.name.trim(),
    storageKey,
    visible: value.visible,
  };
}

export function toStatueFormValue(item: StatueDocument): StatueFormValue {
  const { location } = item;
  return {
    dedicated: item.dedicated.toDate(),
    description: item.description,
    imageUrls: [...item.imageUrls],
    location: {
      city: location.city,
      latitude: location.latitude,
      longitude: location.longitude,
      state: location.state,
      street: location.street,
      venue: location.venue,
    },
    name: item.name,
    storageKey: item.storageKey ?? '',
    visible: item.visible,
  };
}

function withId(snapshot: { id: string; data(): unknown }): StatueDocument {
  return { ...(snapshot.data() as StatueDocument), id: snapshot.id };
}

@Service()
export class StatueService {
  private readonly firestore = inject(FIRESTORE);
  private readonly files = inject(FileService);

  // Every statue, hidden ones included (admins may list the whole collection), most
  // recently dedicated first.
  async getAll(): Promise<StatueDocument[]> {
    const snapshot = await getDocs(collection(this.firestore, COLLECTION));
    return snapshot.docs
      .map(withId)
      .sort((a, b) => b.dedicated.toMillis() - a.dedicated.toMillis());
  }

  async getById(id: string): Promise<StatueDocument | null> {
    const snapshot = await getDoc(doc(this.firestore, COLLECTION, id));
    return snapshot.exists() ? withId(snapshot) : null;
  }

  // A new statue's photo folder name. A Firestore auto-ID, as the legacy app generated.
  newStorageKey(): string {
    return doc(collection(this.firestore, COLLECTION)).id;
  }

  async add(value: StatueFormValue, storageKey: string): Promise<string> {
    const ref = await addDoc(
      collection(this.firestore, COLLECTION),
      toStatueDocument(value, storageKey),
    );
    return ref.id;
  }

  async update(id: string, value: StatueFormValue, storageKey: string): Promise<void> {
    await updateDoc(doc(this.firestore, COLLECTION, id), {
      ...toStatueDocument(value, storageKey),
    });
  }

  // Deletes the document first: if the photos then fail to delete, they are orphaned files
  // rather than broken images on a live page.
  async delete(item: StatueDocument): Promise<void> {
    if (!item.id) throw new Error('Cannot delete a statue without an id.');
    await deleteDoc(doc(this.firestore, COLLECTION, item.id));
    await this.files.deleteOwnedImages(item.imageUrls, STATUE_FOLDER, item.storageKey);
  }

  uploadImages(files: readonly File[], storageKey: string): Promise<string[]> {
    return this.files.uploadImages(files, STATUE_FOLDER, storageKey);
  }

  // Deletes only photos inside this statue's own folder.
  discardImages(urls: readonly string[], storageKey: string): Promise<void> {
    return this.files.deleteOwnedImages(urls, STATUE_FOLDER, storageKey);
  }
}
