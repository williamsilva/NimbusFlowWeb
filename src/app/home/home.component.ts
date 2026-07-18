import { Component, OnInit } from '@angular/core';

import { CurrentUser, MeService } from './me.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  currentUser: CurrentUser | null = null;

  constructor(private readonly meService: MeService) {}

  ngOnInit(): void {
    this.meService.getCurrentUser().subscribe((user) => (this.currentUser = user));
  }
}
