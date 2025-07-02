export interface PaginationQueryParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  prefix?: string;
  onPageChange?: (page: number) => void;
}
