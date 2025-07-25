import { WalletProviderKey } from "$constants";
import { PaginationQueryParams } from "./pagination.d.ts";
import { WalletSortKey } from "./sorting.d.ts";

// ===== HORIZON WALLET SPECIFIC TYPES =====

export interface HorizonAddress {
  address: string;
  type: "p2wpkh" | "p2sh" | "p2tr" | "p2pkh";
  publicKey: string;
}

export interface HorizonGetAddressesResponse {
  addresses: HorizonAddress[];
}

export interface HorizonSignMessageParams {
  message: string;
  address: string;
}

export interface HorizonSignPsbtParams {
  hex: string;
  signInputs: Record<string, number[]>; // address -> input indices mapping
}

export interface HorizonWalletAPI {
  request: (method: string, params: any) => Promise<any>;
}

// Global window interface extension
declare global {
  interface Window {
    HorizonWalletProvider?: HorizonWalletAPI;
  }
}

// Re-export for convenience
export type { WalletSortKey } from "./sorting.d.ts";

export interface StampBalance {
  cpid?: string;
  tick?: string;
  type: "STAMP" | "SRC-20" | "SRC-721";
  quantity: number;
  decimals?: number;
  divisible?: boolean;
  stamp?: number;
  info?: any;
}

// UTXO information for wallet stamps
export interface UTXOInfo {
  quantity: number;
  utxo: string;
}

// Enhanced stamp interface for wallet display with value and UTXO information
export interface WalletStampWithValue extends StampBalance {
  balance?: number; // Total balance of this stamp owned by the wallet
  unbound_quantity?: number; // Quantity NOT attached to UTXOs (unbound/detached)
  utxos?: UTXOInfo[]; // UTXO attachment information (detailed)

  // Additional StampRow fields for wallet display
  stamp?: number;
  tx_hash?: string;
  stamp_url?: string;
  stamp_mimetype?: string;
  supply?: number;
  creator?: string;
  creator_name?: string;
  divisible?: boolean;
  locked?: number;
  cpid?: string;
  marketData?: any;
}

// Utility type for checking UTXO attachment status
export interface UTXOAttachmentInfo {
  hasUTXOAttachment: boolean;
  attachedQuantity: number;
  unattachedQuantity: number;
  totalBalance: number;
}

// Base interface for chain and mempool stats from Mempool API
interface BTCStatsDetail {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}

// Full Mempool API response type
export interface MempoolAddressResponse {
  address: string;
  chain_stats: BTCStatsDetail;
  mempool_stats: BTCStatsDetail;
}

export interface BlockCypherAddressBalanceResponse {
  address: string;
  total_received: number;
  total_sent: number;
  balance: number;
  unconfirmed_balance: number;
  final_balance: number;
  n_tx: number;
  unconfirmed_n_tx: number;
  final_n_tx: number;
}

// Basic balance interface used across the application
export interface BTCBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
  txCount?: number;
  unconfirmedTxCount?: number;
}

// Extended balance info with USD values and additional data
export interface BTCBalanceInfo {
  address: string;
  balance: number;
  txCount: number;
  unconfirmedBalance: number;
  unconfirmedTxCount: number;
  btcPrice?: number;
  usdValue?: number;
}

// Wallet provider types
export interface WalletInfo {
  address?: string;
  balance?: BTCBalance;
  provider?: WalletProviderKey;
  connected?: boolean;
  network?: "mainnet" | "testnet";
  // Legacy properties for backward compatibility
  accounts?: string[];
  publicKey?: string;
  btcBalance?: BTCBalance;
  addressType?: "p2wpkh" | "p2tr";
  stampBalance?: StampBalance[];
}

// Wallet connection state
export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
  wallet?: WalletInfo;
  supportedWallets: WalletProviderKey[];
}

// Wallet connection methods
export interface WalletConnectionMethods {
  connect: (provider: WalletProviderKey) => Promise<void>;
  disconnect: () => Promise<void>;
  getBalance: () => Promise<BTCBalance>;
  signTransaction: (tx: any) => Promise<string>;
  broadcastTransaction: (signedTx: string) => Promise<string>;
}

// Combined wallet context
export interface WalletContext
  extends WalletConnectionState, WalletConnectionMethods {
  refreshBalance: () => Promise<void>;
  isRefreshing: boolean;
}

// Wallet display preferences
export interface WalletDisplayPreferences {
  showUSDValues: boolean;
  showQuantityDetails: boolean;
  showRecentActivity: boolean;
  defaultSortBy: WalletSortKey;
  itemsPerPage: number;
}

// Wallet stats aggregation
export interface WalletStats {
  totalStamps: number;
  totalValue: number;
  totalUSDValue?: number;
  uniqueStamps: number;
  recentActivity: {
    lastTransaction?: Date;
    transactionCount24h: number;
    volumeChange24h: number;
  };
}

// Wallet activity item
export interface WalletActivityItem {
  type: "purchase" | "sale" | "transfer" | "mint";
  stamp: number;
  quantity: number;
  price?: number;
  timestamp: Date;
  txHash: string;
  counterparty?: string;
}

// Wallet activity response
export interface WalletActivityResponse {
  data: WalletActivityItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: WalletStats;
}

// Dispenser aggregation for wallet display
export interface WalletDispenserInfo {
  stamp: number;
  quantity: number;
  pricePerStamp: number;
  totalValue: number;
  isActive: boolean;
  createdAt: Date;
  lastActivity?: Date;
}

// Wallet page data structure
export interface WalletPageData {
  address: string;
  balance: BTCBalance;
  stamps: WalletStampWithValue[];
  dispensers: WalletDispenserInfo[];
  activity: WalletActivityItem[];
  stats: WalletStats;
  preferences: WalletDisplayPreferences;
  lastUpdated: Date;
}

// Wallet filter options
export interface WalletFilterOptions {
  priceRange?: {
    min: number;
    max: number;
  };
  quantityRange?: {
    min: number;
    max: number;
  };
  hasUTXOAttachment?: boolean;
  hasMarketData?: boolean;
  stampTypes?: ("STAMP" | "SRC-20" | "SRC-721")[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Wallet search and filter state
export interface WalletSearchState {
  query: string;
  filters: WalletFilterOptions;
  sortBy: WalletSortKey;
  isLoading: boolean;
  error?: string;
  results: WalletStampWithValue[];
  totalResults: number;
}

// Wallet navigation state for complex wallet interfaces
export interface WalletNavigationState {
  currentTab: "stamps" | "activity" | "dispensers" | "stats";
  stampView: "grid" | "list" | "table";
  showFilters: boolean;
  showSearch: boolean;
  selectedStamps: number[];
  bulkActions: {
    isEnabled: boolean;
    availableActions: string[];
    isProcessing: boolean;
  };
  breadcrumbs: {
    label: string;
    href: string;
  }[];
}

// Wallet page query parameters
export interface WalletPageParams {
  address: string;
  anchor: string;
  tab?: "stamps" | "activity" | "dispensers" | "stats";
  view?: "grid" | "list" | "table";
  search?: string;
  filters?: {
    priceMin?: number;
    priceMax?: number;
    quantityMin?: number;
    quantityMax?: number;
    hasUTXO?: boolean;
    hasMarketData?: boolean;
    types?: string;
    dateStart?: string;
    dateEnd?: string;
  };
  stamps?: {
    page?: number;
    limit?: number;
    sortBy?: WalletSortKey;
  };
  activity?: {
    page?: number;
    limit?: number;
    sortBy?: "date_desc" | "date_asc" | "value_desc" | "value_asc";
  };
  dispensers?: {
    page?: number;
    limit?: number;
    sortBy?: "date_desc" | "date_asc" | "price_desc" | "price_asc";
  };
  stampsSortBy?: "ASC" | "DESC";
  src20SortBy?: "ASC" | "DESC";
  dispensersSortBy?: "ASC" | "DESC";
}

export interface WalletStampsQueryParams extends PaginationQueryParams {
  sortBy?: WalletSortKey;
}

export interface WalletStampsApiResponse {
  data: WalletStampWithValue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stampValues: {
    stampValues: Record<string, number>;
    totalValue: number;
  };
  metadata: {
    marketDataCacheStatus: string;
    enhancedWithMarketData: number;
    sortBy?: WalletSortKey;
  };
}

export interface WalletPageProps {
  walletData: WalletOverviewInfo;
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  data: {
    stamps: any;
    src20: any;
    dispensers: any;
  };
  stampsSortBy?: "ASC" | "DESC";
  src20SortBy?: "ASC" | "DESC";
}

/* ===== WALLET CONTENT PROPS ===== */

export interface WalletContentProps {
  stamps: any;
  src20: any;
  dispensers: any;
  address: string;
  anchor?: string;
  stampsSortBy?: "ASC" | "DESC";
  src20SortBy?: "ASC" | "DESC";
  dispensersSortBy?: "ASC" | "DESC";
}

export interface WalletOverviewInfo {
  totalStamps: number;
  totalValue: number;
  totalSRC20: number;
  totalDispensers: number;
  lastActivity?: Date;
  // Core wallet properties
  address: string;
  balance: number;
  usdValue: number;
  fee?: number;
  btcPrice: number; // Required for calculations
  // Dispensers data - matching component interface
  dispensers?: {
    open: number;
    closed: number;
    total: number;
  };
  // Value breakdowns
  stampValue?: number;
  src20Value?: number;
  // SRC-101 data
  src101?: {
    names: string[];
  };
  // Creator information
  creatorName?: string;
}

/* ===== EXISTING WALLET TYPES ===== */
