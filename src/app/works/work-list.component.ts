import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { Work, WorkService } from './work.service';

@Component({
  selector: 'app-work-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe, MatTableModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './work-list.component.html',
  styleUrl: './work-list.component.scss',
})
export class WorkListComponent implements OnInit {
  works: Work[] = [];
  displayedColumns = ['name', 'supplierName', 'status', 'startDate', 'expectedEndDate', 'totalAmount', 'actions'];

  constructor(private readonly workService: WorkService) {}

  ngOnInit(): void {
    this.workService.list().subscribe((works) => (this.works = works));
  }
}
