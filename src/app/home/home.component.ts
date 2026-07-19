import { Component, OnInit } from '@angular/core';

import { AuthService, CurrentUser } from '../core/auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  currentUser: CurrentUser | null = null;

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.authService.loadMe().subscribe((user) => (this.currentUser = user));
  }
}
