import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { HomeComponent } from './home/home.component';
import { MeasurementFormComponent } from './measurements/measurement-form.component';
import { SuggestionListComponent } from './suggestions/suggestion-list.component';
import { SupplierListComponent } from './suppliers/supplier-list.component';
import { WorkFormComponent } from './works/work-form.component';
import { WorkListComponent } from './works/work-list.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'suppliers', component: SupplierListComponent, canActivate: [authGuard] },
  { path: 'works', component: WorkListComponent, canActivate: [authGuard] },
  { path: 'works/:id/edit', component: WorkFormComponent, canActivate: [authGuard] },
  { path: 'installments/:id/measurements/new', component: MeasurementFormComponent, canActivate: [authGuard] },
  { path: 'suggestions', component: SuggestionListComponent, canActivate: [authGuard] },
];
