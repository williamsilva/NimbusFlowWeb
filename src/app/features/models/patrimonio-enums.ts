import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/** Espelha com.nimbusflow.patrimonio.model.* do NimbusFlowServer - todos os enums do módulo
 *  Patrimônio centralizados aqui (em vez de um arquivo por enum) dado o número de entidades
 *  relacionadas que os compartilham (TipoManutencao, por exemplo, é usado por Manutencao E
 *  AgendaManutencao). */

export type StatusEquipamento = 'ATIVO' | 'MANUTENCAO' | 'QUEIMADO' | 'DESCARTADO';
export const STATUS_EQUIPAMENTO_VALUES: StatusEquipamento[] = [
  'ATIVO',
  'MANUTENCAO',
  'QUEIMADO',
  'DESCARTADO',
];
const STATUS_EQUIPAMENTO_TONE: Record<StatusEquipamento, StatusTone> = {
  ATIVO: 'success',
  MANUTENCAO: 'warn',
  QUEIMADO: 'danger',
  DESCARTADO: 'neutral',
};
export function statusEquipamentoTone(status: StatusEquipamento | string | null | undefined): StatusTone {
  return status ? (STATUS_EQUIPAMENTO_TONE[status as StatusEquipamento] ?? 'neutral') : 'neutral';
}

export type VoltagemEquipamento =
  | 'MONOFASICO_127'
  | 'MONOFASICO_220'
  | 'BIFASICO_220'
  | 'BIFASICO_380'
  | 'TRIFASICO_220'
  | 'TRIFASICO_380'
  | 'GASOLINA'
  | 'DIESEL'
  | 'BIVOLT';
export const VOLTAGEM_EQUIPAMENTO_VALUES: VoltagemEquipamento[] = [
  'MONOFASICO_127',
  'MONOFASICO_220',
  'BIFASICO_220',
  'BIFASICO_380',
  'TRIFASICO_220',
  'TRIFASICO_380',
  'GASOLINA',
  'DIESEL',
  'BIVOLT',
];

export type StatusManutencao = 'ORCANDO' | 'PROPOSTA' | 'APROVADA' | 'CONCERTADA' | 'RECEBIDA';
export const STATUS_MANUTENCAO_VALUES: StatusManutencao[] = [
  'ORCANDO',
  'PROPOSTA',
  'APROVADA',
  'CONCERTADA',
  'RECEBIDA',
];
const STATUS_MANUTENCAO_TONE: Record<StatusManutencao, StatusTone> = {
  ORCANDO: 'neutral',
  PROPOSTA: 'info',
  APROVADA: 'info',
  CONCERTADA: 'warn',
  RECEBIDA: 'success',
};
export function statusManutencaoTone(status: StatusManutencao | string | null | undefined): StatusTone {
  return status ? (STATUS_MANUTENCAO_TONE[status as StatusManutencao] ?? 'neutral') : 'neutral';
}

export type TipoManutencao =
  | 'CORRETIVA_PROGRAMADA'
  | 'CORRETIVA_URGENTE'
  | 'PREVENTIVA'
  | 'PREDITIVA'
  | 'DETECTIVA';
export const TIPO_MANUTENCAO_VALUES: TipoManutencao[] = [
  'CORRETIVA_PROGRAMADA',
  'CORRETIVA_URGENTE',
  'PREVENTIVA',
  'PREDITIVA',
  'DETECTIVA',
];

export type StatusAgendaManutencao = 'AGENDADA' | 'VENCIDA';
export const STATUS_AGENDA_MANUTENCAO_VALUES: StatusAgendaManutencao[] = ['AGENDADA', 'VENCIDA'];
const STATUS_AGENDA_MANUTENCAO_TONE: Record<StatusAgendaManutencao, StatusTone> = {
  AGENDADA: 'info',
  VENCIDA: 'danger',
};
export function statusAgendaManutencaoTone(
  status: StatusAgendaManutencao | string | null | undefined,
): StatusTone {
  return status ? (STATUS_AGENDA_MANUTENCAO_TONE[status as StatusAgendaManutencao] ?? 'neutral') : 'neutral';
}

export type FrequenciaManutencao =
  | 'SEMANAL'
  | 'QUINZENAL'
  | 'MENSAL'
  | 'TRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL';
export const FREQUENCIA_MANUTENCAO_VALUES: FrequenciaManutencao[] = [
  'SEMANAL',
  'QUINZENAL',
  'MENSAL',
  'TRIMESTRAL',
  'SEMESTRAL',
  'ANUAL',
];

export type PerfilNotificacao = 'USUARIO' | 'GESTOR' | 'SUPERVISOR';
export const PERFIL_NOTIFICACAO_VALUES: PerfilNotificacao[] = ['USUARIO', 'GESTOR', 'SUPERVISOR'];

export type StatusLocalizacao = 'ATIVO' | 'INATIVO';
export const STATUS_LOCALIZACAO_VALUES: StatusLocalizacao[] = ['ATIVO', 'INATIVO'];
const STATUS_LOCALIZACAO_TONE: Record<StatusLocalizacao, StatusTone> = {
  ATIVO: 'success',
  INATIVO: 'neutral',
};
export function statusLocalizacaoTone(status: StatusLocalizacao | string | null | undefined): StatusTone {
  return status ? (STATUS_LOCALIZACAO_TONE[status as StatusLocalizacao] ?? 'neutral') : 'neutral';
}

export type GeracaoRegistro = 'USUARIO' | 'SISTEMA';

export type StatusHistoricoLocalizacao = 'ATIVO' | 'REMOVIDO' | 'MANUTENCAO' | 'DESCARTADO';
export const STATUS_HISTORICO_LOCALIZACAO_VALUES: StatusHistoricoLocalizacao[] = [
  'ATIVO',
  'REMOVIDO',
  'MANUTENCAO',
  'DESCARTADO',
];
const STATUS_HISTORICO_LOCALIZACAO_TONE: Record<StatusHistoricoLocalizacao, StatusTone> = {
  ATIVO: 'success',
  REMOVIDO: 'neutral',
  MANUTENCAO: 'warn',
  DESCARTADO: 'danger',
};
export function statusHistoricoLocalizacaoTone(
  status: StatusHistoricoLocalizacao | string | null | undefined,
): StatusTone {
  return status
    ? (STATUS_HISTORICO_LOCALIZACAO_TONE[status as StatusHistoricoLocalizacao] ?? 'neutral')
    : 'neutral';
}
