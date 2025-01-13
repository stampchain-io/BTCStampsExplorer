import { PaginationQueryParams } from "$lib/types/pagination.d.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export function getPaginationParams(
  url: URL,
  type?: string,
): PaginationQueryParams | Response {
  let defaultLimit = 50;

  if (url.pathname.includes("/wallet/")) {
    defaultLimit = 32;
    if (type == "src20") defaultLimit = 8;
  } else {
    defaultLimit = 500;
  }

  const prefix = type ? `${type}_` : "";
  const limit = Number(url.searchParams.get(`${prefix}limit`)) || defaultLimit;
  const page = Number(url.searchParams.get(`${prefix}page`)) || 1;

  // Validate numeric parameters
  if (isNaN(limit) || limit < 1) {
    return ResponseUtil.badRequest("Invalid limit parameter");
  }
  if (isNaN(page) || page < 1) {
    return ResponseUtil.badRequest("Invalid page parameter");
  }

  return { limit, page };
}

export function paginate(total: number, page = 1, limit = 10) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    totalPages,
    total,
  };
}
