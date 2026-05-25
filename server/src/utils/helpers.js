/**
 * Common helper functions for pagination, normalization, and validation
 * Centralizes logic used across multiple controllers to reduce duplication
 */

const normalizePage = (page) => {
  const parsed = Number(page);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const normalizeLimit = (limit, maxLimit = 100) => {
  const parsed = Number(limit);
  if (!Number.isInteger(parsed) || parsed <= 0) return 10;
  return Math.min(parsed, maxLimit);
};

const normalizeString = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const calculateSkip = (page, limit) => (normalizePage(page) - 1) * normalizeLimit(limit);

/**
 * Build standard pagination response metadata
 */
const buildPaginationMeta = (total, page, limit) => ({
  total,
  page: normalizePage(page),
  limit: normalizeLimit(limit),
  pages: Math.ceil(total / normalizeLimit(limit))
});

module.exports = {
  normalizePage,
  normalizeLimit,
  normalizeString,
  calculateSkip,
  buildPaginationMeta
};
