type INETWORK = "mainnet" | "testnet";

interface VOUT {
  address: string;
  value: number;
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
