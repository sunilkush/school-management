import { STATUS_SEMANTICS } from '../theme/patterns';

/**
 * Descriptors name a status by TONE ('pending', 'active', 'overdue', …) rather than a hex value,
 * so every module's badges speak the one vocabulary the web app already uses
 * (frontend/src/styles/pageStyles.js STATUS) and none of them hardcode a color.
 */
export function toneColor(tone, colors) {
  return STATUS_SEMANTICS[tone]?.text ?? colors.textSecondary;
}

/** Maps the backend's four leave/approval states onto that vocabulary. */
export const APPROVAL_TONES = {
  pending: 'pending',
  approved: 'active',
  rejected: 'overdue',
  cancelled: 'inactive',
};
