import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { ActiveFilterEntry, NbFiltersPanelComponent } from '../shared/filters-panel/nb-filters-panel.component';
import { NbPageHeaderComponent } from '../shared/page-header/nb-page-header.component';
import { NbStatefulListPage } from '../shared/list-base/nb-stateful-list-page';
import { PhonePipe } from '../shared/pipes/phone.pipe';
import { TaxIdPipe } from '../shared/pipes/tax-id.pipe';
import { StatusBadgeComponent } from '../shared/status-badge/status-badge.component';
import { Supplier, SupplierService } from './supplier.service';
import { SupplierFormComponent, SupplierFormDialogData } from './supplier-form.component';

interface SuppliersFilterState {
  search: string;
}

@Component({
  standalone: true,
  selector: 'app-supplier-list',
  imports: [
    FormsModule,
    ButtonModule,
    FloatLabelModule,
    InputTextModule,
    TableModule,
    TooltipModule,
    NbFiltersPanelComponent,
    NbPageHeaderComponent,
    PhonePipe,
    TaxIdPipe,
    StatusBadgeComponent,
    TranslatePipe,
  ],
  templateUrl: './supplier-list.component.html',
  styleUrl: './supplier-list.component.scss',
})
export class SupplierListComponent extends NbStatefulListPage<SuppliersFilterState> implements OnInit {
  private readonly suppliers = signal<Supplier[]>([]);
  /** FORNECEDOR_MANAGE (Fase 7) - só UX, a validação real é 100% backend (SupplierService). */
  canManageSuppliers = false;

  constructor(
    private readonly supplierService: SupplierService,
    private readonly dialogService: DialogService,
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initStatefulList();
    this.authService.loadMe().subscribe((user) => (this.canManageSuppliers = user.permissions.includes('FORNECEDOR_MANAGE')));
  }

  protected override refresh(): void {
    this.load();
  }

  protected override tableRowsKey(): string {
    return 'nimbusflow.suppliers.table.rows.v1';
  }

  protected override filtersKey(): string {
    return 'nimbusflow.suppliers.filters.v1';
  }

  protected override emptyFilter(): SuppliersFilterState {
    return { search: '' };
  }

  protected override buildActiveFilters(f: SuppliersFilterState): ActiveFilterEntry[] {
    const entries: ActiveFilterEntry[] = [];
    if (f.search) entries.push({ label: this.i18n.tUi('suppliers.list.searchPlaceholder'), value: f.search });
    return entries;
  }

  readonly filteredSuppliers = computed(() => {
    const term = this.appliedFilter().search.trim().toLowerCase();
    if (!term) return this.suppliers();
    return this.suppliers().filter((supplier) =>
      [supplier.companyName, supplier.tradeName, supplier.taxId, supplier.email]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  });

  load(): void {
    this.supplierService.list().subscribe((suppliers) => this.suppliers.set(suppliers));
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
