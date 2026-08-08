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
  fieldErrors?: ApiFieldError[];
  correlationId?: string;
  path?: string;
  method?: string;
}
