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
import { Router, RouterLink } from '@angular/router';
import { MediaForm } from '../media-form/media-form';
import { MediaFormValue } from '../media.service';
import { MediaStore } from '../media.store';

@Component({
  imports: [MediaForm, RouterLink],
  selector: 'app-media-add',
  styleUrl: './media-add.scss',
  templateUrl: './media-add.html',
})
export class MediaAdd {
  protected readonly store = inject(MediaStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  // For the form's duplicate check.
  protected readonly otherLinks = computed(() => this.store.allMediaItems().map((i) => i.link));
  private destroyed = false;

  constructor() {
    this.store.clearError();
    // Opened straight from a URL, the list isn't loaded yet.
    if (!this.store.allMediaItems().length) void this.store.loadAll();
    afterNextRender(() => this.heading().nativeElement.focus());
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
  }

  protected async onSave(value: MediaFormValue): Promise<void> {
    if (!(await this.store.add(value))) return;
    this.snackBar.open(`Added "${value.title.trim()}".`, 'Dismiss', { duration: 5000 });
    // The admin may have left mid-save; don't pull them back.
    if (!this.destroyed) await this.router.navigate(['/media']);
  }

  protected cancel(): void {
    void this.router.navigate(['/media']);
  }
}
