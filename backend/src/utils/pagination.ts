import { Request } from 'express';
import { DEFAULT_PAGE, DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '../constants';

export type SortOrder = 1 | -1;

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, SortOrder>;
  search: string;
  filters: Record<string, unknown>;
}

const RESERVED_QUERY_KEYS = new Set(['page', 'limit', 'sort', 'search', 'fields']);

/**
 * Parses common list-query parameters (`page`, `limit`, `sort`, `search`)
 * from an Express request, plus any additional query params as filters.
 *
 * Sort syntax: `sort=field1,-field2` -> { field1: 1, field2: -1 }
 */
export function parsePagination(req: Request): ParsedPagination {
  const query = req.query as Record<string, unknown>;

  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : DEFAULT_PAGE;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(Math.floor(rawLimit), MAX_PAGE_LIMIT)
    : DEFAULT_PAGE_LIMIT;

  const skip = (page - 1) * limit;

  const sort: Record<string, SortOrder> = {};
  if (typeof query.sort === 'string' && query.sort.trim().length > 0) {
    for (const rawField of query.sort.split(',')) {
      const field = rawField.trim();
      if (!field) continue;
      if (field.startsWith('-')) {
        sort[field.slice(1)] = -1;
      } else {
        sort[field] = 1;
      }
    }
  }
  if (Object.keys(sort).length === 0) {
    sort.createdAt = -1;
  }

  const search = typeof query.search === 'string' ? query.search.trim() : '';

  const filters: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(query)) {
    if (RESERVED_QUERY_KEYS.has(key)) continue;
    if (value === undefined || value === '') continue;
    filters[key] = value;
  }

  return { page, limit, skip, sort, search, filters };
}

/**
 * Builds a case-insensitive MongoDB `$or` regex filter across the given
 * fields for the provided search term. Returns `undefined` if there is no
 * search term.
 */
export function buildSearchFilter(search: string, fields: string[]): Record<string, unknown> | undefined {
  if (!search || fields.length === 0) return undefined;
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
}

export default parsePagination;
