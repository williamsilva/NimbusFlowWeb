import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  return authService.loadMe().pipe(
    map((me) => {
      if (me.authenticated) {
        return true;
      }
      authService.startLogin();
      return false;
    }),
    // /bff/me responde 401 (nao 200 com authenticated:false) quando nao ha sessao - sem isso o
    // guard nunca chamava startLogin() nesse caso, so deixava um erro silencioso no console.
    catchError(() => {
      authService.startLogin();
      return of(false);
    }),
  );
};
