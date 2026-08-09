export interface ApiFieldError {
  field: string;
  code: string;
  userMessage?: string;
  technicalMessage?: string;
  rejectedValue?: unknown;
}

export interface ApiError {
  timestamp?: string;
  status?: number;
  error?: string;
  code?: string;
  userMessage?: string;
  technicalMessage?: string;
  message?: string; // compatibilidade temporária
  /** ProblemDetail padrão do Spring (RFC 7807) - usado por endpoints que lançam
   *  ResponseStatusException puro (ex.: NimbusAuthAdminClient.mapUpstreamError) em vez do envelope
   *  customizado {code, userMessage, ...}. Nesses casos "detail" carrega o mesmo texto que iria em
   *  "code" (ver GlobalErrorCode). */
  detail?: string;
  fieldErrors?: ApiFieldError[];
  correlationId?: string;
  path?: string;
  method?: string;
}
