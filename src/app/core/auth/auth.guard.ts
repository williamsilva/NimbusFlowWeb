import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map } from 'rxjs';

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
  );
};
