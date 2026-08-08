import { FormGroup } from '@angular/forms';

import { ApiError } from './api-error.model';

export function applyApiFieldErrors(
  form: FormGroup,
  apiError: ApiError | null | undefined,
): boolean {
  const fieldErrors = apiError?.fieldErrors ?? [];
  if (!fieldErrors.length) return false;

  let applied = false;

  for (const fe of fieldErrors) {
    const field = (fe.field ?? '').trim();
    if (!field) continue;

    const control = form.get(field);
    if (!control) continue;

    const current = control.errors ?? {};
    control.setErrors({
      ...current,
      api: {
        code: fe.code,
        message: fe.userMessage,
        technicalMessage: fe.technicalMessage,
        rejectedValue: fe.rejectedValue,
      },
    });

    control.markAsTouched();
    control.markAsDirty();
    applied = true;
  }

  return applied;
}
