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
import { MediaForm } from '../media-form/media-form';
import { MediaFormValue } from '../media.service';
import { MediaStore } from '../media.store';

@Component({
  imports: [MediaForm, RouterLink],
  selector: 'app-media-edit',
  styleUrl: './media-edit.scss',
  templateUrl: './media-edit.html',
})
export class MediaEdit {
  protected readonly store = inject(MediaStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly loaded = computed(() => {
    const item = this.store.selectedMediaItem();
    return item?.id === this.id ? item : null;
  });
  // For the form's duplicate check; this item's own link doesn't count.
  protected readonly otherLinks = computed(() =>
    this.store
      .allMediaItems()
      .filter((item) => item.id !== this.id)
      .map((item) => item.link),
  );
  private destroyed = false;

  constructor() {
    this.store.clearError();
    // Load the list first: both loads share `loading`, and the item's must finish last.
    void (async () => {
      if (!this.store.allMediaItems().length) await this.store.loadAll();
      await this.store.loadOne(this.id);
    })();
    afterNextRender(() => this.heading().nativeElement.focus());
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
  }

  protected async onSave(value: MediaFormValue): Promise<void> {
    if (!this.loaded()) return;
    if (!(await this.store.update(this.id, value))) return;
    this.snackBar.open(`Saved "${value.title.trim()}".`, 'Dismiss', { duration: 5000 });
    // The admin may have left mid-save; don't pull them back.
    if (!this.destroyed) await this.router.navigate(['/media']);
  }

  protected cancel(): void {
    void this.router.navigate(['/media']);
  }
}
