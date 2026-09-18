export const UI_KEYS = {
  topbar: {
    online: 'topbar.online',
    brandSub: 'topbar.brandSub',
    langAria: 'topbar.langAria',
    brandName: 'topbar.brandName',
    sessionExpired: 'topbar.sessionExpired',
    themeToggleAria: 'topbar.themeToggleAria',
    sidebarToggleAria: 'topbar.sidebarToggleAria',
    sidebarShowTooltip: 'topbar.sidebarShowTooltip',
    sidebarHideTooltip: 'topbar.sidebarHideTooltip',
    sessionExpireTooltip: 'topbar.sessionExpireTooltip',
    sessionExpiredTooltip: 'topbar.sessionExpiredTooltip',
  },
  menu: {
    me: 'menu.me',
    dashboard: 'menu.dashboard',
    security: {
      changePassword: 'menu.security.changePassword',
    },
    settings: {
      title: 'menu.settings.title',
      approvalLimits: 'menu.settings.approvalLimits',
      departments: 'menu.settings.departments',
      workAutoComplete: 'menu.settings.workAutoComplete',
    },
    /* Fornecedor / Obra / Sugestão (com.nimbusflow.works no backend) */
    works: {
      title: 'menu.works.title',
      suppliers: 'menu.works.suppliers',
      projects: 'menu.works.projects',
      works: 'menu.works.works',
      addendums: 'menu.works.addendums',
      installments: 'menu.works.installments',
      payments: 'menu.works.payments',
      measurements: 'menu.works.measurements',
      suggestions: 'menu.works.suggestions',
      tickets: 'menu.works.tickets',
      actionPlans: 'menu.works.actionPlans',
      tasks: 'menu.works.tasks',
    },
    /* Equipamento / Manutenção / Agenda de Manutenção Preventiva / Localização / Histórico de
     * Localização (com.nimbusflow.patrimonio no backend) */
    patrimonio: {
      title: 'menu.patrimonio.title',
      equipamentos: 'menu.patrimonio.equipamentos',
      manutencoes: 'menu.patrimonio.manutencoes',
      agendaManutencao: 'menu.patrimonio.agendaManutencao',
      localizacoes: 'menu.patrimonio.localizacoes',
      historicoLocalizacao: 'menu.patrimonio.historicoLocalizacao',
      dashboard: 'menu.patrimonio.dashboard',
    },
  },
  sidebar: {
    userFallback: 'sidebar.userFallback',
    logout: 'sidebar.logout',
  },
  accountPassword: {
    successTitle: 'accountPassword.successTitle',
    userFallback: 'accountPassword.userFallback',
    successMessage: 'accountPassword.successMessage',
    usernameFallback: 'accountPassword.usernameFallback',
  },
  users: {
    status: {
      active: 'users.status.active',
      blocked: 'users.status.blocked',
      disabled: 'users.status.disabled',
      inactive: 'users.status.inactive',
      pending_password: 'users.status.pending_password',
      unknown: 'users.status.unknown',
      null: 'users.status.null',
    },
  },
  enum: {
    periodEnum: {
      day: 'enum.periodEnum.day',
      end: 'enum.periodEnum.end',
      null: 'enum.periodEnum.null',
      year: 'enum.periodEnum.year',
      start: 'enum.periodEnum.start',
      month: 'enum.periodEnum.month',
      unknown: 'enum.periodEnum.unknown',
      interval: 'enum.periodEnum.interval',
    },
  },
  /* Fornecedor / Obra / Sugestão (com.nimbusflow.works no backend) */
  suppliers: {
    fields: {
      companyName: 'suppliers.fields.companyName',
      tradeName: 'suppliers.fields.tradeName',
      taxId: 'suppliers.fields.taxId',
      phone: 'suppliers.fields.phone',
      email: 'suppliers.fields.email',
      status: 'suppliers.fields.status',
      createdAt: 'suppliers.fields.createdAt',
      periodCreatedAt: 'suppliers.fields.periodCreatedAt',
    },
    form: {
      invalid: 'suppliers.form.invalid',
      created: 'suppliers.form.created',
      updated: 'suppliers.form.updated',
      saveError: 'suppliers.form.saveError',
    },
  },
  works: {
    fields: {
      name: 'works.fields.name',
      supplier: 'works.fields.supplier',
      project: 'works.fields.project',
      status: 'works.fields.status',
      startDate: 'works.fields.startDate',
      periodStartDate: 'works.fields.periodStartDate',
      expectedEndDate: 'works.fields.expectedEndDate',
      periodExpectedEndDate: 'works.fields.periodExpectedEndDate',
      totalAmount: 'works.fields.totalAmount',
    },
    form: {
      invalid: 'works.form.invalid',
      created: 'works.form.created',
      updated: 'works.form.updated',
      saveError: 'works.form.saveError',
    },
    deleteConfirm: {
      header: 'works.deleteConfirm.header',
      message: 'works.deleteConfirm.message',
      success: 'works.deleteConfirm.success',
      error: 'works.deleteConfirm.error',
    },
  },
  /* Equipamento / Manutenção / Agenda de Manutenção Preventiva / Localização / Histórico de
   * Localização (com.nimbusflow.patrimonio no backend) - só os leafs de fato usados via tUi()
   * (chip de filtro ativo); o resto (columns/status/form/etc.) é consumido via `| translate` no
   * template, sem passar por aqui. */
  equipamentos: {
    fields: {
      descricao: 'equipamentos.fields.descricao',
      fornecedorNome: 'equipamentos.fields.fornecedorNome',
      status: 'equipamentos.fields.status',
      preco: 'equipamentos.fields.preco',
      dataCompra: 'equipamentos.fields.dataCompra',
      periodDataCompra: 'equipamentos.fields.periodDataCompra',
    },
  },
  manutencoes: {
    fields: {
      equipamento: 'manutencoes.fields.equipamento',
      autorizadaNome: 'manutencoes.fields.autorizadaNome',
      status: 'manutencoes.fields.status',
      tipoManutencao: 'manutencoes.fields.tipoManutencao',
      preco: 'manutencoes.fields.preco',
      dataEnvio: 'manutencoes.fields.dataEnvio',
      periodDataEnvio: 'manutencoes.fields.periodDataEnvio',
    },
  },
  agendaManutencao: {
    fields: {
      equipamento: 'agendaManutencao.fields.equipamento',
      status: 'agendaManutencao.fields.status',
      frequencia: 'agendaManutencao.fields.frequencia',
      tipoManutencao: 'agendaManutencao.fields.tipoManutencao',
      perfilNotificacao: 'agendaManutencao.fields.perfilNotificacao',
      proximaManutencao: 'agendaManutencao.fields.proximaManutencao',
      periodProximaManutencao: 'agendaManutencao.fields.periodProximaManutencao',
    },
  },
  localizacoes: {
    fields: {
      descricao: 'localizacoes.fields.descricao',
      status: 'localizacoes.fields.status',
      createdAt: 'localizacoes.fields.createdAt',
      periodCreatedAt: 'localizacoes.fields.periodCreatedAt',
    },
  },
  historicoLocalizacao: {
    fields: {
      equipamento: 'historicoLocalizacao.fields.equipamento',
      localizacao: 'historicoLocalizacao.fields.localizacao',
      status: 'historicoLocalizacao.fields.status',
      dataInicial: 'historicoLocalizacao.fields.dataInicial',
      periodDataInicial: 'historicoLocalizacao.fields.periodDataInicial',
    },
  },
  addendums: {
    fields: {
      work: 'addendums.fields.work',
      amount: 'addendums.fields.amount',
      justification: 'addendums.fields.justification',
      status: 'addendums.fields.status',
      tier: 'addendums.fields.tier',
      createdAt: 'addendums.fields.createdAt',
    },
    approvalRange: {
      none: 'addendums.approvalRange.none',
    },
    form: {
      invalid: 'addendums.form.invalid',
      created: 'addendums.form.created',
      updated: 'addendums.form.updated',
      saveError: 'addendums.form.saveError',
    },
    action: {
      alreadyDecided: 'addendums.action.alreadyDecided',
      requiresSubmittableWork: 'addendums.action.requiresSubmittableWork',
      requiresApproved: 'addendums.action.requiresApproved',
    },
    approveConfirm: {
      header: 'addendums.approveConfirm.header',
      message: 'addendums.approveConfirm.message',
      success: 'addendums.approveConfirm.success',
    },
    rejectConfirm: {
      header: 'addendums.rejectConfirm.header',
      message: 'addendums.rejectConfirm.message',
      success: 'addendums.rejectConfirm.success',
    },
    resendNotificationConfirm: {
      header: 'addendums.resendNotificationConfirm.header',
      message: 'addendums.resendNotificationConfirm.message',
      success: 'addendums.resendNotificationConfirm.success',
    },
  },
  installments: {
    fields: {
      supplier: 'installments.fields.supplier',
      work: 'installments.fields.work',
      amount: 'installments.fields.amount',
      status: 'installments.fields.status',
      paymentStatus: 'installments.fields.paymentStatus',
      dueDate: 'installments.fields.dueDate',
    },
    approvalRange: {
      none: 'installments.approvalRange.none',
    },
    form: {
      saveError: 'installments.form.saveError',
    },
    action: {
      statusChanged: 'installments.action.statusChanged',
      requiresReleasedOrCancelled: 'installments.action.requiresReleasedOrCancelled',
      alreadySent: 'installments.action.alreadySent',
    },
    releaseConfirm: {
      header: 'installments.releaseConfirm.header',
      message: 'installments.releaseConfirm.message',
      success: 'installments.releaseConfirm.success',
    },
    resendNotificationConfirm: {
      header: 'installments.resendNotificationConfirm.header',
      message: 'installments.resendNotificationConfirm.message',
      success: 'installments.resendNotificationConfirm.success',
    },
    cancelOrderConfirm: {
      header: 'installments.cancelOrderConfirm.header',
      message: 'installments.cancelOrderConfirm.message',
      success: 'installments.cancelOrderConfirm.success',
    },
  },
  payments: {
    fields: {
      supplier: 'payments.fields.supplier',
      status: 'payments.fields.status',
      amount: 'payments.fields.amount',
      sentAt: 'payments.fields.sentAt',
    },
    markPaidConfirm: {
      header: 'payments.markPaidConfirm.header',
      message: 'payments.markPaidConfirm.message',
      futureDateError: 'payments.markPaidConfirm.futureDateError',
      success: 'payments.markPaidConfirm.success',
      error: 'payments.markPaidConfirm.error',
    },
    resendNotificationConfirm: {
      header: 'payments.resendNotificationConfirm.header',
      message: 'payments.resendNotificationConfirm.message',
      success: 'payments.resendNotificationConfirm.success',
      error: 'payments.resendNotificationConfirm.error',
    },
    undoMarkPaidConfirm: {
      header: 'payments.undoMarkPaidConfirm.header',
      message: 'payments.undoMarkPaidConfirm.message',
      success: 'payments.undoMarkPaidConfirm.success',
      error: 'payments.undoMarkPaidConfirm.error',
    },
    undoSendConfirm: {
      header: 'payments.undoSendConfirm.header',
      message: 'payments.undoSendConfirm.message',
      success: 'payments.undoSendConfirm.success',
      error: 'payments.undoSendConfirm.error',
    },
  },
  paymentOrders: {
    sent: 'paymentOrders.sent',
    sendError: 'paymentOrders.sendError',
    sendDialog: {
      header: 'paymentOrders.sendDialog.header',
      message: 'paymentOrders.sendDialog.message',
    },
    action: {
      differentSuppliers: 'paymentOrders.action.differentSuppliers',
      notAllReleased: 'paymentOrders.action.notAllReleased',
      noRecipients: 'paymentOrders.action.noRecipients',
      notFound: 'paymentOrders.action.notFound',
      concurrentSend: 'paymentOrders.action.concurrentSend',
    },
  },
  measurements: {
    edit: {
      title: 'measurements.edit.title',
    },
    fields: {
      supplier: 'measurements.fields.supplier',
      work: 'measurements.fields.work',
      description: 'measurements.fields.description',
      status: 'measurements.fields.status',
      amountToPay: 'measurements.fields.amountToPay',
      dueDate: 'measurements.fields.dueDate',
    },
    form: {
      invalid: 'measurements.form.invalid',
      created: 'measurements.form.created',
      updated: 'measurements.form.updated',
      saveError: 'measurements.form.saveError',
      exceedsRemaining: 'measurements.form.exceedsRemaining',
      locationUnsupported: 'measurements.form.locationUnsupported',
      locationError: 'measurements.form.locationError',
    },
    action: {
      requiresSubmittableWork: 'measurements.action.requiresSubmittableWork',
      alreadyDecided: 'measurements.action.alreadyDecided',
      exceedsWorkTotal: 'measurements.action.exceedsWorkTotal',
      paymentAlreadyPaid: 'measurements.action.paymentAlreadyPaid',
      olderPending: 'measurements.action.olderPending',
    },
    approveConfirm: {
      header: 'measurements.approveConfirm.header',
      message: 'measurements.approveConfirm.message',
      success: 'measurements.approveConfirm.success',
    },
    rejectConfirm: {
      header: 'measurements.rejectConfirm.header',
      message: 'measurements.rejectConfirm.message',
      success: 'measurements.rejectConfirm.success',
    },
    approveManyConfirm: {
      header: 'measurements.approveManyConfirm.header',
      message: 'measurements.approveManyConfirm.message',
      success: 'measurements.approveManyConfirm.success',
      allFailed: 'measurements.approveManyConfirm.allFailed',
      partial: 'measurements.approveManyConfirm.partial',
    },
    deleteConfirm: {
      header: 'measurements.deleteConfirm.header',
      message: 'measurements.deleteConfirm.message',
      success: 'measurements.deleteConfirm.success',
      error: 'measurements.deleteConfirm.error',
    },
  },
  projects: {
    fields: {
      name: 'projects.fields.name',
      status: 'projects.fields.status',
      serviceFrontsCount: 'projects.fields.serviceFrontsCount',
      totalContractedAmount: 'projects.fields.totalContractedAmount',
      totalPaidAmount: 'projects.fields.totalPaidAmount',
      remainingAmount: 'projects.fields.remainingAmount',
      progress: 'projects.fields.progress',
    },
    form: {
      invalid: 'projects.form.invalid',
      created: 'projects.form.created',
      updated: 'projects.form.updated',
      saveError: 'projects.form.saveError',
      uploadSitePlan: 'projects.form.uploadSitePlan',
      sitePlanUpdated: 'projects.form.sitePlanUpdated',
      sitePlanSaveError: 'projects.form.sitePlanSaveError',
    },
  },
  suggestions: {
    fields: {
      description: 'suggestions.fields.description',
      status: 'suggestions.fields.status',
      createdAt: 'suggestions.fields.createdAt',
      periodCreatedAt: 'suggestions.fields.periodCreatedAt',
    },
    form: {
      invalid: 'suggestions.form.invalid',
      created: 'suggestions.form.created',
      saveError: 'suggestions.form.saveError',
    },
  },
  tickets: {
    fields: {
      title: 'tickets.fields.title',
      type: 'tickets.fields.type',
      priority: 'tickets.fields.priority',
      status: 'tickets.fields.status',
      work: 'tickets.fields.work',
      createdAt: 'tickets.fields.createdAt',
      periodCreatedAt: 'tickets.fields.periodCreatedAt',
      targetType: 'tickets.fields.targetType',
    },
    form: {
      invalid: 'tickets.form.invalid',
      created: 'tickets.form.created',
      saveError: 'tickets.form.saveError',
      closeInvalid: 'tickets.form.closeInvalid',
    },
    cancelConfirm: {
      header: 'tickets.cancelConfirm.header',
      message: 'tickets.cancelConfirm.message',
    },
  },
  actionPlans: {
    fields: {
      title: 'actionPlans.fields.title',
      status: 'actionPlans.fields.status',
      work: 'actionPlans.fields.work',
      createdAt: 'actionPlans.fields.createdAt',
      periodCreatedAt: 'actionPlans.fields.periodCreatedAt',
    },
    form: {
      invalid: 'actionPlans.form.invalid',
      created: 'actionPlans.form.created',
      updated: 'actionPlans.form.updated',
      saveError: 'actionPlans.form.saveError',
    },
    completeConfirm: {
      header: 'actionPlans.completeConfirm.header',
      message: 'actionPlans.completeConfirm.message',
    },
    cancelConfirm: {
      header: 'actionPlans.cancelConfirm.header',
      message: 'actionPlans.cancelConfirm.message',
    },
  },
  tasks: {
    fields: {
      title: 'tasks.fields.title',
      status: 'tasks.fields.status',
      assignee: 'tasks.fields.assignee',
      createdAt: 'tasks.fields.createdAt',
      periodCreatedAt: 'tasks.fields.periodCreatedAt',
    },
    form: {
      invalid: 'tasks.form.invalid',
      created: 'tasks.form.created',
      updated: 'tasks.form.updated',
      saveError: 'tasks.form.saveError',
    },
  },
  workAutoComplete: {
    settings: {
      saved: 'workAutoComplete.settings.saved',
      saveError: 'workAutoComplete.settings.saveError',
    },
  },
  approvalLimits: {
    form: {
      invalid: 'approvalLimits.form.invalid',
      invalidRange: 'approvalLimits.form.invalidRange',
      overlapsRange: 'approvalLimits.form.overlapsRange',
      created: 'approvalLimits.form.created',
      updated: 'approvalLimits.form.updated',
      saveError: 'approvalLimits.form.saveError',
    },
    deleteConfirm: {
      header: 'approvalLimits.deleteConfirm.header',
      message: 'approvalLimits.deleteConfirm.message',
      success: 'approvalLimits.deleteConfirm.success',
      error: 'approvalLimits.deleteConfirm.error',
    },
  },
  departments: {
    form: {
      invalid: 'departments.form.invalid',
      created: 'departments.form.created',
      updated: 'departments.form.updated',
      saveError: 'departments.form.saveError',
    },
    deleteConfirm: {
      header: 'departments.deleteConfirm.header',
      message: 'departments.deleteConfirm.message',
      success: 'departments.deleteConfirm.success',
      error: 'departments.deleteConfirm.error',
    },
  },
  validation: {
    required: 'validation.required',
    minLength: 'validation.minLength',
    maxLength: 'validation.maxLength',
    invalid: 'validation.invalid',
  },
  pagination: {
    report: 'pagination.report',
  },
  common: {
    no: 'common.no',
    to: 'common.to',
    yes: 'common.yes',
    send: 'common.send',
    from: 'common.from',
    info: 'common.info',
    save: 'common.save',
    until: 'common.until',
    error: 'common.error',
    filter: 'common.filter',
    cancel: 'common.cancel',
    delete: 'common.delete',
    logout: 'common.logout',
    warning: 'common.warning',
    confirm: 'common.confirm',
    success: 'common.success',
    notInformed: 'common.notInformed',
    tableFilters: 'common.tableFilters',
    errorMessage: 'common.errorMessage',
    noRecordsFound: 'common.noRecordsFound',
    advancedFilters: 'common.advancedFilters',
    notInformedFemale: 'common.notInformedFemale',
  },
  search: {
    line: 'common.search.line',
    process: 'common.search.process',
    transactions: 'common.search.transactions',
    salesSummary: 'common.search.salesSummary',
    creditOrder: 'common.search.creditOrder',
    bankStatement: 'common.search.bankStatement',
  },
  confirm: {
    logoutTitle: 'confirm.logoutTitle',
    logoutMessage: 'confirm.logoutMessage',
  },
} as const;

type NestedValues<T> = T extends object ? { [K in keyof T]: NestedValues<T[K]> }[keyof T] : T;

export type UiKey = NestedValues<typeof UI_KEYS>;

// ✅ só keys do menu
export type MenuKey = Extract<UiKey, `menu.${string}`>;
