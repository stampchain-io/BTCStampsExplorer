const mimeTypes: { [key: string]: string } = {
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "png": "image/png",
  "gif": "image/gif",
  "svg": "image/svg+xml",
  "tif": "image/tiff",
  "jfif": "image/jpeg",
  "jpe": "image/jpeg",
  "pbm": "image/x-portable-bitmap",
  "pgm": "image/x-portable-graymap",
  "ppm": "image/x-portable-pixmap",
  "pnm": "image/x-portable-anymap",
  "apng": "image/apng",
  "bmp": "image/bmp",
  "webp": "image/webp",
  "heif": "image/heif",
  "heic": "image/heic",
  "avif": "image/avif",
  "ico": "image/x-icon",
  "tiff": "image/tiff",
  "svgz": "image/svg+xml",
  "wmf": "image/wmf",
  "emf": "image/emf",
  "pcx": "image/pcx",
  "djvu": "image/vnd.djvu",
  "djv": "image/vnd.djvu",
  "html": "text/html",
};

export const get_suffix_from_mimetype = (mimetype: string) => {
  const suffix = mimetype.split("/")[1];
  if (suffix === "svg+xml") return "svg";
  if (!suffix) return "json";
  return suffix;
};

export const short_address = (address: string, number = 6) => {
  return address.slice(0, number) + "..." + address.slice(-number);
};

export const getMimeType = (extension: string): string => {
  const normalizedExt = extension.toLowerCase();

  return mimeTypes[normalizedExt] || "application/octet-stream";
};

export const generateRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

export const getSupply = (supply: number, divisible: boolean) => {
  if (typeof supply === "bigint") {
    return divisible
      ? (supply / 100000000n).toString()
      : BigInt(supply).toString();
  } else if (typeof supply === "string") {
    supply = parseInt(supply);
  }
  return divisible ? (supply / 100000000).toFixed(2) : supply;
};


export function isIntOr32ByteHex(value: string) {
  // Check if the value is an integer or a numeric string that can be converted to an integer
  const isInt = Number.isInteger(value) || (typeof value === 'string' && Number.isInteger(Number(value)));

  // Check if the value is a string representing a 32-byte hex (64 characters)
  const is32ByteHex = typeof value === 'string' && /^[0-9a-fA-F]{64}$/.test(value);

  return isInt || is32ByteHex;
}

export function categorizeInput(value: string | number): "number" | "hex_string" | "none" {
  // Check if the value is a strictly numeric string or a number
  if ((typeof value === 'string' && /^\d+$/.test(value)) || Number.isInteger(value)) {
      return "number";
  }
  
  // Check if the value is a string representing a hexadecimal string
  if (typeof value === 'string' && /^[0-9a-fA-F]+$/.test(value)) {
      return "hex_string";
  }

  // If neither, return "none"
  return "none";
}


export function paginate(total: number, page = 1, limit = 10) {
  const totalPages = Math.ceil(total / limit);
  return {
      page,
      limit,
      totalPages,
      total
  };
}

export function jsonStrinifyBigInt(obj: any) {
  return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'bigint') {
          return value.toString();
      }
      return value;
  });
}