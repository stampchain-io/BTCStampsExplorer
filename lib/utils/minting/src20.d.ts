interface UTXO {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  value: number;
}

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
  recipient: string;
  tick: string;
  amount: string;
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
