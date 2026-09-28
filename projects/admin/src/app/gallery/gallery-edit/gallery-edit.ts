import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GalleryForm } from '../gallery-form/gallery-form';
import { GalleryFormValue } from '../gallery.service';
import { GalleryStore } from '../gallery.store';

@Component({
  imports: [GalleryForm, RouterLink],
  selector: 'app-gallery-edit',
  styleUrl: './gallery-edit.scss',
  templateUrl: './gallery-edit.html',
})
export class GalleryEdit {
  protected readonly store = inject(GalleryStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly loaded = computed(() => {
    const item = this.store.selectedGalleryItem();
    return item?.id === this.id ? item : null;
  });
  // Items created before storageKey existed get a folder the first time they are edited.
  private fallbackKey?: string;
  protected readonly storageKey = computed(() => {
    const key = this.loaded()?.storageKey;
    return key || (this.fallbackKey ??= this.store.newStorageKey());
  });
  private readonly uploads: string[] = [];
  private saved = false;

  constructor() {
    this.store.clearError();
    void this.store.loadOne(this.id);
    afterNextRender(() => this.heading().nativeElement.focus());
    // Leaving without saving deletes only the photos uploaded on this page.
    inject(DestroyRef).onDestroy(() => {
      if (!this.saved) void this.store.discardImages(this.uploads, this.storageKey());
    });
  }

  protected onUploaded(urls: string[]): void {
    this.uploads.push(...urls);
  }

  protected async onSave(value: GalleryFormValue): Promise<void> {
    const item = this.loaded();
    if (!item) return;
    if (!(await this.store.update(this.id, value, this.storageKey()))) return;
    this.saved = true;
    // Photos removed from the item, old or new. Only ones in its own folder get deleted.
    const dropped = [...item.imageUrls, ...this.uploads].filter(
      (url) => !value.imageUrls.includes(url),
    );
    void this.store.discardImages(dropped, this.storageKey());
    this.snackBar.open(`Saved "${value.name.trim()}".`, 'Dismiss', { duration: 5000 });
    await this.router.navigate(['/gallery']);
  }

  protected cancel(): void {
    void this.router.navigate(['/gallery']);
  }
}
