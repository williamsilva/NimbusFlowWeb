import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Supplier, SupplierService } from './supplier.service';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [RouterLink, MatTableModule, MatButtonModule, MatIconModule],
  templateUrl: './supplier-list.component.html',
  styleUrl: './supplier-list.component.scss',
})
export class SupplierListComponent implements OnInit {
  suppliers: Supplier[] = [];
  displayedColumns = ['companyName', 'taxId', 'phone', 'email', 'active', 'actions'];

  constructor(private readonly supplierService: SupplierService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.supplierService.list().subscribe((suppliers) => (this.suppliers = suppliers));
  }

  deactivate(supplier: Supplier): void {
    this.supplierService.deactivate(supplier.id).subscribe(() => this.load());
  }
}
