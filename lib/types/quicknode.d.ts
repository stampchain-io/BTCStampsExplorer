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

export interface QuickNodeConfig {
  endpoint: string;
  apiKey?: string;
  timeout?: number;
}

export interface QuickNodeError {
  code: number;
  message: string;
  details?: any;
}

export interface QuickNodeResponse<T = any> {
  result?: T;
  error?: QuickNodeError;
  id?: string | number;
}
