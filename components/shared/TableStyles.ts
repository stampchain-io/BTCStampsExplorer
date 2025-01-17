// Table styling
// Title/counts tab styles
export const container = "dark-gradient rounded-lg p-3 mobileMd:p-6";
export const dataLabel =
  "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
export const dataValueXL =
  "text-3xl mobileLg:text-4xl font-black text-stamp-grey -mt-1";
export const dataValueXLlink = "text-3xl mobileLg:text-4xl font-black -mt-1";
export const textLoader =
  "text-sm mobileLg:text-base font-medium text-stamp-grey uppercase text-center py-3 animated-text-loader";
// Content styles
export const tableLabel =
  "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase pb-1.5";
export const tableValue =
  "text-xs mobileLg:text-sm font-normal text-stamp-grey-light w-full";
export const tableValueLink =
  "text-xs mobileLg:text-sm font-normal text-stamp-grey-light w-full hover:text-stamp-purple-bright cursor-pointer";
export const row = "h-8 hover:bg-stamp-purple-bright/15";

// Table types
export type TableType = "stamps" | "src20" | "src101" | "vault";

// Table title tabs
// Table type/counts
export interface TableProps {
  type: TableType;
  configs: Array<{ id: string }>;
  cpid?: string;
  tick?: string;
  initialCounts?: {
    dispensers?: number;
    sales?: number;
    transfers?: number;
    mints?: number;
  };
}

export interface TabData {
  dispensers?: any[];
  dispenses?: any[];
  sends?: any[];
  mints?: any[];
  transfers?: any[];
  [key: string]: any[] | undefined;
}

export interface FetchResponse {
  data: any[];
  total: number;
}

// Table content
// Default column group
export const defaultColGroup = {
  columns: 5,
  width: "w-[20%]",
};

// Cell alignment
export const cellAlignment = {
  first: "text-left",
  middle: "text-center",
  last: "text-right",
};

// Helper functions
// Column group
export const colGroup = (customColumns?: Array<{ width: string }>) => {
  if (customColumns) {
    return customColumns.map((col, i) => ({
      key: i,
      className: col.width,
    }));
  }

  return Array(defaultColGroup.columns)
    .fill(null)
    .map((_, i) => ({
      key: i,
      className: defaultColGroup.width,
    }));
};

// Cell alignment
export const cellAlign = (index: number, total: number) => {
  if (index === 0) return cellAlignment.first;
  if (index === total - 1) return cellAlignment.last;
  return cellAlignment.middle;
};
