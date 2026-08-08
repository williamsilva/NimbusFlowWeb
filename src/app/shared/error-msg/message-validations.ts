export class MassageValidations {
  static getErrorMsg(fieldName: string, validatorName: string, validatorValue?: any) {
    const config: any = {
      equalTo: 'Não conferem.',
      email: 'E-mail inválido.',
      cpfNotValid: 'CPF inválido.',
      cnpjNotValid: 'CNPJ inválido.',
      invalidLength: 'CNPJ/CPF inválido.',
      noData: `${fieldName} não encontrado.`,
      invalidNumber: `${fieldName} invalido.`,
      required: `${fieldName} é obrigatório.`,
      invalidDate: `${fieldName} é invalida.`,
      matchPassword: 'As senhas não conferem.',
      notUnique: `${fieldName} já cadastrado.`,
      timeValidator: `${fieldName} é invalida.`,
      pattern: `${fieldName} está em formato inválido.`,
      min: `${fieldName} deve ser no mínimo ${validatorValue.min}.`,
      max: `${fieldName} deve ser no máximo ${validatorValue.max}.`,
      minlength: `Mínimo ${validatorValue.requiredLength} caracteres.`,
      maxlength: `Máximo ${validatorValue.requiredLength} caracteres.`,
      dateComparison: `A data final deve ser maior que a data inicial.`,
      endsWithSpace: `${fieldName} não pode terminar com espaço em branco`,
      startsWithSpace: `${fieldName} não pode começar com espaço em branco`,
    };
    return config[validatorName];
  }
}
