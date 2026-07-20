import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService, CurrentUser } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';
import { FooterComponent } from './layout/footer/footer.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  currentUser: CurrentUser | null = null;
  readonly sidebarVisible = signal(true);

  constructor(
    private readonly authService: AuthService,
    private readonly themeService: ThemeService,
  ) {
    this.themeService.init();
  }

  ngOnInit(): void {
    this.authService.loadMe().subscribe((user) => (this.currentUser = user));
  }

  toggleSidebar(): void {
    this.sidebarVisible.update((visible) => !visible);
  }

  login(): void {
    this.authService.startLogin();
  }

  logout(): void {
    this.authService.logout();
  }
}
