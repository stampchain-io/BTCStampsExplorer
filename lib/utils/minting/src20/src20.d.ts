import { Buffer } from "buffer";

type INETWORK = "mainnet" | "testnet";

interface VOUT {
  address?: string;
  value: number;
  script?: Buffer;
}

interface PSBTInput {
  hash: string;
  index: number;
  witnessUtxo?: {
    script: Buffer;
    value: number;
  };
  nonWitnessUtxo?: Buffer;
  redeemScript?: Buffer;
}

interface UTXO {
  txid: string;
  vout: number;
  value: number;
  address: string;
  script: string;
  size?: number;
}

interface SRC20Input {
  network: string;
  utxos: UTXO[];
  changeAddress: string;
  toAddress: string;
  feeRate: number;
  transferString: string;
  action: string;
  publicKey: string;
}

interface IMintSRC20 {
  toAddress: string;
  changeAddress: string;
  feeRate: number;
  tick: string;
  amt: string;
}

interface IDeploySRC20 {
  tick: string;
  max: number | string;
  lim: number | string;
  dec: number;
  toAddress: string;
  changeAddress: string;
  feeRate: number;
}

interface IPrepareSRC20TX {
  network: "mainnet" | "testnet";
  utxos: UTXO[];
  changeAddress: string;
  toAddress: string;
  feeRate: number;
  transferString: string;
  publicKey: string;
}

interface ITransferSRC20 {
  toAddress: string;
  fromAddress: string;
  tick: string;
  feeRate: number;
  amt: string;
}
