/** Espelha com.nimbusflow.common.company.CompanySettingsModel do NimbusFlowServer - linha única
 *  (mesmo padrão de WorkAutoCompleteSettingsModel), exibida no cabeçalho dos Chamados. */
export interface CompanySettingsModel {
  name: string | null;
  document: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
}

/** `name` obrigatório (ver CompanySettingsRequest#name no backend, @NotBlank) - diferente do
 *  model de leitura, que pode vir totalmente vazio antes da primeira configuração. */
export interface CompanySettingsRequest extends Omit<CompanySettingsModel, 'name'> {
  name: string;
}
