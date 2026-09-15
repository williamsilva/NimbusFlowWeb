import type { MenuKey } from '../i18n/ui-keys';
import type { Permission } from '../auth/permissions.constants';

export interface AppMenuItem {
  labelKey: MenuKey;
  icon: string;
  activeIcon?: string;
  route?: string;
  /** Link externo (abre em nova aba); mutuamente exclusivo com `route`. */
  externalUrl?: string;
  children?: AppMenuItem[];
  exact?: boolean;
  permissions?: Permission[];
  requireAll?: boolean;
}
