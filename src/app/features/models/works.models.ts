import { WorkStatusEnum } from '@models/enums/work-status.enum';
import { PeriodEnum } from '@models/enums/period.enum';

/**
 * Espelha com.nimbusflow.works.dto.{request.WorkRequest,response.WorkResponse} do
 * NimbusFlowServer (ver PROJECT_SPEC.md seção 3.2). `supplierName` já vem denormalizado no
 * response (evita um segundo request só pra exibir o nome do fornecedor na listagem).
 * `ownerId`/`approvedById` existem no backend mas não são exibidos nesta tela - o fluxo de
 * aprovação de Obra nunca foi implementado em nenhuma fase (só Aditivo tem aprovação), e
 * `ownerId` é sempre o usuário autenticado que cria a obra (sem seletor de usuário).
 */
export interface WorkModel {
  id: string;
  name: string;
  supplierId: string;
  supplierName: string;
  projectId: string;
  projectName: string;
  ownerId: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  startDate: string;
  expectedEndDate: string;
  actualEndDate: string | null;
  initialAmount: number;
  /** Soma dos aditivos APPROVED - totalAmount menos initialAmount (ver WorkService.recalculateTotalAmount no backend). */
  addendumsAmount: number;
  totalAmount: number;
  /** totalAmount menos a soma de todas as Parcelas (ordens de pagamento) já geradas para a obra. */
  remainingAmount: number;
  addendumsCount: number;
  installmentsCount: number;
  /** Soma das Parcelas com status PAID dividida por totalAmount, em percentual (0 quando ainda não houve pagamento). */
  progressPercentage: number;
  status: WorkStatusEnum;
  createdAt: string | null;
  updatedAt: string | null;
}

export type WorkApiModel = WorkModel;

export interface WorkUpsertInput {
  name: string;
  supplierId: string;
  projectId: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate: string | null;
  initialAmount: number;
  status: WorkStatusEnum | null;
}

export type WorksFiltersState = {
  name: string;
  supplierId: string[] | null;
  projectId: string[] | null;
  status: string[] | null;
  startDate: string | string[] | null;
  periodStartDate: PeriodEnum | null;
  expectedEndDate: string | string[] | null;
  periodExpectedEndDate: PeriodEnum | null;
  totalAmountFrom: number | null;
  totalAmountTo: number | null;
};

export function mapWorkApiModel(input: WorkApiModel): WorkModel {
  return { ...input };
}

export function mapWorkApiModels(items: WorkApiModel[] | null | undefined): WorkModel[] {
  return (items ?? []).map(mapWorkApiModel);
}
