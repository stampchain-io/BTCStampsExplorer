import { PaginationQueryParams } from "globals";

export function getPaginationParams(
  url: URL,
  type?: string,
): PaginationQueryParams {
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
