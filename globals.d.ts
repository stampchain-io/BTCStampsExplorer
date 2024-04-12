import { HandlerContext } from "$fresh/server.ts";

// General Types ---------------------------------------------------------------

type SUBPROTOCOLS = "STAMP" | "SRC-20" | "SRC-721";

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
  timestamp: Date;
  tx_hash: string;
  tx_index: number;
  ident: SUBPROTOCOLS;
  creator_name: string | null;
  stamp_hash: string;
  is_btc_stamp: number;
  file_hash: string;
}

interface SendRow {
  source: string;
  destination: string;
  cpid: string | null;
  tick: string | null;
  memo: string;
  quantity: bigint;
  tx_hash: string;
  tx_index: number;
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

interface SRC20Balance {
  id: string;
  address: string;
  cpid: string;
  p: string;
  tick: string;
  amt: number;
  block_time: Date;
  last_update: number;
}

interface Src20Detail {
  tx_hash: string;
  tx_index: number;
  block_index: number;
  p: string;
  op: string;
  tick: string;
  creator: string;
  amt: number | null;
  deci: number;
  lim: string;
  max: string;
  destination: string;
  block_time: string;
  status: string | null;
  creator_name: string | null;
  destination_name: string;
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

export interface StampsAndSrc20 {
  stamps: StampRow[];
  src20: SRC20Balance[];
}

export interface Src20ResponseBody {
  last_block: number;
  data: Src20Detail;
}

export interface Src20BalanceResponseBody {
  last_block: number;
  data: Src20Detail[];
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

export interface ErrorResponseBody {
  error: string;
}

export type PaginatedResponseBody =
  | PaginatedStampResponseBody
  | ErrorResponseBody;

export interface BlockInfoResponseBody {
  block_info: BlockRow;
  issuances: StampRow[];
  sends: SendRow[];
  last_block: number;
}

export interface BlockRelatedResponseBody {
  blocks: BlockRow[];
  last_block: number;
}

export interface StampBlockResponseBody {
  block_info: BlockRow;
  data: StampRow[];
  last_block: number;
}

// Handler Contexts ------------------------------------------------------------

export interface IdHandlerContext extends HandlerContext {
  params: {
    id: string | number;
  };
}

export interface IdentHandlerContext extends HandlerContext {
  params: {
    ident: string;
  };
}

export interface BlockHandlerContext extends HandlerContext {
  params: {
    block_index: number | string;
  };
}

export interface AddressHandlerContext extends HandlerContext {
  params: {
    address: string;
  };
}

export interface TxHandlerContext extends HandlerContext {
  params: {
    tx_hash: string;
  };
}

export interface TickHandlerContext extends HandlerContext {
  params: {
    tick: string | number;
  };
}

export interface BlockTickHandlerContext extends HandlerContext {
  params: {
    block_index: number | string;
    tick: string | number;
  };
}

export interface AddressTickHandlerContext extends HandlerContext {
  params: {
    address: string;
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
