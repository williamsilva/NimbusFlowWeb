import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { HomeComponent } from './home/home.component';
import { SupplierFormComponent } from './suppliers/supplier-form.component';
import { SupplierListComponent } from './suppliers/supplier-list.component';
import { WorkFormComponent } from './works/work-form.component';
import { WorkListComponent } from './works/work-list.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'suppliers', component: SupplierListComponent, canActivate: [authGuard] },
  { path: 'suppliers/new', component: SupplierFormComponent, canActivate: [authGuard] },
  { path: 'suppliers/:id/edit', component: SupplierFormComponent, canActivate: [authGuard] },
  { path: 'works', component: WorkListComponent, canActivate: [authGuard] },
  { path: 'works/new', component: WorkFormComponent, canActivate: [authGuard] },
  { path: 'works/:id/edit', component: WorkFormComponent, canActivate: [authGuard] },
];
