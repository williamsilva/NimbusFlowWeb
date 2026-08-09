import { InstallmentStatusEnum } from '@models/enums/installment-status.enum';

/**
 * Espelha com.nimbusflow.works.dto.{request.InstallmentScheduleRequest,response.InstallmentResponse}
 * do NimbusFlowServer. Lista não paginada (GET /bff/v1/works/{workId}/installments retorna todas
 * as parcelas da obra de uma vez).
 */
export interface InstallmentModel {
  id: string;
  workId: string;
  number: number;
  amount: number;
  dueDate: string;
  status: InstallmentStatusEnum;
  releasedById: string | null;
  releasedAt: string | null;
  paidAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type InstallmentApiModel = InstallmentModel;

export interface InstallmentScheduleItemInput {
  amount: number;
  dueDate: string;
}

export interface InstallmentScheduleInput {
  installments: InstallmentScheduleItemInput[];
}

export function mapInstallmentApiModel(input: InstallmentApiModel): InstallmentModel {
  return { ...input };
}

export function mapInstallmentApiModels(
  items: InstallmentApiModel[] | null | undefined,
): InstallmentModel[] {
  return (items ?? []).map(mapInstallmentApiModel);
}
