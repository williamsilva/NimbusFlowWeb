import { Provider, inject } from '@angular/core';
import {
  NIMBUS_SIDEBAR_HOST,
  NIMBUS_TOPBAR_HOST,
  NimbusSidebarHost,
  NimbusTopbarHost,
} from '@williamsilva/nimbus-web-commons';

import { BRAND } from '../brand/brand';
import { MeStore } from '../auth/me.store';
import { APP_MENU } from '../menu/menu.data';
import { AuthService } from '../auth/auth.service';
import { I18nService } from '../i18n/i18n.service';
import { SessionService } from '../auth/session.service';
import { PermissionService } from '../auth/permission.service';
import { SessionPingService } from '../auth/session-ping.service';
import { LayoutStateService } from '../../layout/layout-state.service';

/**
 * Compõe os NIMBUS_SIDEBAR_HOST/NIMBUS_TOPBAR_HOST (SidebarComponent/TopbarComponent de
 * @williamsilva/nimbus-web-commons) a partir dos serviços já existentes deste app - nenhum
 * serviço aqui foi criado só pra isso, só reaproveitado via useFactory. Ver README da lib
 * (layout-host.ts) pro contrato completo.
 */
export function provideNimbusLayoutHosts(): Provider[] {
  return [
    {
      provide: NIMBUS_SIDEBAR_HOST,
      useFactory: (): NimbusSidebarHost => {
        const meStore = inject(MeStore);
        const auth = inject(AuthService);
        const perms = inject(PermissionService);

        return {
          me: meStore.me,
          menu: APP_MENU,
          brandMarkUrl: BRAND.markUrl,
          canAccess: (required, requireAll) => perms.canAccess(required, requireAll),
          logout: () => auth.logout(),
        };
      },
    },
    {
      provide: NIMBUS_TOPBAR_HOST,
      useFactory: (): NimbusTopbarHost => {
        const meStore = inject(MeStore);
        const auth = inject(AuthService);
        const i18n = inject(I18nService);
        const session = inject(SessionService);
        const ping = inject(SessionPingService);
        const layout = inject(LayoutStateService);

        ping.start();

        return {
          me: meStore.me,
          brandMarkUrl: BRAND.markUrl,
          i18n,
          sidebarVisible: layout.sidebarVisible,
          remainingSeconds: session.remainingSeconds,
          isSessionExpired: () => session.isExpired(),
          toggleSidebar: () => layout.toggleSidebar(),
          startLogin: () => auth.startLogin(),
          logout: () => auth.logout(),
        };
      },
    },
  ];
}
