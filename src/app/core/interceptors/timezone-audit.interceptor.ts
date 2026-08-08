import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// ISO sem timezone
const ISO_DATETIME_NO_TZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?$/;

// ISO com timezone
const ISO_DATETIME_WITH_TZ =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

type Finding = { path: string; value: string };

function scan(value: unknown, path = '$', out: Finding[] = []): Finding[] {
  if (value === null || value === undefined) return out;

  if (typeof value === 'string') {
    if (
      value.includes('T') &&
      ISO_DATETIME_NO_TZ.test(value) &&
      !ISO_DATETIME_WITH_TZ.test(value)
    ) {
      out.push({ path, value });
    }
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((v, i) => scan(v, `${path}[${i}]`, out));
    return out;
  }

  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) =>
      scan(v, `${path}.${k}`, out),
    );
  }

  return out;
}

export const timezoneStrictInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const isDev =
    typeof window !== 'undefined' &&
    (location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1' ||
      location.hostname.endsWith('.local'));

  if (!isDev) return next(req);

  return next(req).pipe(
    tap({
      next: (event: any) => {
        if (!event || !('body' in event)) return;

        const findings = scan(event.body);

        if (findings.length) {
          console.group('%c[NimbusFlow Security][UTC STRICT MODE]', 'color:#dc2626;font-weight:bold');
          console.error('ISO datetime SEM timezone detectado!');
          findings.slice(0, 20).forEach((f) => console.log(`${f.path} = "${f.value}"`));
          console.groupEnd();

          throw new Error(
            `UTC STRICT MODE: Backend retornou ${findings.length} datetime(s) sem timezone.`,
          );
        }
      },
    }),
  );
};
