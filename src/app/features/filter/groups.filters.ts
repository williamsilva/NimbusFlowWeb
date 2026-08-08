export interface GroupsAdvancedFilters {
  name?: string;
  description?: string;

  createdAtTo?: string;
  createdAtFrom?: string;

  createdBy?: string[] | null;

  /** Sempre fixado em APP_KEY pelo GroupsApiService — não é um filtro escolhido pelo usuário. */
  appKey?: string;
}
