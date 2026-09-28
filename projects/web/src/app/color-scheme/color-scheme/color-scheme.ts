import { Component, computed, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ColorSchemeService } from '../color-scheme.service';

@Component({
  imports: [MatIconButton, MatIcon, MatTooltip],
  selector: 'app-color-scheme',
  styleUrl: './color-scheme.scss',
  templateUrl: './color-scheme.html',
})
export class ColorScheme {
  private readonly colorSchemeService = inject(ColorSchemeService);

  // The icon and label name the scheme the button switches to.
  protected readonly target = computed(() =>
    this.colorSchemeService.isLightMode() ? 'dark' : 'light',
  );
  protected readonly label = computed(() => `Switch to ${this.target()} mode`);

  toggleColorScheme(): void {
    this.colorSchemeService.toggle();
  }
}
