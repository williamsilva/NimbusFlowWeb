import { Routes } from '@angular/router';

export const SECURITY_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'account/profile' },
  {
    path: 'account/password',
    title: 'routes.security.accountPassword.title',
    loadComponent: () =>
      import('./account-password/account-password.component').then(
        (m) => m.AccountPasswordComponent,
      ),
  },
  {
    path: 'account/profile',
    title: 'routes.security.accountProfile.title',
    loadComponent: () => import('./profile/profile.component').then((m) => m.ProfilePageComponent),
  },
  {
    path: '**',
    title: 'routes.notFound.title',
    loadComponent: () => import('../error/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
