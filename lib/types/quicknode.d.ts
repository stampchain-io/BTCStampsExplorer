export interface GetPublicKeyFromAddress {
  (address: string): Promise<string>;
}

export interface GetRawTx {
  (txHash: string): Promise<any>;
}

export interface GetDecodedTx {
  (txHex: string): Promise<any>;
}

export interface GetTransaction {
  (txHash: string): Promise<any>;
}

export interface QuicknodeResult {
  result: any;
}

export interface FetchQuicknodeFunction {
  (
    method: string,
    params: unknown[],
    retries?: number,
  ): Promise<QuicknodeResult | null>;
}
