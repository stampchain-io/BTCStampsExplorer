/**
 * Utility class for generating/decoding CIP33 DATA
 * https://github.com/Jpja/Electrum-Counterparty/blob/master/js/xcp/cip33.js
 */
export class CIP33 {
  static readonly dust_limit = 330;

  static sat_to_btc(sat: number) {
    if (sat >= 1e5) return "err";

    return "0." + sat.toString().padStart(8, "0");
  }

  static unicode_to_hex(str: string) {
    return str.split("").map((c) =>
      c.charCodeAt(0).toString(16).padStart(2, "0")
    ).join("");
  }

  static unicode_to_base64(str: string) {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }),
    );
  }

  static hex_to_utf8(hex: string) {
    let str = "";
    for (let i = 0; i < hex.length; i += 2) {
      str += "%" + hex.substr(i, 2);
    }
    return decodeURIComponent(str);
  }

  static base64_to_hex(str: string) {
    return atob(str).split("")
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");
  }

  static hex_to_base64(str: string) {
    const hex = str.match(/.{1,2}/g)!.map((byte) =>
      String.fromCharCode(parseInt(byte, 16))
    ).join("");
    return btoa(hex);
  }

  static file_to_addresses(file_hex: string, network = "bitcoin"): string[] {
    let file_size: string | number = file_hex.length / 2;
    file_size = file_size.toString(16).padStart(4, "0");
    const hex = file_size + file_hex;

    //Break hex into 32 byte chunks (64 chars)
    const chunks = hex.match(/.{1,64}/g)!;
    const last = chunks.length - 1;
    chunks[last] = chunks[last].padEnd(64, "0");

    //Generate addresses from chunks
    const addresses = [];
    for (const element of chunks) {
      addresses.push(this.cip33_hex_to_bech32(element, network));
    }

    return addresses.filter((address): address is string =>
      address !== undefined
    );
  }

  static addresses_to_hex(addresses: string[]) {
    /*
     * input array of p2wsh address
     * output hex string containging
     */

    let recreated = "";
    for (const element of addresses) {
      recreated += this.cip33_bech32toHex(element);
    }
    let recr_size: string | number = recreated.substring(0, 4);
    recr_size = parseInt(recr_size, 16);
    const recr_file = recreated.substring(4, 4 + recr_size * 2);
    return recr_file;
  }

  static cip33_hex_to_bech32(hex: string, network = "bitcoin") {
    if (hex.length != 64) { //P2WSH only
      console.log("hex string must be 64 chars to generate p2wsh address");
      return;
    }

    const version = 0;
    let hrp = "";
    if (network == "bitcoin") {
      hrp = "bc";
    }
    if (network == "testnet") {
      hrp = "tb";
    }
    //remove version byte ('80') from hex string
    //hex = hex.substring(2);
    //the rest follows step 3 on https://en.bitcoin.it/wiki/Bech32
    // convert hex string to binary format
    let binaryString = hex.match(/.{1,2}/g)!.map((byte) =>
      parseInt(byte, 16).toString(2).padStart(8, "0")
    ).join("");
    binaryString += "0000"; //P2WSH failed needs padding

    //Split binary string into 5-bit chunks and convert to integer array
    const intArray = binaryString.match(/.{1,5}/g)!.map((chunk) =>
      parseInt(chunk, 2)
    );

    //Add the witness version byte in front
    intArray.unshift(version);

    //Calculate checksum
    const chk = this.cip33_bech32_checksum(hrp, intArray);

    //Append checksum
    intArray.push(...chk);

    //Map to bech32 charset
    const charset = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    let addr = hrp + "1";
    for (const element of intArray) {
      addr += charset.charAt(element);
    }
    return addr;
  }

  //Calculate bech32 checksum
  //Copied from https://github.com/sipa/bech32/blob/master/ref/javascript/bech32.js
  //Modified to assume BECH32 encoding (not BECH32M)
  static cip33_bech32_checksum(hrp: string, data: number[]) {
    const values = this.cip33_hrpExpand(hrp).concat(data).concat([
      0,
      0,
      0,
      0,
      0,
      0,
    ]);
    const mod = this.cip33_polymod(values) ^ 1;
    const ret = [];
    for (let p = 0; p < 6; ++p) {
      ret.push((mod >> 5 * (5 - p)) & 31);
    }
    return ret;
  }

  static cip33_polymod(values: number[]) {
    const GENERATOR = [
      0x3b6a57b2,
      0x26508e6d,
      0x1ea119fa,
      0x3d4233dd,
      0x2a1462b3,
    ];
    let chk = 1;
    for (const element of values) {
      const top = chk >> 25;
      chk = (chk & 0x1ffffff) << 5 ^ element;
      for (let i = 0; i < 5; ++i) {
        if ((top >> i) & 1) {
          chk ^= GENERATOR[i];
        }
      }
    }
    return chk;
  }

  static cip33_hrpExpand(hrp: string): number[] {
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

  static cip33_bech32toHex(address: string) { //https://en.bitcoin.it/wiki/Bech32
    let i_max = 0;
    if ((address.length) == 42) { //
      i_max = 32;
    } else if ((address.length) == 62) { //
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
      bin5.push(data[i].toString(2).padStart(5, "0"));
    }

    let binString = "";
    for (const element of bin5) {
      binString += element;
    }

    const bin8 = binString.match(/.{8}/g)!;

    let hex = "";
    for (const element of bin8) {
      hex += parseInt(element, 2).toString(16).padStart(2, "0");
    }
    return hex;
  }

  static cip33_hexToBase64(str: string) {
    let bString = "";
    for (let i = 0; i < str.length; i += 2) {
      bString += String.fromCharCode(parseInt(str.slice(i, i + 2), 16));
    }
    return btoa(bString);
  }
}

export default CIP33;
