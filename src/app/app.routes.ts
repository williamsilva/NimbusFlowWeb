import { Routes } from '@angular/router';

import { ChangePasswordComponent } from './account/change-password.component';
import { ProfileComponent } from './account/profile.component';
import { authGuard } from './core/auth/auth.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MeasurementFormComponent } from './measurements/measurement-form.component';
import { GroupDetailComponent } from './security/group-detail.component';
import { GroupListComponent } from './security/group-list.component';
import { UserListComponent } from './security/user-list.component';
import { SuggestionListComponent } from './suggestions/suggestion-list.component';
import { SupplierListComponent } from './suppliers/supplier-list.component';
import { WorkFormComponent } from './works/work-form.component';
import { WorkListComponent } from './works/work-list.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'suppliers', component: SupplierListComponent, canActivate: [authGuard] },
  { path: 'works', component: WorkListComponent, canActivate: [authGuard] },
  { path: 'works/:id/edit', component: WorkFormComponent, canActivate: [authGuard] },
  { path: 'installments/:id/measurements/new', component: MeasurementFormComponent, canActivate: [authGuard] },
  { path: 'suggestions', component: SuggestionListComponent, canActivate: [authGuard] },
  { path: 'security/users', component: UserListComponent, canActivate: [authGuard] },
  { path: 'security/groups', component: GroupListComponent, canActivate: [authGuard] },
  { path: 'security/groups/:id', component: GroupDetailComponent, canActivate: [authGuard] },
  { path: 'account/profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'account/password', component: ChangePasswordComponent, canActivate: [authGuard] },
];
