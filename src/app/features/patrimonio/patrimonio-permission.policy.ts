import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/** Uma única policy pro módulo Patrimônio inteiro (5 entidades fortemente relacionadas, todas com
 *  o mesmo par CONSULT/MANAGE) - evita 5 arquivos de policy praticamente idênticos. */
@Injectable({ providedIn: 'root' })
export class PatrimonioPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canViewEquipamentos(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.EQUIPAMENTO.VIEW);
  }

  canManageEquipamentos(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.EQUIPAMENTO.MANAGE);
  }

  canViewManutencoes(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.MANUTENCAO.VIEW);
  }

  canManageManutencoes(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.MANUTENCAO.MANAGE);
  }

  canViewAgendaManutencao(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.AGENDA_MANUTENCAO.VIEW);
  }

  canManageAgendaManutencao(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.AGENDA_MANUTENCAO.MANAGE);
  }

  canViewLocalizacoes(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.LOCALIZACAO.VIEW);
  }

  canManageLocalizacoes(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.LOCALIZACAO.MANAGE);
  }

  canViewHistoricoLocalizacao(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.HISTORICO_LOCALIZACAO.VIEW);
  }

  canManageHistoricoLocalizacao(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.HISTORICO_LOCALIZACAO.MANAGE);
  }
}
