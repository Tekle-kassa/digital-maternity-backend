import { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function parsePagination(q: Record<string, unknown>) {
  const page = Math.max(1, parseInt(String(q.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(q.limit ?? "20"), 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function meta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export function sendData<T>(res: Response, data: T, status = 200, m?: PaginationMeta) {
  const body: { data: T; meta?: PaginationMeta } = { data };
  if (m) body.meta = m;
  return res.status(status).json(body);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  status: number,
  details?: Record<string, string[]>
) {
  return res.status(status).json({
    error: { code, message, ...(details ? { details } : {}) },
  });
}

export function parseExpiresInSeconds(exp: string): number {
  const m = /^(\d+)([smhd])$/i.exec(exp.trim());
  if (!m) return 900;
  const n = parseInt(m[1], 10);
  switch (m[2].toLowerCase()) {
    case "s":
      return n;
    case "m":
      return n * 60;
    case "h":
      return n * 3600;
    case "d":
      return n * 86400;
    default:
      return 900;
  }
}
