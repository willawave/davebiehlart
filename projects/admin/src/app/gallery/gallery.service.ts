import { Service, inject } from '@angular/core';
import { GalleryDocument, GalleryFormModel, GalleryStyle } from 'core';
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

const COLLECTION = 'gallery';
export const GALLERY_FOLDER = 'gallery';

export type GalleryFormValue = ReturnType<GalleryFormModel['galleryForm']>;

// The document written for a form value. Lists every field so nothing else (like `id`)
// ever reaches Firestore; the shape must match production (core's GalleryDocument).
export function toGalleryDocument(value: GalleryFormValue, storageKey: string): GalleryDocument {
  return {
    created: Timestamp.fromDate(value.created),
    depth: value.depth,
    description: value.description.trim(),
    height: value.height,
    imageUrls: [...value.imageUrls],
    name: value.name.trim(),
    storageKey,
    style: value.style as GalleryStyle,
    visible: value.visible,
    weight: value.weight,
    width: value.width,
  };
}

export function toGalleryFormValue(item: GalleryDocument): GalleryFormValue {
  return {
    created: item.created.toDate(),
    depth: item.depth,
    description: item.description,
    height: item.height,
    imageUrls: [...item.imageUrls],
    name: item.name,
    storageKey: item.storageKey,
    style: item.style,
    visible: item.visible,
    weight: item.weight ?? null,
    width: item.width,
  };
}

function withId(snapshot: { id: string; data(): unknown }): GalleryDocument {
  return { ...(snapshot.data() as GalleryDocument), id: snapshot.id };
}

@Service()
export class GalleryService {
  private readonly firestore = inject(FIRESTORE);
  private readonly files = inject(FileService);

  // Every item, hidden ones included (admins may list the whole collection), newest first.
  async getAll(): Promise<GalleryDocument[]> {
    const snapshot = await getDocs(collection(this.firestore, COLLECTION));
    return snapshot.docs.map(withId).sort((a, b) => b.created.toMillis() - a.created.toMillis());
  }

  async getById(id: string): Promise<GalleryDocument | null> {
    const snapshot = await getDoc(doc(this.firestore, COLLECTION, id));
    return snapshot.exists() ? withId(snapshot) : null;
  }

  // A new item's photo folder name. A Firestore auto-ID, as the legacy app generated.
  newStorageKey(): string {
    return doc(collection(this.firestore, COLLECTION)).id;
  }

  async add(value: GalleryFormValue, storageKey: string): Promise<string> {
    const ref = await addDoc(
      collection(this.firestore, COLLECTION),
      toGalleryDocument(value, storageKey),
    );
    return ref.id;
  }

  async update(id: string, value: GalleryFormValue, storageKey: string): Promise<void> {
    await updateDoc(doc(this.firestore, COLLECTION, id), {
      ...toGalleryDocument(value, storageKey),
    });
  }

  // Deletes the document first: if the photos then fail to delete, they are orphaned files
  // rather than broken images on a live page.
  async delete(item: GalleryDocument): Promise<void> {
    if (!item.id) throw new Error('Cannot delete a gallery item without an id.');
    await deleteDoc(doc(this.firestore, COLLECTION, item.id));
    await this.files.deleteOwnedImages(item.imageUrls, GALLERY_FOLDER, item.storageKey);
  }

  uploadImages(files: readonly File[], storageKey: string): Promise<string[]> {
    return this.files.uploadImages(files, GALLERY_FOLDER, storageKey);
  }

  // Deletes only photos inside this item's own folder.
  discardImages(urls: readonly string[], storageKey: string): Promise<void> {
    return this.files.deleteOwnedImages(urls, GALLERY_FOLDER, storageKey);
  }
}
