import { UTXO } from "$lib/types/base.d.ts";

/**
 * Options for fetching UTXOs.
 */
export interface UTXOFetchOptions {
  /**
   * If true, attempts to include ancestor details (fees, vsize) for each UTXO.
   * This might involve additional API calls for some UTXO sources.
   */
  includeAncestorDetails?: boolean;
  /**
   * If true, only fetches confirmed UTXOs.
   */
  confirmedOnly?: boolean;
  // Potential future options:
  // minConfirmations?: number;
  // maxUtxosToFetch?: number;
}

/**
 * Interface for a common UTXO fetching service.
 * This service abstracts the underlying data sources (e.g., QuickNode, public APIs)
 * and provides a consistent way to retrieve UTXO information, normalized to the canonical UTXO type.
 */
export interface ICommonUTXOService {
  /**
   * Fetches spendable UTXOs for a given address.
   * The calling service is responsible for coin selection from the returned UTXOs.
   *
   * @param address The Bitcoin address to fetch UTXOs for.
   * @param amountNeeded Optional hint for the service; it may try to fetch UTXOs collectively covering this amount,
   *                     but the primary responsibility of coin selection remains with the caller.
   * @param options Options for fetching UTXOs.
   * @returns A promise that resolves to an array of UTXO objects.
   */
  getSpendableUTXOs(
    address: string,
    amountNeeded?: number,
    options?: UTXOFetchOptions,
  ): Promise<UTXO[]>;

  /**
   * Fetches a single specific UTXO by its transaction ID and output index.
   *
   * @param txid The transaction ID of the UTXO.
   * @param vout The output index (vout) of the UTXO.
   * @param options Options for fetching the UTXO.
   * @returns A promise that resolves to a UTXO object if found, or null otherwise.
   */
  getSpecificUTXO(
    txid: string,
    vout: number,
    options?: UTXOFetchOptions,
  ): Promise<UTXO | null>;

  /**
   * Fetches the raw hexadecimal representation of a transaction.
   *
   * @param txid The transaction ID.
   * @returns A promise that resolves to the raw transaction hex string if found, or null otherwise.
   */
  getRawTransactionHex(txid: string): Promise<string | null>;

  // Example of a potential future method:
  // getTransactionDetails(txid: string): Promise<TransactionDetails | null>;
} 