import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { PhonePipe } from '../shared/pipes/phone.pipe';
import { TaxIdPipe } from '../shared/pipes/tax-id.pipe';
import { StatusBadgeComponent } from '../shared/status-badge/status-badge.component';
import { Supplier, SupplierService } from './supplier.service';
import { SupplierFormComponent, SupplierFormDialogData } from './supplier-form.component';

@Component({
    selector: 'app-supplier-list',
    imports: [
        FormsModule,
        ButtonModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        TableModule,
        TooltipModule,
        PhonePipe,
        TaxIdPipe,
        StatusBadgeComponent,
        TranslatePipe,
    ],
    templateUrl: './supplier-list.component.html',
    styleUrl: './supplier-list.component.scss'
})
export class SupplierListComponent implements OnInit {
  suppliers: Supplier[] = [];
  search = '';
  /** FORNECEDOR_MANAGE (Fase 7) - só UX, a validação real é 100% backend (SupplierService). */
  canManageSuppliers = false;

  constructor(
    private readonly supplierService: SupplierService,
    private readonly dialogService: DialogService,
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.authService.loadMe().subscribe((user) => (this.canManageSuppliers = user.permissions.includes('FORNECEDOR_MANAGE')));
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
    const ref = this.dialogService.open<SupplierFormComponent, SupplierFormDialogData>(SupplierFormComponent, {
      data: { supplier },
      header: this.i18n.tUi(supplier ? 'suppliers.form.editTitle' : 'suppliers.form.createTitle'),
      width: '720px',
      modal: true,
    });

    ref?.onClose.subscribe((saved) => {
      if (saved) {
        this.load();
      }
    });
  }

  deactivate(supplier: Supplier): void {
    this.supplierService.deactivate(supplier.id).subscribe(() => this.load());
  }
}
