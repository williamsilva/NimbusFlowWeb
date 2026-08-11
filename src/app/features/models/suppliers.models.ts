import { PeriodEnum } from '@models/enums/period.enum';

/**
 * Espelha com.nimbusflow.works.dto.{request.SupplierRequest,response.SupplierResponse} do
 * NimbusFlowServer (ver PROJECT_SPEC.md seção 3.1). taxId/phone são armazenados só com dígitos
 * (sem máscara) - a máscara é só de exibição/digitação (ver TaxIdPipe/PhonePipe e
 * onlyDigits/formatTaxId/formatPhone em shared/utils/br-format.ts).
 */
export interface SupplierModel {
  id: string;
  companyName: string;
  tradeName: string | null;
  taxId: string;
  phone: string | null;
  email: string | null;
  commercialContact: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipCode: string | null;
  bankName: string | null;
  bankAgency: string | null;
  bankAccount: string | null;
  bankAccountType: string | null;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export type SupplierApiModel = SupplierModel;

export interface SupplierUpsertInput {
  companyName: string;
  tradeName: string | null;
  taxId: string;
  phone: string | null;
  email: string | null;
  commercialContact: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipCode: string | null;
  bankName: string | null;
  bankAgency: string | null;
  bankAccount: string | null;
  bankAccountType: string | null;
  active: boolean | null;
}

export interface SupplierOptionModel {
  id: string;
  companyName: string;
  active: boolean;
}

export type SuppliersFiltersState = {
  companyName: string;
  tradeName: string;
  taxId: string;
  email: string;
  phone: string;
  active: string[] | null;
  createdAt: string | string[] | null;
  periodCreatedAt: PeriodEnum | null;
};

export function mapSupplierApiModel(input: SupplierApiModel): SupplierModel {
  return { ...input };
}

export function mapSupplierApiModels(items: SupplierApiModel[] | null | undefined): SupplierModel[] {
  return (items ?? []).map(mapSupplierApiModel);
}

export function mapSupplierOptionApiModel(input: SupplierOptionModel): SupplierOptionModel {
  return { ...input };
}

export function mapSupplierOptionApiModels(
  items: SupplierOptionModel[] | null | undefined,
): SupplierOptionModel[] {
  return (items ?? []).map(mapSupplierOptionApiModel);
}
