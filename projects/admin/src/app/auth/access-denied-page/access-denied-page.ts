import { Component, ElementRef, afterNextRender, viewChild } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  imports: [MatAnchor, RouterLink],
  selector: 'app-access-denied-page',
  styleUrl: './access-denied-page.scss',
  templateUrl: './access-denied-page.html',
})
export class AccessDeniedPage {
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  constructor() {
    afterNextRender(() => this.heading().nativeElement.focus());
  }
}
