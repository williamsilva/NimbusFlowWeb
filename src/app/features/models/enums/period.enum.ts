// Fase 1 (frontend) do levantamento de duplicação: PeriodEnum (e o resto deste módulo) foi
// extraído pra @williamsilva/nimbus-web-commons - re-exportado aqui pra manter o caminho
// @models/enums/period.enum estável pros dezenas de arquivos que já importam dele. É um
// re-export de verdade (não uma cópia) de propósito: PeriodEnum é um enum de string, nominal -
// dois enums declarados em arquivos diferentes com os mesmos membros NÃO são o mesmo tipo pro
// TypeScript, então StatefulListPage (que vive na lib e espera o PeriodEnum de lá) só aceita
// exatamente este re-export, nunca uma cópia local.
export {
  PeriodEnum,
  STATUS_CODE_MAP,
  normalizePeriodEnum,
  periodEnumSeverity,
  periodEnumLabel,
  allPeriodEnum,
} from '@williamsilva/nimbus-web-commons';
export type { PeriodInput } from '@williamsilva/nimbus-web-commons';
