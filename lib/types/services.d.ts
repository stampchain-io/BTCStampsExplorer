export type DispenserFilter = "open" | "closed" | "all";

export interface Dispenser {
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
  confirmed: boolean;
  close_block_index: number | null;
  status: "open" | "closed" | "unknown";
  asset_info?: any;
  dispenser_info?: any;
  stamp?: StampRow | null;
}

export interface Dispense {
  tx_hash: string;
  block_index: number;
  cpid: string;
  source: string;
  destination: string;
  dispenser_tx_hash: string;
  dispense_quantity: number;
  confirmed: boolean;
  btc_amount: number | undefined;
  close_block_index: number | null;
  dispenser_details: any | null;
}

interface DispenseEvent {
  event_index: number;
  event: "DISPENSE";
  params: {
    asset: string;
    block_index: number;
    btc_amount: number;
    destination: string;
    dispense_index: number;
    dispense_quantity: number;
    dispenser_tx_hash: string;
    source: string;
    tx_hash: string;
    tx_index: number;
  };
  tx_hash: string;
  block_index: number;
  timestamp: string | null;
}

export interface Fairminter {
  tx_hash: string;
  tx_index: number;
  block_index: number;
  source: string;
  asset: string;
  asset_parent: string;
  asset_longname: string;
  description: string;
  price: number;
  quantity_by_price: number;
  hard_cap: number;
  burn_payment: boolean;
  max_mint_per_tx: number;
  premint_quantity: number;
  start_block: number;
  end_block: number;
  minted_asset_commission_int: number;
  soft_cap: number;
  soft_cap_deadline_block: number;
  lock_description: boolean;
  lock_quantity: boolean;
  divisible: boolean;
  pre_minted: boolean;
  status: string;
  paid_quantity: number | null;
  confirmed: boolean;
}

export interface XcpBalance {
  address: string | null;
  cpid: string;
  quantity: number;
  utxo: string;
  utxo_address: string;
  divisible: boolean;
}

export interface DispenserStats {
  open: number;
  closed: number;
  total: number;
  items: Dispenser[];
}

export interface WalletData {
  balance: number;
  usdValue: number;
  address: string;
  fee: number;
  btcPrice: number;
  dispensers: DispenserStats;
}
