// General Types ---------------------------------------------------------------

type SUBPROTOCOLS = "STAMP" | "SRC-20" | "SRC-721";
import Big from "$Big";

interface BlockRow {
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
interface StampRow {
  stamp: number | null;
  block_index: number;
  cpid: string;
  creator: string;
  divisible: number;
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
}

export interface SRC20Row {
  tx_hash: string;
  block_index: number;
  p: string;
  op: string;
  tick: string;
  tick_hash: string;
  creator: string;
  creator_name: string;
  amt?: string | bigint;
  deci?: number;
  max?: string | bigint;
  lim?: string | bigint;
  destination: string;
  destination_name?: string;
  block_time: Date;
  status: string;
  row_num: number;
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

interface HolderRow {
  address: string;
  quantity: number;
  divisible: number;
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

interface DispenserRow {
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

interface BlockInfo {
  block_info: BlockRow;
  issuances: StampRow[];
  sends: SendRow[];
}

interface BtcInfo {
  address: string;
  balance: number;
  txCount: number;
  unconfirmedBalance: number;
  unconfirmedTxCount: number;
}

interface XCPParams {
  filters?: {
    field: string;
    op: string;
    value: string;
  }[];
  address?: string;
  asset?: string;
}

interface XCPBalance {
  cpid: string;
  quantity: number;
}

interface SRC20Balance {
  address: string;
  p: string;
  tick: string;
  amt: number;
  block_time: Date;
  last_update: number;
  deploy_tx: string;
  deploy_img: string;
}

interface Src20Detail {
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

interface Src20SnapShotDetail {
  tick: string;
  address: string;
  balance: Big;
}

interface StampBalance {
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
  tick?: string | null;
  op?: string | null;
  limit?: number;
  page?: number;
  sort?: string;
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
  sort?: string;
}

// Response Types --------------------------------------------------------------

export interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
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
}
export interface Src20SnapshotResponseBody extends Pagination {
  snapshot_block: number;
  data: Src20SnapShotDetail[];
}

export interface PaginatedBalanceResponseBody extends Pagination {
  last_block: number;
  btc: BtcInfo;
  data: StampsAndSrc20[];
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

type StampPageProps = {
  data: {
    stamps: StampRow[];
    total: number;
    page: number;
    pages: number;
    page_size: number;
    selectedTab: "all" | "classic" | "posh";
    sortBy: string;
    filterBy: string[];
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
  hex: string;
  fee: number;
  change: number;
}
export interface TXError {
  error: string;
}

export interface InputData {
  op: string;
  toAddress: string;
  changeAddress: string;
  fromAddress?: string;
  tick: string;
  feeRate: number;
  max?: number | string;
  lim?: number | string;
  dec?: number;
  amt?: number | string;
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

interface Collection {
  collection_id: string;
  collection_name: string;
  creators: string[];
  stamps: StampRow[];
}

interface CollectionQueryParams extends PaginationQueryParams {
  creator?: string;
}

interface PaginatedCollectionResponseBody extends Pagination {
  last_block: number;
  data: Collection[];
}

interface SRC20SnapshotRequestParams {
  tick: string;
  limit: number;
  page: number;
  amt: number;
  sort: string;
}

declare global {
  interface GlobalThis {
    SKIP_REDIS_CONNECTION: boolean | undefined;
  }
}

export {};
