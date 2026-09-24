import { Component, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { AuthStore } from '../auth.store';

@Component({
  imports: [],
  selector: 'app-dashboard-page',
  styleUrl: './dashboard-page.scss',
  templateUrl: './dashboard-page.html',
})
export class DashboardPage {
  protected readonly store = inject(AuthStore);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  constructor() {
    afterNextRender(() => this.heading().nativeElement.focus());
  }
}
