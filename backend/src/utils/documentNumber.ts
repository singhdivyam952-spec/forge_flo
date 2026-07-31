import dayjs from 'dayjs';
import { Counter } from '../models/Counter';

/**
 * Generates sequential, human-readable document numbers such as
 * `PO-2026-0001`, `GRN-2026-0032`, `INV-2026-0004`.
 *
 * The sequence resets automatically for each `prefix + period` combination
 * (default period is the calendar year) by using a distinct counter key,
 * and is made atomic via `findOneAndUpdate` with `$inc` + `upsert`.
 */
export interface DocumentNumberOptions {
  prefix: string;
  padding?: number;
  period?: 'year' | 'month' | 'none';
  separator?: string;
  date?: Date;
}

export async function generateDocumentNumber(options: DocumentNumberOptions): Promise<string> {
  const { prefix, padding = 4, period = 'year', separator = '-', date = new Date() } = options;

  const periodSegment = getPeriodSegment(period, date);
  const counterKey = periodSegment ? `${prefix}${separator}${periodSegment}` : prefix;

  const counter = await Counter.findOneAndUpdate(
    { key: counterKey },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).exec();

  const seqStr = String(counter.seq).padStart(padding, '0');

  return periodSegment
    ? `${prefix}${separator}${periodSegment}${separator}${seqStr}`
    : `${prefix}${separator}${seqStr}`;
}

function getPeriodSegment(period: 'year' | 'month' | 'none', date: Date): string | null {
  const d = dayjs(date);
  switch (period) {
    case 'year':
      return d.format('YYYY');
    case 'month':
      return d.format('YYYYMM');
    case 'none':
    default:
      return null;
  }
}

/** Peek the next number without incrementing the counter (for previews). */
export async function peekNextDocumentNumber(options: DocumentNumberOptions): Promise<string> {
  const { prefix, padding = 4, period = 'year', separator = '-', date = new Date() } = options;
  const periodSegment = getPeriodSegment(period, date);
  const counterKey = periodSegment ? `${prefix}${separator}${periodSegment}` : prefix;

  const counter = await Counter.findOne({ key: counterKey }).exec();
  const nextSeq = (counter?.seq ?? 0) + 1;
  const seqStr = String(nextSeq).padStart(padding, '0');

  return periodSegment
    ? `${prefix}${separator}${periodSegment}${separator}${seqStr}`
    : `${prefix}${separator}${seqStr}`;
}

export default generateDocumentNumber;
