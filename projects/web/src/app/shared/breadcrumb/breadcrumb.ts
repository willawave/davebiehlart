import { Component } from '@angular/core';

export interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  imports: [],
  selector: 'app-breadcrumb',
  styleUrl: './breadcrumb.scss',
  templateUrl: './breadcrumb.html',
})
export class Breadcrumb {}
