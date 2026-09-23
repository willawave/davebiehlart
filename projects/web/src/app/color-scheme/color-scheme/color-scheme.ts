import { Component, inject } from '@angular/core';
import { ColorSchemeService } from '../color-scheme.service';

@Component({
  imports: [],
  selector: 'app-color-scheme',
  styleUrl: './color-scheme.scss',
  templateUrl: './color-scheme.html',
})
export class ColorScheme {
  colorSchemeService = inject(ColorSchemeService);

  toggleColorScheme(): void {
    if (this.colorSchemeService.isLightMode()) {
      this.colorSchemeService.isLightMode.set(false);
    } else {
      this.colorSchemeService.isLightMode.set(true);
    }
  }
}
