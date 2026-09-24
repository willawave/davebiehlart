import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatToolbar } from '@angular/material/toolbar';
import { Router, RouterOutlet } from '@angular/router';
import { AuthStore } from './auth/auth.store';

@Component({
  imports: [MatButton, MatToolbar, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  protected async signOut(): Promise<void> {
    await this.store.signOut();
    if (!this.store.authorizedUser()) {
      await this.router.navigateByUrl('/');
    }
  }
}
