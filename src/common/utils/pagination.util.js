/**
 * Normalizes pagination inputs at the service layer (defense in depth).
 * Zod coerces and validates query strings at the route layer; this guard
 * ensures clean numeric values even when the service is called directly
 * (tests, internal callers, future entry points that bypass middleware).
 *
 * @param {any} page  - Raw page value (string, number, undefined, etc.)
 * @param {any} limit - Raw limit value (string, number, undefined, etc.)
 * @returns {{ page: number, limit: number }}
 */
export const normalizePagination = (page, limit) => {
  const p = parseInt(page, 10);
  const l = parseInt(limit, 10);

  return {
    page:  (Number.isFinite(p) && p  >= 1) ? p           : 1,
    limit: (Number.isFinite(l) && l  >= 1) ? Math.min(l, 100) : 20,
  };
};
