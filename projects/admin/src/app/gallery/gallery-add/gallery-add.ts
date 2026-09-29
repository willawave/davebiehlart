import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { GalleryForm } from '../gallery-form/gallery-form';
import { GalleryFormValue } from '../gallery.service';
import { GalleryStore } from '../gallery.store';

@Component({
  imports: [GalleryForm, RouterLink],
  selector: 'app-gallery-add',
  styleUrl: './gallery-add.scss',
  templateUrl: './gallery-add.html',
})
export class GalleryAdd {
  protected readonly store = inject(GalleryStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  // The new item's photo folder, fixed for the life of this page.
  protected readonly storageKey = this.store.newStorageKey();
  private readonly uploads: string[] = [];
  // The latest save; resolves true once the item is written.
  private pendingSave?: Promise<boolean>;
  private destroyed = false;

  constructor() {
    this.store.clearError();
    afterNextRender(() => this.heading().nativeElement.focus());
    // Leaving without saving (Cancel, a link, the back button) deletes this page's uploads.
    // A save still in flight decides: if it lands, the item uses those photos.
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      void (this.pendingSave ?? Promise.resolve(false)).then((saved) => {
        if (!saved) void this.store.discardImages(this.uploads, this.storageKey);
      });
    });
  }

  protected onUploaded(urls: string[]): void {
    this.uploads.push(...urls);
  }

  protected async onSave(value: GalleryFormValue): Promise<void> {
    const save = this.store.add(value, this.storageKey);
    this.pendingSave = save;
    if (!(await save)) return;
    const dropped = this.uploads.filter((url) => !value.imageUrls.includes(url));
    void this.store.discardImages(dropped, this.storageKey);
    this.snackBar.open(`Added "${value.name.trim()}".`, 'Dismiss', { duration: 5000 });
    // The admin may have left mid-save; don't pull them back.
    if (!this.destroyed) await this.router.navigate(['/gallery']);
  }

  protected cancel(): void {
    void this.router.navigate(['/gallery']);
  }
}
