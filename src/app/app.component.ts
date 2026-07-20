import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AuthService, CurrentUser } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'NimbusFlow';
  currentUser: CurrentUser | null = null;

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.authService.loadMe().subscribe((user) => (this.currentUser = user));
  }

  login(): void {
    this.authService.startLogin();
  }

  logout(): void {
    this.authService.logout();
  }
}
