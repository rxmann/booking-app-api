import type { PaginationQueryDto } from './pagination-query.dto.js';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function pageArgs({ page, limit }: PaginationQueryDto) {
  return { skip: (page - 1) * limit, take: limit };
}

export function paginated<T>(
  items: T[],
  total: number,
  { page, limit }: PaginationQueryDto,
): Paginated<T> {
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
