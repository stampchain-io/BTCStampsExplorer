export type TableType = "stamps" | "src20" | "bitname" | "vault";

export interface TableConfig {
  id: string;
  label: string | JSX.Element;
  count: number;
}

export interface TableProps {
  type: TableType;
  configs: TableConfig[];
  cpid?: string; // For stamps
  tick?: string; // For src20
  name?: string; // For bitname
  address?: string; // For vault
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

// Reusable table styling
export const TABLE_STYLES = {
  container: "dark-gradient rounded-lg p-3 mobileMd:p-6",
  dataLabel:
    "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase",
  dataValueXL: "text-3xl mobileLg:text-4xl font-black text-stamp-grey -mt-1",
  dataValueXLlink: "text-3xl mobileLg:text-4xl font-black -mt-1",
};
export const dataLabel =
  "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
export const tableLabel =
  "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase pb-1.5";
export const tableValue =
  "text-xs mobileLg:text-sm font-normal text-stamp-grey-light w-full";
export const row = "h-8 hover:bg-stamp-purple/10";

// Add text alignment helpers
export const tableAlign = {
  first: "text-left",
  middle: "text-center",
  last: "text-right",
};

// Add default colgroup
export const defaultColGroup = {
  columns: 5,
  width: "w-[20%]",
};

// Helper function to generate colgroup
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

// Helper function to get cell alignment
export const getCellAlignment = (index: number, total: number) => {
  if (index === 0) return tableAlign.first;
  if (index === total - 1) return tableAlign.last;
  return tableAlign.middle;
};
