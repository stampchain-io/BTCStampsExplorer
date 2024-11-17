import { PaginationQueryParams } from "globals";

export function getPaginationParams(url: URL): PaginationQueryParams {
  let defaultLimit = 50;

  if (url.pathname.includes("/wallet/")) {
    defaultLimit = 32;
  } else {
    defaultLimit = 500;
  }

  const limit = Number(url.searchParams.get("limit")) || defaultLimit;
  const page = Number(url.searchParams.get("page")) || 1;
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
