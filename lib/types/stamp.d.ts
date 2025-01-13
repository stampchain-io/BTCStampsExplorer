export interface stampTransferData {
  sourceWallet: string;
  destinationWallet: string;
  assetName: string;
  qty: number;
  divisible: boolean;
  satsPerKB: number;
}

export interface stampMintData {
  sourceWallet: string;
  destinationWallet?: string;
  assetName?: string;
  base64Data: string;
  qty: number;
  locked: boolean;
  divisible: boolean;
  satsPerKB: number;
  file?: unknown;
}
