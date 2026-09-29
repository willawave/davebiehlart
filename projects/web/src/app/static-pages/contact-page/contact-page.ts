import { Component } from '@angular/core';
import { VisitHours } from '../../schedule/visit-hours/visit-hours';

// Lazily loaded (see app.routes.ts), so the gallery hours' Firestore read stays out of the
// initial bundle.
@Component({
  imports: [VisitHours],
  selector: 'app-contact-page',
  styleUrl: './contact-page.scss',
  templateUrl: './contact-page.html',
})
export class ContactPage {}
