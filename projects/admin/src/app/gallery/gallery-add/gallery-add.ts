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
  private saved = false;

  constructor() {
    this.store.clearError();
    afterNextRender(() => this.heading().nativeElement.focus());
    // Leaving without saving (Cancel, a link, the back button) deletes this page's uploads.
    inject(DestroyRef).onDestroy(() => {
      if (!this.saved) void this.store.discardImages(this.uploads, this.storageKey);
    });
  }

  protected onUploaded(urls: string[]): void {
    this.uploads.push(...urls);
  }

  protected async onSave(value: GalleryFormValue): Promise<void> {
    if (!(await this.store.add(value, this.storageKey))) return;
    this.saved = true;
    const dropped = this.uploads.filter((url) => !value.imageUrls.includes(url));
    void this.store.discardImages(dropped, this.storageKey);
    this.snackBar.open(`Added "${value.name.trim()}".`, 'Dismiss', { duration: 5000 });
    await this.router.navigate(['/gallery']);
  }

  protected cancel(): void {
    void this.router.navigate(['/gallery']);
  }
}
