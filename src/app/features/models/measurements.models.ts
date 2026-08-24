import { PeriodEnum } from '@models/enums/period.enum';
import { MediaTypeEnum, MeasurementStatusEnum } from '@models/enums/measurement-status.enum';

/**
 * Espelha com.nimbusflow.works.dto.{request.MeasurementRequest,request.MeasurementDecisionRequest,
 * response.MeasurementResponse,response.MeasurementMediaResponse} do NimbusFlowServer. Medição é
 * feita direto na Obra (não mais amarrada a uma Parcela) - ao ser aprovada, gera a Parcela (ordem
 * de pagamento) automaticamente com amountToPay/dueDate (ver generatedPaymentOrderId). Sem
 * geolocalização nesta primeira versão. Lista não paginada (GET /bff/v1/works/{workId}/measurements
 * retorna todas as medições da obra de uma vez).
 */
export interface MeasurementMediaModel {
  id: string;
  type: MediaTypeEnum;
  url: string;
}

export interface MeasurementModel {
  id: string;
  workId: string;
  /** Sequencial por obra (1, 2, 3...) - exibido com prefixo "MED-" via formatSequentialNumber
   *  (ex.: MED-0001). Ver Measurement.number no backend. */
  number: number;
  description: string;
  status: MeasurementStatusEnum;
  percentageCompleted: number;
  amountToPay: number;
  dueDate: string;
  submittedById: string;
  submittedAt: string | null;
  approvedById: string | null;
  decisionDate: string | null;
  decisionNote: string | null;
  supersedesId: string | null;
  /** Preenchido só quando status = APPROVED - id da Ordem de Pagamento gerada. Espelha
   *  MeasurementResponse.generatedPaymentOrderId no backend (nome trocado em 2026-08-23, quando
   *  a antiga Parcela virou Ordem de Pagamento + Pagamento - este model nunca tinha sido
   *  atualizado, então a coluna "Ordem gerada" sempre mostrava "-" mesmo com a ordem gerada
   *  corretamente no banco). */
  generatedPaymentOrderId: string | null;
  media: MeasurementMediaModel[];
  /** Ponto relativo (0-100%) na planta do Projeto da obra - ver WorkModel.planPositionX/Y. */
  planPositionX: number | null;
  planPositionY: number | null;
  /** Geolocalização real do dispositivo capturada no envio (navigator.geolocation) - opcional. */
  deviceLatitude: number | null;
  deviceLongitude: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type MeasurementApiModel = MeasurementModel;

/** Espelha MeasurementWithContextResponse - usado pela listagem global (menu "Medições", através de todas as obras). */
export interface MeasurementWithContextModel extends MeasurementModel {
  workName: string;
}

export type MeasurementWithContextApiModel = MeasurementWithContextModel;

/** Estado persistido do painel de filtros avançados da listagem global (menu "Medições"). */
export type MeasurementsFiltersState = {
  workName: string;
  description: string;
  status: string[] | null;
  amountToPayFrom: number | null;
  amountToPayTo: number | null;
  dueDate: string | string[] | null;
  periodDueDate: PeriodEnum | null;
};

export interface MeasurementSubmitInput {
  description: string;
  percentageCompleted: number;
  amountToPay: number;
  dueDate: string;
  supersedesId: string | null;
  files: File[];
  planPositionX: number | null;
  planPositionY: number | null;
  deviceLatitude: number | null;
  deviceLongitude: number | null;
}

export interface MeasurementDecisionInput {
  decisionNote: string | null;
}

/** Resultado de 1 medição dentro de uma aprovação em lote (checkbox na tela "Medições") - ver
 *  MeasurementsGlobalFacade.approveMany. Best-effort por item: uma medição pode falhar (ex.: valor
 *  excede o total da obra) sem desfazer as demais já aprovadas no mesmo lote. */
export interface MeasurementBatchApproveResult {
  id: string;
  success: boolean;
  error?: unknown;
}

/** Espelha MeasurementRequest (sem supersedesId/files - editar não reenvia mídia nem faz parte do
 *  fluxo de reenvio de medição reprovada). Ver MeasurementService.updateMeasurement no backend:
 *  cancela a parcela gerada (se houver e ainda não estiver paga) e devolve a medição pra PENDING. */
export interface MeasurementUpdateInput {
  description: string;
  percentageCompleted: number;
  amountToPay: number;
  dueDate: string;
  planPositionX: number | null;
  planPositionY: number | null;
  deviceLatitude: number | null;
  deviceLongitude: number | null;
}

export function mapMeasurementApiModel(input: MeasurementApiModel): MeasurementModel {
  return { ...input };
}

export function mapMeasurementApiModels(
  items: MeasurementApiModel[] | null | undefined,
): MeasurementModel[] {
  return (items ?? []).map(mapMeasurementApiModel);
}

export function mapMeasurementWithContextApiModel(
  input: MeasurementWithContextApiModel,
): MeasurementWithContextModel {
  return { ...input };
}

export function mapMeasurementWithContextApiModels(
  items: MeasurementWithContextApiModel[] | null | undefined,
): MeasurementWithContextModel[] {
  return (items ?? []).map(mapMeasurementWithContextApiModel);
}
