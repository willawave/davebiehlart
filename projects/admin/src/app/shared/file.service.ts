import { Service, inject } from '@angular/core';
import { FIREBASE_STORAGE } from 'core/firebase';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { resizeImage } from './resize-image';

// The Storage prefixes storage.rules lets admins write under.
export type StorageFolder = 'gallery' | 'statues';

// Must match storage.rules: raster images only (no SVG, which can carry script), under 20 MB.
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

// Why a file can't be uploaded, or null if it can.
export function imageFileProblem(file: File): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name} is not a JPEG, PNG, WebP, GIF or AVIF image.`;
  }
  if (file.size >= MAX_IMAGE_BYTES) {
    return `${file.name} is 20 MB or larger.`;
  }
  return null;
}

// A unique, URL-safe object name that keeps the original name readable. The timestamp keeps
// a re-uploaded photo from overwriting (and invalidating the URL of) an earlier one.
export function objectName(fileName: string, type: string, now = Date.now()): string {
  const base =
    fileName
      .replace(/\.[^.]*$/, '')
      .replace(/[^\w-]+/g, '-')
      .slice(0, 60) || 'image';
  return `${now}-${base}.${EXTENSIONS[type] ?? 'img'}`;
}

// Each item keeps its photos in its own folder, `${folder}/${storageKey}/`. An item only
// uploads into and deletes from that folder, so a photo re-used on another item (another
// upload, another folder) never breaks when this one changes.
@Service()
export class FileService {
  private readonly storage = inject(FIREBASE_STORAGE);

  // Uploads in order and returns the download URLs in the same order. All or nothing: if
  // any file fails, the ones already stored (and the failed one, if it got stored before
  // its URL could be read) are deleted before the error is rethrown, since the caller never
  // learns their URLs and so could never clean them up.
  async uploadImages(
    files: readonly File[],
    folder: StorageFolder,
    storageKey: string,
  ): Promise<string[]> {
    const urls: string[] = [];
    const stored: string[] = [];
    try {
      for (const file of files) {
        const blob = await resizeImage(file);
        const type = blob.type || file.type;
        const path = `${folder}/${storageKey}/${objectName(file.name, type)}`;
        stored.push(path);
        urls.push(await this.uploadOne(path, blob, type));
      }
      return urls;
    } catch (error) {
      await Promise.all(stored.map((path) => this.deletePath(path).catch(() => undefined)));
      throw error;
    }
  }

  // True if the URL points inside this item's own folder.
  isOwned(url: string, folder: StorageFolder, storageKey: string): boolean {
    if (!storageKey) return false;
    try {
      return ref(this.storage, url).fullPath.startsWith(`${folder}/${storageKey}/`);
    } catch {
      return false;
    }
  }

  // Deletes the URLs inside this item's folder and leaves every other URL alone. A file
  // that is already gone counts as deleted.
  async deleteOwnedImages(
    urls: readonly string[],
    folder: StorageFolder,
    storageKey: string,
  ): Promise<void> {
    const owned = urls.filter((url) => this.isOwned(url, folder, storageKey));
    await Promise.all(owned.map((url) => this.deletePath(url)));
  }

  // The two Storage SDK calls, kept apart so specs can stand in for them.

  // Stores one object and returns its download URL.
  protected async uploadOne(path: string, blob: Blob, contentType: string): Promise<string> {
    const target = ref(this.storage, path);
    await uploadBytes(target, blob, { contentType });
    return getDownloadURL(target);
  }

  // Deletes one object, by path or download URL. Already gone counts as deleted.
  protected async deletePath(pathOrUrl: string): Promise<void> {
    try {
      await deleteObject(ref(this.storage, pathOrUrl));
    } catch (error) {
      if ((error as { code?: string }).code !== 'storage/object-not-found') throw error;
    }
  }
}
