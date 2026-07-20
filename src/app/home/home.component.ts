import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

import { AuthService, CurrentUser } from '../core/auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  currentUser: CurrentUser | null = null;

  readonly quickLinks = [
    { label: 'Fornecedores', icon: 'storefront', link: '/suppliers' },
    { label: 'Obras', icon: 'construction', link: '/works' },
    { label: 'Sugestões', icon: 'lightbulb', link: '/suggestions' },
  ];

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.authService.loadMe().subscribe((user) => (this.currentUser = user));
  }
}
