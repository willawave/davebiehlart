import { Component, effect, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatToolbar } from '@angular/material/toolbar';
import { ActivatedRouteSnapshot, Router, RouterOutlet } from '@angular/router';
import { authGuard } from './auth/auth-guard';
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

  constructor() {
    // Guards run only on navigation. If the session ends while an admin page is open
    // (a sign-out in another tab, a failed admin check), send the user back to sign-in.
    effect(() => {
      if (this.store.loading() || this.store.authorizedUser()) return;
      if (this.onGuardedRoute()) void this.router.navigateByUrl('/');
    });
  }

  protected async signOut(): Promise<void> {
    await this.store.signOut();
    if (!this.store.authorizedUser()) {
      await this.router.navigateByUrl('/');
    }
  }

  private onGuardedRoute(): boolean {
    let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    while (route) {
      if (route.routeConfig?.canActivate?.includes(authGuard)) return true;
      route = route.firstChild;
    }
    return false;
  }
}
