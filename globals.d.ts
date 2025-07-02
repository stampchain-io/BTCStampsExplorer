// General Types ---------------------------------------------------------------
export type ROOT_DOMAIN_TYPES =
  | ".btc"
  | ".sats"
  | ".xbt"
  | ".x"
  | ".pink";
export type SUBPROTOCOLS =
  | "STAMP"
  | "SRC-20"
  | "SRC-721"
  | "SRC-101";
export type STAMP_TYPES = // These just reformat to variations of SUBPROTOCOLS
  | "all"
  | "stamps"
  | "cursed"
  | "classic"
  | "posh"
  | "src20"; // Note this is only for showing the src20 images, not actual SRC-20 details
// | "recursive"; this is a filter not a type when passed to the db
// see filterOptions
export type STAMP_FILTER_TYPES =
  | "pixel"
  | "vector"
  | "for sale"
  | "trending sales"
  | "sold"
  | "recursive";
export type STAMP_SUFFIX_FILTERS =
  | "gif"
  | "jpg"
  | "png"
  | "webp"
  | "bmp"
  | "jpeg"
  | "svg"
  | "html";
export type SRC20_TYPES =
  | "all"
  | "deploy"
  | "mint"
  | "transfer"
  | "trending";
export type SRC20_FILTER_TYPES =
  | "minting"
  | "trending mints"
  | "deploy"
  | "supply"
  | "marketcap"
  | "holders"
  | "volume"
  | "price change";
export type WALLET_FILTER_TYPES =
  | "all"
  | "stamps"
  | "collections"
  | "dispensers"
  | "tokens";
export type COLLECTION_FILTER_TYPES =
  | "all"
  | "posh"
  | "recursive"
  | "artists";
export type LISTING_FILTER_TYPES =
  | "all"
  | "psbt"
  | "dispensers";

// START ADDED TYPE
export interface MarketListingAggregated {
  tick: string;
  floor_unit_price: number;
  mcap: number;
  volume24: number;
  stamp_url?: string | null;
  tx_hash: string;
  holder_count: number;
  market_data: {
    stampscan: {
      price: number;
      volume24: number;
    };
    openstamp: {
      price: number;
      volume24: number;
    };
  };
  change24?: number; // Added for step 6
}
// END ADDED TYPE

// Filter types - Stamp
export type STAMP_MARKETPLACE =
  // Main market types
  | "listings"
  | "sales"
  // Market sub-options
  | "dispensers"
  | "atomics"
  // Listing price types
  | "all" // Default - show all listings
  | "bargain" // <0.0025 BTC
  | "affordable" // 0.005-0.01 BTC
  | "premium" // >0.1 BTC
  // Sales types
  | "recent"
  | "premium" // >0.1 BTC
  | "volume" // Maps to volume_24h_btc, volume_7d_btc, volume_30d_btc database fields
  // Shared options
  | "custom" // Custom price range
  // Unused filter types
  | "psbt"; // aka "utxo bound"

export type STAMP_FILETYPES =
  | "jpg" // Maps to StampTableV4.stamp_mimetype = 'image/jpeg'
  | "jpeg" // Grouped with jpg
  | "png" // Maps to StampTableV4.stamp_mimetype = 'image/png'
  | "gif" // Maps to StampTableV4.stamp_mimetype = 'image/gif'
  | "webp" // Maps to StampTableV4.stamp_mimetype = 'image/webp'
  | "avif" // Maps to StampTableV4.stamp_mimetype = 'image/avif'
  | "bmp" // Maps to StampTableV4.stamp_mimetype = 'image/bmp'
  | "svg" // Maps to StampTableV4.stamp_mimetype = 'image/svg+xml'
  | "html" // Maps to StampTableV4.stamp_mimetype = 'text/html'
  | "txt" // Maps to StampTableV4.stamp_mimetype = 'text/plain' - Unused in the UI
  | "mp3" // Maps to StampTableV4.stamp_mimetype = 'audio/mpeg'
  | "mpeg" // Grouped with mp3
  | "legacy" // Maps to StampTableV4.block_index < 833000
  | "olga"; // Maps to StampTableV4.block_index >= 833000

export type STAMP_EDITIONS =
  | "single" // Maps to StampTableV4.supply = 1
  | "multiple" // Maps to StampTableV4.supply > 1
  | "locked" // Maps to StampTableV4.locked = 1
  | "unlocked" // Maps to StampTableV4.locked = 0
  | "divisible"; // Maps to StampTableV4.divisible = 1

export type STAMP_RANGES =
  | "100" // stamp < 100
  | "1000" // stamp < 1000
  | "5000" // stamp < 5000
  | "10000" // stamp < 10000
  | "custom"; // NEEDS TO BE CORRECTLY UPDATED

export type STAMP_FILESIZES =
  | "<1kb" // < 1,024 bytes
  | "1kb-7kb" // 1,024 - 7,168 bytes
  | "7kb-32kb" // 7,168 - 32,768 bytes
  | "32kb-64kb" // 32,768 - 65,536 bytes
  | "custom"; // User-defined range

// Filter types - SRC20
export type SRC20_STATUS =
  | "fully minted" // Compare SRC20Valid with mint_status where progress = 100%
  | "minting" // Compare SRC20Valid with mint_status where progress < 100%
  | "trending mints"; // Requires aggregation of recent mint transactions

export type SRC20_DETAILS =
  | "deploy" // Maps to SRC20Valid.op = 'deploy'
  | "supply" // Maps to SRC20Valid.max field
  | "holders"; // Maps to src20_token_stats.holders_count
// Include "Holders" min/max values (when user applied)
// details: {
// deploy: boolean;
// supply: boolean;
// holders: boolean;
// holdersRange?: {
//  min: number;
//  max: number;
//  };
// supplyRange?: {
//   min: string | number;
//   max: string | number;
// };

export type SRC20_MARKET =
  | "marketcap" // Calculated field: floor_price * total_supply
  | "volume" // Calculated from recent transactions
  | "price change"; // Calculated from price history
// Include "volume" and "price change" periods - default value = 24H
// market: {
// marketcap: boolean;
// marketcapRange?: {
//   min: number;
//   max: number;
// };
// volume: boolean;
// volumePeriod?: "24h" | "3d" | "7d";
// priceChange: boolean;
// priceChangePeriod?: "24h" | "3d" | "7d";
// priceChangeRange?: {
//   min: number; // Percentage
//   max: number; // Percentage
// };
// };

// Full Filter Interfaces
export interface StampFilters {
  // Market Place filters
  market: Extract<STAMP_MARKETPLACE, "listings" | "sales"> | "";
  dispensers: boolean;
  atomics: boolean;

  // Listings price range
  listings:
    | Extract<
      STAMP_MARKETPLACE,
      "all" | "bargain" | "affordable" | "premium" | "custom"
    >
    | "";
  listingsMin: string;
  listingsMax: string;

  // SALES options
  sales:
    | Extract<STAMP_MARKETPLACE, "recent" | "premium" | "custom" | "volume">
    | "";
  salesMin: string;
  salesMax: string;

  // Volume (for trending sales)
  volume: "24h" | "7d" | "30d" | "";
  volumeMin: string;
  volumeMax: string;

  // Other existing filters
  fileType: STAMP_FILETYPES[];
  fileSize: STAMP_FILESIZES | null;
  fileSizeMin: string;
  fileSizeMax: string;
  editions: STAMP_EDITIONS[];
  range: STAMP_RANGES | null;
  rangeMin: string;
  rangeMax: string;

  // Market Data Filters (Task 42)
  minHolderCount?: string;
  maxHolderCount?: string;
  minDistributionScore?: string;
  maxTopHolderPercentage?: string;
  minFloorPriceBTC?: string;
  maxFloorPriceBTC?: string;
  minVolume24h?: string;
  minPriceChange24h?: string;
  minDataQualityScore?: string;
  maxCacheAgeMinutes?: string;
  priceSource?: string;

  [key: string]: any; // Keep index signature for flexibility
}

export interface SRC20Filters {
  status?: SRC20_STATUS[];
  details?: {
    deploy?: boolean;
    supply?: boolean;
    holders?: boolean;
    holdersRange?: {
      min: number;
      max: number;
    };
    supplyRange?: {
      min: string | number;
      max: string | number;
    };
  };
  market?: {
    marketcap?: boolean;
    marketcapRange?: {
      min: number;
      max: number;
    };
    volume?: boolean;
    volumePeriod?: "24h" | "3d" | "7d";
    priceChange?: boolean;
    priceChangePeriod?: "24h" | "3d" | "7d";
    priceChangeRange?: {
      min: number; // Percentage
      max: number; // Percentage
    };
  };
  search?: string; // Maps to tick or tick_hash
}

// Market Data Filters Interface for Task 42
export interface MarketDataFilters {
  // Holder metrics
  minHolderCount?: number;
  maxHolderCount?: number;
  minDistributionScore?: number; // 0-100
  maxTopHolderPercentage?: number; // 0-100

  // Market metrics
  minFloorPriceBTC?: number;
  maxFloorPriceBTC?: number;
  minVolume24h?: number;
  minPriceChange24h?: number; // Percentage

  // Data quality
  minDataQualityScore?: number; // 0-10
  maxCacheAgeMinutes?: number;
  priceSource?: string[]; // Filter by price source
}

// Utility type for handling emoji ticks
export interface EmojiTickHandling {
  ensureUnicodeEscape: (tick: string) => string; // For DB operations
  convertToEmoji: (tick: string) => string; // For display
  isEmojiFormat: (tick: string) => boolean;
  isUnicodeEscapeFormat: (tick: string) => boolean;
  isURLEncodedFormat: (tick: string) => boolean;
}

import Big from "big";

export interface BlockRow {
  block_index: number;
  block_hash: string;
  block_time: number | Date;
  previous_block_hash: string;
  difficulty: number;
  ledger_hash: string;
  txlist_hash: string;
  messages_hash: string;
  indexed: 1;
  issuances?: number;
  sends?: number;
}
export interface StampRow {
  stamp: number | null;
  block_index: number;
  cpid: string;
  creator: string;
  divisible: boolean;
  keyburn: number | null;
  locked: number;
  stamp_base64: string;
  stamp_mimetype: string;
  stamp_url: string;
  supply: number;
  block_time: Date;
  tx_hash: string;
  ident: SUBPROTOCOLS;
  creator_name: string | null;
  stamp_hash: string;
  file_hash: string;
  floorPrice?: number | "priceless";
  marketCap?: number | "priceless";
  balance?: number | string;
  floorPriceUSD?: number | null;
  marketCapUSD?: number | null;
  recentSalePrice?: number | "priceless";
  unbound_quantity: number;
  sale_data?: {
    btc_amount: number;
    block_index: number;
    tx_hash: string;
  };
}

export interface DisplayCountBreakpoints {
  "mobileSm": number; // 360px+
  "mobileMd"?: number; // 568
  "mobileLg": number; // 768px+
  "tablet": number; // 1024px+
  "desktop": number; // 1440px+
}

export interface StampGalleryProps {
  title?: string;
  subTitle?: string;
  type?: string;
  stamps: StampRow[];
  layout: "grid" | "row";
  isRecentSales?: boolean;
  filterBy?: STAMP_FILTER_TYPES | STAMP_FILTER_TYPES[];
  showDetails?: boolean;
  showEdition?: boolean;
  gridClass?: string;
  displayCounts?: DisplayCountBreakpoints;
  pagination?: Pagination;
  showMinDetails?: boolean;
  variant?: "default" | "grey";
  viewAllLink?: string;
  alignRight?: boolean;
  fromPage?: string;
  sortBy?: "ASC" | "DESC" | undefined;
}

export interface CollectionGalleryProps {
  title?: string;
  subTitle?: string;
  collections: Collection[];
  gridClass?: string;
  displayCounts?: DisplayCountBreakpoints;
  pagination?: Pagination;
}

export interface SRC20Row {
  tx_hash: string;
  block_index: number;
  p: string;
  op: string;
  tick: string;
  tick_hash: string;
  creator: string;
  creator_name: string | null;
  amt?: string | bigint;
  deci?: number;
  max?: string | bigint;
  lim?: string | bigint;
  destination: string;
  destination_name?: string;
  block_time: Date;
  status: string;
  row_num: number;
  progress?: string | null;
  email?: string;
  web?: string;
  tg?: string;
  x?: string;
  holders: number;
  floor_unit_price?: number;
  mcap?: number;
  top_mints_percentage?: number;
  volume_7d?: number;
  value?: number;
  stamp_url?: string;
  deploy_img?: string;
  deploy_tx?: string;
  mint_progress?: {
    max_supply: string;
    total_minted: string;
    limit: string;
    total_mints: number;
    progress: string;
    decimals: number;
    tx_hash: string;
    tick: string;
  };
}

// Add EnrichedSRC20Row type
export interface EnrichedSRC20Row extends SRC20Row {
  market_data?: MarketListingAggregated; // MarketListingAggregated is already defined above
  chart?: any;
}

interface SendRow {
  source: string;
  destination: string;
  cpid: string | null;
  tick: string | null;
  memo: string;
  quantity: string | bigint;
  tx_hash: string;
  block_index: number;
  satoshirate: number | null;
  block_time: Date;
}

export interface HolderRow {
  address: string;
  quantity: number;
  divisible: boolean;
}

export interface ProcessedHolder {
  address: string;
  quantity: number;
}

export interface DispenseRow {
  tx_hash: string;
  block_index: number;
  cpid: string;
  source: string;
  destination: string;
  dispenser_tx_hash: string;
  dispense_quantity: number;
}

export interface DispenserRow {
  tx_hash: string;
  block_index: number;
  source: string;
  cpid: string;
  give_quantity: number;
  give_remaining: number;
  escrow_quantity: number;
  satoshirate: number;
  btcrate: number;
  origin: string;
  dispenses: DispenseRow[];
}

export interface BlockInfo {
  block_info: BlockRow;
  issuances: StampRow[];
  sends: SendRow[];
}

export interface BtcInfo {
  address: string;
  balance: number;
  txCount: number;
  unconfirmedBalance: number;
  unconfirmedTxCount: number;
}

export interface XCPParams {
  filters?: {
    field: string;
    op: string;
    value: string;
  }[];
  address?: string;
  asset?: string;
  source?: string;
  quantity?: number | string;
  divisible?: boolean;
  lock?: boolean;
  description?: string;
  reset?: boolean;
  allow_unconfirmed_inputs?: boolean;
  extended_tx_info?: boolean;
  disable_utxo_locks?: boolean;
  fee_per_kb?: number;
}

export interface SRC20Balance {
  address: string;
  p: string;
  tick: string;
  amt: number;
  block_time: Date;
  last_update: number;
  deploy_tx: string;
  deploy_img: string;
}

export interface Src20Detail {
  tx_hash: string;
  block_index: number;
  p: string;
  op: string;
  tick: string;
  creator: string;
  amt: Big | null;
  deci: number;
  lim: string;
  max: string;
  destination: string;
  block_time: string;
  creator_name: string | null;
  destination_name: string;
  // market_data and chart removed from here, will be on EnrichedSRC20Row for relevant responses
}

export interface Src20SnapShotDetail {
  tick: string;
  address: string;
  balance: Big;
}

export interface StampBalance {
  cpid: string;
  stamp: number;
  stamp_base64: string;
  stamp_url: string;
  stamp_mimetype: string;
  tx_hash: string;
  divisible: 0 | 1;
  supply: number | string;
  locked: 0 | 1 | boolean;
  creator: string;
  creator_name: string | null;
  balance: number | string;
}

interface MintStatus {
  max_supply: string;
  total_minted: string;
  total_mints: number;
  progress: string;
  decimals: number;
  limit: number | null;
}

interface SRC101DeployDetail {
  tx_hash: string;
  block_index: number;
  p: string;
  op: string;
  tick: string | null;
  tick_hash: string | null;
  name: string | null;
  description: string | null;
  wla: string | null;
  imglp: string | null;
  imgf: string | null;
  creator: string;
  pri: number | null;
  lim: number | null;
  mintstart: number | null;
  mintend: number | null;
  owner: string | null;
  block_time: string;
  recipients: string[];
}

export interface SRC101Balance {
  address: string;
  p: string;
  deploy_hash: string;
  tokenid: string;
  tokenid_utf8: string;
  expire_timestamp: number;
  last_update: number;
  address_btc: string;
  address_eth: string;
  txt_data: string;
  img: string;
  owner: string;
}

export interface Src101Detail {
  tx_hash: string;
  block_index: number;
  p: string;
  op: string;
  tick: string | null;
  tick_hash: string | null;
  name: string | null;
  tokenid: string[] | null;
  tokenid_utf8: string | null;
  description: string | null;
  wla: string | null;
  imglp: string | null;
  imgf: string | null;
  deploy_hash: string | null;
  creator: string;
  pri: number | null;
  dua: number | null;
  lim: number | null;
  mintstart: number | null;
  mintend: number | null;
  owner: string | null;
  toaddress: string | null;
  destination: string;
  block_time: string;
}
// Request Types ---------------------------------------------------------------

export interface SRC20TrxRequestParams {
  block_index?: number | null;
  tick?: string | string[] | null;
  op?: string | string[] | null;
  limit?: number;
  page?: number;
  sort?: string; // sort is only used on API requests
  sortBy?: string;
  filterBy?: string | string[] | null;
  tx_hash?: string | null;
  address?: string | null;
  noPagination?: boolean;
  singleResult?: boolean;
}

export interface SRC101TokenidsParams {
  deploy_hash: string;
  address_btc: string;
  prim: boolean;
  limit?: number;
  page?: number;
  sort?: string;
}

export interface SRC101ValidTxTotalCountParams {
  tick?: string;
  op?: string;
  block_index?: string;
  deploy_hash?: string;
  tx_hash?: string;
  address?: string;
  limit?: number;
  page?: number;
}

export interface SRC101OwnerParams {
  deploy_hash?: string;
  tokenid?: string;
  index?: number;
  expire?: number;
  limit?: number;
  page?: number;
  sort?: string;
}

export interface SRC101TxParams {
  tick?: string;
  op?: string;
  valid?: number;
  block_index?: string;
  deploy_hash?: string;
  limit?: number;
  page?: number;
}

export interface SRC101ValidTxParams {
  tick?: string;
  op?: string;
  block_index?: string;
  deploy_hash?: string;
  tx_hash?: string;
  address?: string;
  limit?: number;
  page?: number;
}

export interface Src101BalanceParams {
  address: string | null;
  limit?: number;
  page?: number;
  sort?: string;
}

// Response Types --------------------------------------------------------------

export interface Pagination {
  page: number;
  totalPages: number;
  prefix?: string;
  onPageChange?: (page: number) => void;
}

export interface PaginatedStampResponseBody {
  last_block: number;
  page: number;
  limit: number;
  totalPages: number;
  data: StampRow[];
}

export interface PaginatedIdResponseBody extends PaginatedStampResponseBody {
  ident: SUBPROTOCOLS;
}

export interface PaginatedStampBalanceResponseBody {
  last_block: number;
  page: number;
  limit: number;
  totalPages: number;
  data: StampBalance[];
}

export interface PaginatedSrc20ResponseBody {
  last_block: number;
  page: number;
  limit: number;
  totalPages: number;
  data: EnrichedSRC20Row[]; // CHANGED from Src20Detail[] to EnrichedSRC20Row[]
}

export interface PaginatedSrc101ResponseBody {
  last_block: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Src101Detail[];
}

export interface TotalSrc101ResponseBody {
  last_block: number;
  data: number;
}

export interface TokenidSrc101ResponseBody {
  last_block: number;
  page: number;
  limit: number;
  totalPages: number;
  data: string;
}

export interface PaginatedTickResponseBody {
  last_block: number;
  page: number;
  limit: number;
  totalPages: number;
  mint_status: MintStatus;
  data: Src20Detail[];
}

export interface DeployResponseBody {
  last_block: number;
  mint_status: MintStatus;
  data: Src20Detail;
}

export interface StampsAndSrc20 {
  stamps: StampRow[];
  src20: SRC20Balance[];
}

export interface Src20ResponseBody {
  last_block: number;
  data: Src20Detail;
}

export interface PaginatedSrc20BalanceResponseBody {
  last_block: number;
  page: number;
  limit: number;
  totalPages: number;
  data: SRC20Balance[] | [];
}

export interface Src20BalanceResponseBody {
  last_block: number;
  data: SRC20Balance;
  pagination?: Pagination;
}

export type StampPageProps = {
  data: {
    stamps: StampRow[];
    page: number;
    totalPages: number;
    selectedTab: "all" | "classic" | "posh" | "recent_sales";
    sortBy: "ASC" | "DESC";
    filterBy: STAMP_FILTER_TYPES[];
    filters: StampFilters;
    search: string;
  };
};

export interface BlockInfoResponseBody {
  block_info: BlockRow;
  issuances: StampRow[];
  sends: SendRow[];
  last_block: number;
}

export interface StampBlockResponseBody {
  block_info: BlockRow;
  data: StampRow[];
  last_block: number;
}

export interface PaginatedDispenserResponseBody {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  last_block: number;
  dispensers: DispenserRow[];
}

// IdentHandlerContext is used when the context requires an 'ident' parameter
export interface IdentHandlerContext {
  params: {
    ident: string;
  };
}

export interface BlockHandlerContext {
  params: {
    block_index: string;
  };
  url: URL;
}

export interface AddressTickHandlerContext {
  params: {
    address: string;
    tick: string | number;
  };
}

export interface AddressHandlerContext {
  params: {
    address: string;
  };
}

export interface TickHandlerContext {
  params: {
    tick: string;
    op?: string; // future use for mint/transfer deploy is defined in routes
  };
}

// Post Request Types ----------------------------------------------------------
export interface TX {
  psbtHex: string;
  fee: number;
  change: number;
}
export interface TXError {
  error: string;
}

export interface MintStampInputData {
  sourceWallet: string;
  assetName?: string;
  qty: number;
  locked: boolean;
  divisible: boolean;
  filename: string;
  file: string;
  satsPerKB: number;
  service_fee: number;
  service_fee_address: string;
}

export interface Collection {
  collection_id: string;
  collection_name: string;
  collection_description: string;
  creators: string[];
  creator_names?: string[]; // Human-readable creator names
  stamp_count: number;
  total_editions: number;
  first_stamp_image?: string | null;
  stamp_images?: string[] | null;
  img: string;
  // Market data fields
  marketData?: {
    minFloorPriceBTC: number | null;
    maxFloorPriceBTC: number | null;
    avgFloorPriceBTC: number | null;
    medianFloorPriceBTC: number | null;
    totalVolume24hBTC: number;
    stampsWithPricesCount: number;
    minHolderCount: number;
    maxHolderCount: number;
    avgHolderCount: number;
    medianHolderCount: number;
    totalUniqueHolders: number;
    avgDistributionScore: number;
    totalStampsCount: number;
    lastUpdated: Date | string;
  } | null;
}

export interface SRC20SnapshotRequestParams {
  tick: string;
  limit: number;
  page: number;
  amt: number;
  sortBy?: string;
}

export interface Config {
  MINTING_SERVICE_FEE_ENABLED: boolean;
  MINTING_SERVICE_FEE: string | null;
  MINTING_SERVICE_FEE_ADDRESS: string | null;
}

export interface WalletDataTypes {
  accounts: string[];
  address: string;
  publicKey: string;
  btcBalance: {
    confirmed: number;
    unconfirmed: number;
    total: number;
  };
  network: "mainnet" | "testnet"; // Adjust if needed
  provider: string;
}

declare global {
  interface GlobalThis {
    SKIP_REDIS_CONNECTION: boolean | undefined;
    DENO_BUILD_MODE: boolean | undefined;
    LeatherProvider: {
      request: (method: string, params?: any) => Promise<any>;
      // Add other known properties and methods of LeatherProvider here
    };
    mockTxData: {
      vout: Array<{
        scriptPubKey: {
          type: string;
          hex: string;
        };
      }>;
    };
    Buffer?: typeof import("node:buffer").Buffer;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    DENO_ENV?: "development" | "production" | "test";
    DEV_BASE_URL?: string;
    SKIP_REDIS_CONNECTION?: "true" | "false";
    // Add other environment variables here if needed
  }
}

// Add mockTxData to globalThis for testing purposes
// declare global {
//   // eslint-disable-next-line no-var
//   var mockTxData: {
//     vout: Array<{
//       scriptPubKey: {
//         type: string;
//         hex: string;
//       };
//     }>;
//   };
// }

export {};
