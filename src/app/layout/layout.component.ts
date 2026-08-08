import { RouterOutlet } from '@angular/router';

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { TopbarComponent } from './topbar/topbar.component';
import { FooterComponent } from './footer/footer.component';
import { LayoutStateService } from './layout-state.service';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  standalone: true,
  selector: 'app-layout',
  styleUrl: './layout.component.css',
  templateUrl: './layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, TopbarComponent, SidebarComponent, FooterComponent],
})
export class LayoutComponent {
  private readonly layout = inject(LayoutStateService);

  /** Exposto para template (signals) */
  readonly sidebarVisible = this.layout.sidebarVisible;
}
