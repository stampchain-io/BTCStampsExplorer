// Table tabs
export type TableType = "stamps" | "src20" | "src101" | "vault";

export interface TableConfig {
  id: string;
  label: string | JSX.Element;
  count: number;
}

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
}

export interface FetchResponse {
  data: any[];
  total: number;
}

// Table styles
export const container = "dark-gradient rounded-lg p-3 mobileMd:p-6";
export const dataLabel =
  "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
export const dataValueXL =
  "text-3xl mobileLg:text-4xl font-black text-stamp-grey -mt-1";
export const dataValueXLlink = "text-3xl mobileLg:text-4xl font-black -mt-1";

// Table content
// Table styles
export const tableLabel =
  "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase pb-1.5";
export const tableValue =
  "text-xs mobileLg:text-sm font-normal text-stamp-grey-light w-full";
export const row = "h-8 hover:bg-stamp-purple/10";

// Cell alignment
export const tableAlign = {
  first: "text-left",
  middle: "text-center",
  last: "text-right",
};

// Default column group
export const defaultColGroup = {
  columns: 5,
  width: "w-[20%]",
};

// Helper functions
// Column group
export const generateColGroup = (customColumns?: Array<{ width: string }>) => {
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
export const getCellAlignment = (index: number, total: number) => {
  if (index === 0) return tableAlign.first;
  if (index === total - 1) return tableAlign.last;
  return tableAlign.middle;
};
