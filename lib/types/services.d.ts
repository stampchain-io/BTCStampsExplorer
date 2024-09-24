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
