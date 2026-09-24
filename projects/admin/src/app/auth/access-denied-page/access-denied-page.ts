import { Component, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../auth.store';

@Component({
  imports: [MatAnchor, RouterLink],
  selector: 'app-access-denied-page',
  styleUrl: './access-denied-page.scss',
  templateUrl: './access-denied-page.html',
})
export class AccessDeniedPage {
  protected readonly store = inject(AuthStore);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  constructor() {
    afterNextRender(() => this.heading().nativeElement.focus());
  }
}
