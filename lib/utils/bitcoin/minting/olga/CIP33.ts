import { Bech32Utils } from "$lib/utils/bitcoin/address/bech32Utils.ts";
import { FileToAddressUtils } from "$lib/utils/bitcoin/encoding/fileToAddressUtils.ts";
import { base64ToHex, hexToBase64 } from "$lib/utils/data/binary/baseUtils.ts";

/**
 * Utility class for generating/decoding CIP33 DATA
 * https://github.com/Jpja/Electrum-Counterparty/blob/master/js/xcp/cip33.js
 *
 * COMPATIBILITY LAYER: This class maintains backward compatibility with legacy function names.
 * New code should use Bech32Utils and FileToAddressUtils directly.
 */
export class CIP33 {
  /**
   * @deprecated Use base64ToHex from baseUtils directly
   */
  static base64_to_hex(str: string) {
    return base64ToHex(str);
  }

  /**
   * @deprecated Use hexToBase64 from baseUtils directly
   */
  static hex_to_base64(str: string) {
    return hexToBase64(str);
  }

  /**
   * @deprecated Use FileToAddressUtils.fileToAddresses() instead
   */
  static file_to_addresses(file_hex: string, network = "bitcoin"): string[] {
    return FileToAddressUtils.fileToAddresses(file_hex, network);
  }

  /**
   * @deprecated Use FileToAddressUtils.addressesToHex() instead
   */
  static addresses_to_hex(addresses: string[]) {
    return FileToAddressUtils.addressesToHex(addresses);
  }

  /**
   * @deprecated Use Bech32Utils.hexToBech32() instead
   */
  static cip33_hex_to_bech32(hex: string, network = "bitcoin") {
    return Bech32Utils.hexToBech32(hex, network);
  }

  /**
   * @deprecated Use Bech32Utils.calculateChecksum() instead
   */
  static cip33_bech32_checksum(hrp: string, data: number[]) {
    return Bech32Utils.calculateChecksum(hrp, data);
  }

  /**
   * @deprecated Use Bech32Utils.polymod() instead
   */
  static cip33_polymod(values: number[]) {
    return Bech32Utils.polymod(values);
  }

  /**
   * @deprecated Use Bech32Utils.expandHrp() instead
   */
  static cip33_hrpExpand(hrp: string): number[] {
    return Bech32Utils.expandHrp(hrp);
  }

  /**
   * @deprecated Use Bech32Utils.bech32ToHex() instead
   * Note: This maintains the legacy return type (string | null) for compatibility
   */
  static cip33_bech32toHex(address: string) {
    return Bech32Utils.bech32ToHex(address);
  }
}

export default CIP33;
