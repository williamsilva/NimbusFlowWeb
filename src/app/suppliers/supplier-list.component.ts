import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { StatusBadgeComponent } from '../shared/status-badge/status-badge.component';
import { Supplier, SupplierService } from './supplier.service';
import { SupplierFormComponent, SupplierFormDialogData } from './supplier-form.component';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    StatusBadgeComponent,
  ],
  templateUrl: './supplier-list.component.html',
  styleUrl: './supplier-list.component.scss',
})
export class SupplierListComponent implements OnInit {
  suppliers: Supplier[] = [];
  search = '';
  displayedColumns = ['companyName', 'taxId', 'phone', 'email', 'active', 'actions'];

  constructor(
    private readonly supplierService: SupplierService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get filteredSuppliers(): Supplier[] {
    const term = this.search.trim().toLowerCase();
    if (!term) {
      return this.suppliers;
    }
    return this.suppliers.filter((supplier) =>
      [supplier.companyName, supplier.tradeName, supplier.taxId, supplier.email]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }

  load(): void {
    this.supplierService.list().subscribe((suppliers) => (this.suppliers = suppliers));
  }

  openCreate(): void {
    this.openDialog(null);
  }

  openEdit(supplier: Supplier): void {
    this.openDialog(supplier);
  }

  private openDialog(supplier: Supplier | null): void {
    const ref = this.dialog.open<SupplierFormComponent, SupplierFormDialogData, boolean>(SupplierFormComponent, {
      data: { supplier },
      autoFocus: false,
    });

    ref.afterClosed().subscribe((saved) => {
      if (saved) {
        this.load();
      }
    });
  }

  deactivate(supplier: Supplier): void {
    this.supplierService.deactivate(supplier.id).subscribe(() => this.load());
  }
}
