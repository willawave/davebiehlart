import { Component, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthStore } from '../auth.store';

@Component({
  imports: [MatButton],
  selector: 'app-sign-in-page',
  styleUrl: './sign-in-page.scss',
  templateUrl: './sign-in-page.html',
})
export class SignInPage {
  protected readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  protected readonly busy = signal(false);

  constructor() {
    afterNextRender(() => this.heading().nativeElement.focus());
  }

  protected async signIn(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const result = await this.store.signInWithGoogle();
      if (result === 'authorized') {
        await this.router.navigateByUrl('/dashboard');
      } else if (result === 'denied') {
        await this.router.navigateByUrl('/access-denied');
      }
    } finally {
      this.busy.set(false);
    }
  }
}
