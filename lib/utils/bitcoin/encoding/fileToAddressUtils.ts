import { Bech32Utils } from "../address/bech32Utils.ts";

/**
 * Utilities for encoding files as Bitcoin addresses and decoding them back
 * Part of the CIP33 specification for Counterparty data embedding
 */
export class FileToAddressUtils {
  /**
   * Convert file hex data to array of P2WSH addresses
   * @param file_hex - Hex string of file data
   * @param network - "bitcoin" or "testnet"
   * @returns Array of P2WSH addresses
   */
  static fileToAddresses(file_hex: string, network = "bitcoin"): string[] {
    let file_size: string | number = file_hex.length / 2;
    file_size = file_size.toString(16).padStart(4, "0");
    const hex = file_size + file_hex;

    // Break hex into 32 byte chunks (64 chars)
    const chunks = hex.match(/.{1,64}/g)!;
    const last = chunks.length - 1;
    chunks[last] = chunks[last].padEnd(64, "0");

    // Generate addresses from chunks
    const addresses: (string | undefined)[] = [];
    for (const element of chunks) {
      addresses.push(Bech32Utils.hexToBech32(element, network));
    }

    return addresses.filter((address): address is string =>
      address !== undefined
    );
  }

  /**
   * Convert array of P2WSH addresses back to original file hex
   * @param addresses - Array of P2WSH addresses
   * @returns Original file hex string
   */
  static addressesToHex(addresses: string[]): string {
    let recreated = "";
    for (const element of addresses) {
      recreated += Bech32Utils.bech32ToHex(element);
    }
    let recr_size: string | number = recreated.substring(0, 4);
    recr_size = parseInt(recr_size, 16);
    const recr_file = recreated.substring(4, 4 + recr_size * 2);
    return recr_file;
  }
}
