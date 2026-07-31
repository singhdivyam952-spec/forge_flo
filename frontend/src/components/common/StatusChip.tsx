import Chip, { type ChipProps } from '@mui/material/Chip';

const POSITIVE = new Set([
  'active', 'approved', 'accepted', 'completed', 'closed', 'passed', 'released',
  'received', 'delivered', 'confirmed', 'issued', 'sold', 'success', 'dispatched',
  'returnedtostock', 'posted',
]);

const WARNING = new Set([
  'pending', 'draft', 'planned', 'onhold', 'underreview', 'submitted', 'sent',
  'inprogress', 'partiallyreceived', 'partiallyissued', 'partiallydelivered',
  'partiallypassed', 'requested', 'segregated', 'generated', 'intransit', 'prototyping',
  'trial', 'designreview', 'initiated', 'underinvestigation', 'pendingverification',
]);

const NEGATIVE = new Set([
  'rejected', 'cancelled', 'failed', 'blacklisted', 'inactive', 'obsolete',
  'expired', 'disposed', 'scrapped',
]);

function normalize(value: string): string {
  return value.replace(/[\s_-]/g, '').toLowerCase();
}

export type StatusChipColor = ChipProps['color'];

export function resolveStatusColor(status?: string | null): StatusChipColor {
  if (!status) return 'default';
  const key = normalize(status);
  if (POSITIVE.has(key)) return 'success';
  if (WARNING.has(key)) return 'warning';
  if (NEGATIVE.has(key)) return 'error';
  return 'info';
}

interface StatusChipProps {
  status?: string | null;
  size?: ChipProps['size'];
}

export function StatusChip({ status, size = 'small' }: StatusChipProps) {
  if (!status) return <Chip label="—" size={size} variant="outlined" />;
  return <Chip label={status} color={resolveStatusColor(status)} size={size} variant="filled" />;
}

export default StatusChip;
