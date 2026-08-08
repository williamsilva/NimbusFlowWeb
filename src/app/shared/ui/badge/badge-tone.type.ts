import { CsBadgeSeverity } from './badge-severity.type';

export type CsBadgeTone =
  | CsBadgeSeverity
  | 'purple'
  | 'pink'
  | 'teal'
  | 'orange'
  | 'blue'
  | 'slate'
  | 'money'
  | 'erp'
  | 'rede'
  | 'bank'
  | 'error';

export interface CsBadgeProps {
  severity?: CsBadgeSeverity;
  class?: string;
}

const PRIME_SEVERITIES: readonly CsBadgeSeverity[] = [
  'success',
  'info',
  'warn',
  'danger',
  'secondary',
  'contrast',
];

export function badgeSeverityFromTone(
  tone: CsBadgeTone | null | undefined,
): CsBadgeSeverity | undefined {
  return isPrimeSeverity(tone) ? tone : undefined;
}

export function badgeClassFromTone(tone: CsBadgeTone | null | undefined): string | undefined {
  return isPrimeSeverity(tone) || !tone ? undefined : `cs-badge-${tone}`;
}

export function badgePropsFromTone(tone: CsBadgeTone | null | undefined): CsBadgeProps {
  return {
    severity: badgeSeverityFromTone(tone),
    class: badgeClassFromTone(tone),
  };
}

function isPrimeSeverity(tone: CsBadgeTone | null | undefined): tone is CsBadgeSeverity {
  return !!tone && PRIME_SEVERITIES.includes(tone as CsBadgeSeverity);
}
