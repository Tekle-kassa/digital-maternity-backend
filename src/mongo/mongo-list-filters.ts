import type { Request } from "express";

/** Query keys consumed by pagination / sort — not applied as Mongo equality filters. */
const RESERVED = new Set(["page", "limit", "sort", "order"]);

function coerceValue(val: string): string | number | boolean {
  if (val === "true") return true;
  if (val === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);
  return val;
}

/** Equality filters from query string; `field_gte` / `field_lte` for ISO date ranges on `field`. */
export function buildMongoListFilter(req: Request): Record<string, unknown> {
  const q = req.query as Record<string, string | string[] | undefined>;
  const filter: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(q)) {
    if (RESERVED.has(key)) continue;
    const val = Array.isArray(raw) ? raw[0] : raw;
    if (val === undefined || val === "") continue;
    const s = String(val);

    if (key.endsWith("_gte") || key.endsWith("_lte")) {
      const base = key.replace(/_gte$|_lte$/, "");
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) continue;
      const op = key.endsWith("_gte") ? "$gte" : "$lte";
      const cur = filter[base];
      if (cur && typeof cur === "object" && !Array.isArray(cur)) {
        (cur as Record<string, Date>)[op] = d;
      } else {
        filter[base] = { [op]: d };
      }
      continue;
    }

    filter[key] = coerceValue(s);
  }

  return filter;
}

export function mongoListSort(
  req: Request,
  defaultField = "updatedAt",
): Record<string, 1 | -1> {
  const q = req.query as Record<string, string | string[] | undefined>;
  const sortField =
    typeof q.sort === "string" && q.sort.length > 0 ? q.sort : defaultField;
  const order: 1 | -1 =
    String(q.order ?? "desc").toLowerCase() === "asc" ? 1 : -1;
  return { [sortField]: order };
}
