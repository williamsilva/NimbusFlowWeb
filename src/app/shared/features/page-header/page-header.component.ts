import { RouterLink } from '@angular/router';

import { Component, Input } from '@angular/core';

export interface PageBreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  standalone: true,
  selector: 'cs-page-header',
  templateUrl: './page-header.component.html',
  imports: [RouterLink],
})
export class PageHeaderComponent {
  @Input() icon?: string;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() breadcrumb: PageBreadcrumbItem[] = [];
  @Input() compact = false;

  hasBreadcrumb() {
    return !!this.breadcrumb?.length;
  }
}
