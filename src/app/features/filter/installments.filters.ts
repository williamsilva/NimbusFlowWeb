import { PeriodEnum } from '@models/enums/period.enum';

export interface InstallmentsAdvancedFilters {
  supplierId?: string[] | null;

  workName?: string;

  status?: string[] | null;

  /** Status do Pagamento (não da Ordem) - "NOT_SENT" é sentinela do frontend pra Ordem que ainda
   *  não entrou num envio, já que PaymentStatusEnum não tem esse valor (ver
   *  PaymentOrderService.paymentStatusKey no backend). */
  paymentStatus?: string[] | null;

  amountFrom?: number;
  amountTo?: number;

  dueDate?: string | string[];
  periodDueDate?: PeriodEnum;
}
