// General Types ---------------------------------------------------------------

export type SUBPROTOCOLS = "STAMP" | "SRC-20" | "SRC-721";
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

import Big from "$Big";

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
  is_btc_stamp: number;
  file_hash: string;
  floorPrice?: number | "priceless";
  marketCap?: number | "priceless";
  balance?: number | string;
  floorPriceUSD?: number | null;
  marketCapUSD?: number | null;
  recentSalePrice?: number | "priceless";
}

export interface DisplayCountBreakpoints {
  "mobileSm": number; // 360px+
  "mobileMd"?: number; // 568
  "mobileLg": number; // 768px+
  "tablet": number; // 1024px+
  "desktop": number; // 1440px+
}

export interface StampSectionProps {
  title?: string;
  subtitle?: string;
  type?: string;
  stamps: StampRow[];
  layout: "grid" | "row";
  isRecentSales?: boolean;
  filterBy?: STAMP_FILTER_TYPES | STAMP_FILTER_TYPES[];
  showDetails?: boolean;
  gridClass?: string;
  displayCounts?: DisplayCountBreakpoints;
  pagination?: Pagination;
  showMinDetails?: boolean;
  variant?: "default" | "grey";
  viewAllLink?: string;
}
export interface CollectionSectionProps {
  collections: Collection[];
  gridClass?: string;
  displayCounts?: DisplayCountBreakpoints;
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
  is_btc_stamp: number;
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
  is_btc_stamp: 0 | 1 | boolean | null;
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

interface SRC101Balance {
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
}

interface Src101Detail {
  tx_hash: string;
  block_index: number;
  p: string;
  op: string;
  tick: string | null;
  tick_hash: string | null;
  name: string | null;
  tokenid: string | null;
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

export interface PaginationQueryParams {
  limit?: number;
  page?: number;
}

export interface PaginatedRequest extends Request {
  query: PaginationQueryParams;
}

export interface SRC20TrxRequestParams {
  block_index?: number | null;
  tick?: string | string[] | null;
  op?: string | string[] | null;
  limit?: number;
  page?: number;
  sort?: string; // sort is only used on API requests
  sortBy?: string;
  tx_hash?: string | null;
  address?: string | null;
  noPagination?: boolean;
  singleResult?: boolean;
}

export interface SRC20BalanceRequestParams {
  address?: string;
  tick?: string;
  amt?: number;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortField?: string;
  includePagination?: boolean;
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
}

export interface SRC101OwnerParams {
  deploy_hash?: string;
  tokenid?: string;
  index?: number;
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
  pageSize: number;
  totalPages: number;
  total: number;
  prefix?: string;
}

export interface PaginatedStampResponseBody extends Pagination {
  last_block: number;
  data: StampRow[];
}

export interface PaginatedStampBalanceResponseBody extends Pagination {
  last_block: number;
  data: StampBalance[];
}

export interface PaginatedSrc20ResponseBody extends Pagination {
  last_block: number;
  data: Src20Detail[];
}

export interface PaginatedSrc101ResponseBody extends Pagination {
  last_block: number;
  data: Src101Detail[];
}

export interface TotalSrc101ResponseBody {
  last_block: number;
  data: number;
}

export interface TokenidSrc101ResponseBody extends Pagination {
  last_block: number;
  data: string;
}

export interface PaginatedTickResponseBody extends Pagination {
  last_block: number;
  mint_status: MintStatus;
  data: Src20Detail[];
}

export interface TickResponseBody extends Pagination {
  last_block: number;
  mint_status: MintStatus;
  data: Src20Detail;
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

export interface PaginatedSrc20BalanceResponseBody extends Pagination {
  last_block: number;
  data: SRC20Balance[] | [];
}

export interface Src20BalanceResponseBody {
  last_block: number;
  data: SRC20Balance;
  pagination?: Pagination;
}

export interface Src101BalanceResponseBody extends Pagination {
  last_block: number;
  data: SRC101Balance;
}

export interface Src101DeployDetailResponseBody {
  last_block: number;
  data: SRC101DeployDetail;
}

export interface Src20SnapshotResponseBody extends Pagination {
  snapshot_block: number;
  data: Src20SnapShotDetail[];
  pagination?: Pagination;
}

export interface PaginatedBalanceResponseBody extends Pagination {
  last_block: number;
  btc: BtcInfo;
  data: StampsAndSrc20;
}

export interface StampResponseBody {
  data: StampRow;
  last_block: number;
}

export interface StampsResponseBody {
  data: StampRow[];
  last_block: number;
}
export interface PaginatedIdResponseBody extends Pagination {
  ident: string | null;
  last_block: number;
  data: StampRow[];
}

export type StampPageProps = {
  data: {
    stamps: StampRow[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
    selectedTab: "all" | "classic" | "posh" | "recent_sales";
    sortBy: any;
    filterBy: string[];
  };
};

type MintPageProps = {
  data: {
    selectedTab: "mint" | "deploy" | "transfer";
  };
};

export interface ErrorResponseBody {
  error: string;
}

export type PaginatedResponseBody =
  | PaginatedStampResponseBody
  | ErrorResponseBody;

export interface BlockCountHandlerContext {
  params: { number: string };
}
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

export interface DispenserResponseBody {
  dispensers: DispenserRow[];
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
// Handler Contexts ------------------------------------------------------------

// IdHandlerContext is used when the context requires an 'id' parameter
export interface IdHandlerContext {
  params: {
    id: string;
  };
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
    tick: string | number;
    op?: string; // future use for mint/transfer deploy is defined in routes
  };
}

export interface BlockTickHandlerContext {
  params: {
    block_index: number | string;
    tick: string | number;
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
  creators: string;
  stamp_count: number;
  total_editions: number;
  first_stamp_image?: string | null;
  stamp_images?: string[] | null;
}

export interface CollectionQueryParams extends PaginationQueryParams {
  creator?: string;
}

export interface PaginatedCollectionResponseBody extends Pagination {
  last_block: number;
  data: Collection[];
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

declare global {
  interface GlobalThis {
    SKIP_REDIS_CONNECTION: boolean | undefined;
    LeatherProvider: {
      request: (method: string, params?: any) => Promise<any>;
      // Add other known properties and methods of LeatherProvider here
    };
  }
}
export {};

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface WalletStampSectionProps extends StampSectionProps {
  pagination?: Pagination;
  customHeader?: boolean;
  customGridClass?: string;
}
