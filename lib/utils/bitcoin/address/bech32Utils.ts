/**
 * Bech32 address encoding/decoding utilities
 * Based on https://en.bitcoin.it/wiki/Bech32 and BIP 173
 */

export class Bech32Utils {
  private static readonly CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  private static readonly GENERATOR = [
    0x3b6a57b2,
    0x26508e6d,
    0x1ea119fa,
    0x3d4233dd,
    0x2a1462b3,
  ];

  /**
   * Convert hex string to bech32 P2WSH address
   * @param hex - 64-character hex string (32 bytes)
   * @param network - "bitcoin" or "testnet"
   * @returns bech32 address or undefined if invalid
   */
  static hexToBech32(hex: string, network = "bitcoin"): string | undefined {
    if (hex.length !== 64) { // P2WSH only
      console.log("hex string must be 64 chars to generate p2wsh address");
      return;
    }

    const version = 0;
    let hrp = "";
    if (network === "bitcoin") {
      hrp = "bc";
    }
    if (network === "testnet") {
      hrp = "tb";
    }

    // Convert hex string to binary format
    let binaryString = hex.match(/.{1,2}/g)!.map((byte) =>
      parseInt(byte, 16).toString(2).padStart(8, "0")
    ).join("");
    binaryString += "0000"; // P2WSH needs padding

    // Split binary string into 5-bit chunks and convert to integer array
    const intArray = binaryString.match(/.{1,5}/g)!.map((chunk) =>
      parseInt(chunk, 2)
    );

    // Add the witness version byte in front
    intArray.unshift(version);

    // Calculate checksum
    const chk = this.calculateChecksum(hrp, intArray);

    // Append checksum
    intArray.push(...chk);

    // Map to bech32 charset
    let addr = hrp + "1";
    for (const element of intArray) {
      addr += this.CHARSET.charAt(element);
    }
    return addr;
  }

  /**
   * Convert bech32 address to hex string
   * @param address - bech32 address
   * @returns hex string or null if invalid
   */
  static bech32ToHex(address: string): string | null {
    let i_max = 0;
    if (address.length === 42) {
      i_max = 32;
    } else if (address.length === 62) {
      i_max = 51;
    }

    const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    address = address.toLowerCase();

    const data = [];
    for (let p = 4; p < address.length; ++p) {
      const d = CHARSET.indexOf(address.charAt(p));
      if (d === -1) {
        return null;
      }
      data.push(d);
    }

    const bin5 = [];
    for (let i = 0; i <= i_max; i++) {
      // Don't check bounds - let it throw like original
      bin5.push(data[i].toString(2).padStart(5, "0"));
    }

    let binString = "";
    for (const element of bin5) {
      binString += element;
    }

    const bin8 = binString.match(/.{8}/g)!; // Use non-null assertion to match original

    let hex = "";
    for (const element of bin8) {
      hex += parseInt(element, 2).toString(16).padStart(2, "0");
    }
    return hex;
  }

  /**
   * Calculate bech32 checksum
   * Based on https://github.com/sipa/bech32/blob/master/ref/javascript/bech32.js
   * Modified to assume BECH32 encoding (not BECH32M)
   */
  static calculateChecksum(hrp: string, data: number[]): number[] {
    const values = this.expandHrp(hrp).concat(data).concat([
      0,
      0,
      0,
      0,
      0,
      0,
    ]);
    const mod = this.polymod(values) ^ 1;
    const ret = [];
    for (let p = 0; p < 6; ++p) {
      ret.push((mod >> 5 * (5 - p)) & 31);
    }
    return ret;
  }

  /**
   * Polynomial modulus calculation for bech32
   */
  static polymod(values: number[]): number {
    let chk = 1;
    for (const element of values) {
      const top = chk >> 25;
      chk = (chk & 0x1ffffff) << 5 ^ element;
      for (let i = 0; i < 5; ++i) {
        if ((top >> i) & 1) {
          chk ^= this.GENERATOR[i];
        }
      }
    }
    return chk;
  }

  /**
   * Expand human readable part for bech32 checksum
   */
  static expandHrp(hrp: string): number[] {
    const ret = [];
    let p;
    for (p = 0; p < hrp.length; ++p) {
      ret.push(hrp.charCodeAt(p) >> 5);
    }
    ret.push(0);
    for (p = 0; p < hrp.length; ++p) {
      ret.push(hrp.charCodeAt(p) & 31);
    }
    return ret;
  }
}
