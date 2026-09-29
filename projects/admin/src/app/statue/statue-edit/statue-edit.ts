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
import { StatueForm } from '../statue-form/statue-form';
import { StatueFormValue } from '../statue.service';
import { StatueStore } from '../statue.store';

@Component({
  imports: [StatueForm, RouterLink],
  selector: 'app-statue-edit',
  styleUrl: './statue-edit.scss',
  templateUrl: './statue-edit.html',
})
export class StatueEdit {
  protected readonly store = inject(StatueStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly loaded = computed(() => {
    const item = this.store.selectedStatueItem();
    return item?.id === this.id ? item : null;
  });
  // Statues saved before storageKey existed get a folder the first time they are edited.
  private fallbackKey?: string;
  protected readonly storageKey = computed(() => {
    const key = this.loaded()?.storageKey;
    return key || (this.fallbackKey ??= this.store.newStorageKey());
  });
  private readonly uploads: string[] = [];
  // The latest save; resolves true once the statue is written.
  private pendingSave?: Promise<boolean>;
  private destroyed = false;

  constructor() {
    this.store.clearError();
    void this.store.loadOne(this.id);
    afterNextRender(() => this.heading().nativeElement.focus());
    // Leaving without saving deletes only the photos uploaded on this page. A save still in
    // flight decides: if it lands, the statue may use those photos.
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      const key = this.storageKey();
      void (this.pendingSave ?? Promise.resolve(false)).then((saved) => {
        if (!saved) void this.store.discardImages(this.uploads, key);
      });
    });
  }

  protected onUploaded(urls: string[]): void {
    this.uploads.push(...urls);
  }

  protected async onSave(value: StatueFormValue): Promise<void> {
    const item = this.loaded();
    if (!item) return;
    const key = this.storageKey();
    const save = this.store.update(this.id, value, key);
    this.pendingSave = save;
    if (!(await save)) return;
    // Photos removed from the statue, old or new. Only ones in its own folder get deleted.
    const dropped = [...item.imageUrls, ...this.uploads].filter(
      (url) => !value.imageUrls.includes(url),
    );
    void this.store.discardImages(dropped, key);
    this.snackBar.open(`Saved "${value.name.trim()}".`, 'Dismiss', { duration: 5000 });
    // The admin may have left mid-save; don't pull them back.
    if (!this.destroyed) await this.router.navigate(['/statues']);
  }

  protected cancel(): void {
    void this.router.navigate(['/statues']);
  }
}
