import { SuggestionStatusEnum } from '@models/enums/suggestion-status.enum';
import { PeriodEnum } from '@models/enums/period.enum';

/**
 * Espelha com.nimbusflow.works.dto.response.SuggestionResponse do NimbusFlowServer (ver
 * PROJECT_SPEC.md seção 3.6). `attachmentUrl` é uma URL pré-assinada (expira) - não deve ser
 * cacheada/persistida, só usada pra abrir o anexo na hora.
 */
export interface SuggestionModel {
  id: string;
  createdById: string;
  description: string;
  status: SuggestionStatusEnum;
  attachmentUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type SuggestionApiModel = SuggestionModel;

export interface SuggestionCreateInput {
  description: string;
  attachment: File | null;
}

export interface SuggestionStatusInput {
  status: SuggestionStatusEnum;
}

export type SuggestionsFiltersState = {
  description: string;
  status: string[] | null;
  createdAt: string | string[] | null;
  periodCreatedAt: PeriodEnum | null;
};

export function mapSuggestionApiModel(input: SuggestionApiModel): SuggestionModel {
  return { ...input };
}

export function mapSuggestionApiModels(
  items: SuggestionApiModel[] | null | undefined,
): SuggestionModel[] {
  return (items ?? []).map(mapSuggestionApiModel);
}
