import { BigFloat } from "bigfloat/mod.ts";
import { SATOSHIS_PER_BTC } from "$lib/utils/constants.ts";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

// Helper constant for satoshi conversion

export function abbreviateAddress(address: string, length = 4): string {
  if (!address) return "";
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function formatBTCAmount(
  btc: number,
  options: {
    includeSymbol?: boolean;
    decimals?: number;
    stripZeros?: boolean;
    excludeSuffix?: boolean;
  } = {},
): string {
  const {
    includeSymbol = true,
    decimals = 8,
    stripZeros = true,
    excludeSuffix = false,
  } = options;

  const formatted = btc.toFixed(decimals);
  const result = stripZeros ? stripTrailingZeros(formatted) : formatted;
  return includeSymbol && !excludeSuffix ? `${result} BTC` : result;
}

export function formatSatoshisToBTC(
  satoshis: number,
  options: {
    includeSymbol?: boolean;
    decimals?: number;
    stripZeros?: boolean;
  } = {},
): string {
  // Check if the number already appears to be in BTC (has decimal places)
  const isAlreadyBTC = satoshis.toString().includes(".");
  const btcValue = isAlreadyBTC ? satoshis : satoshis / SATOSHIS_PER_BTC;

  return formatBTCAmount(btcValue, options);
}

export function formatSatoshisToUSD(
  satoshis: number,
  btcPrice: number,
  options: {
    decimals?: number;
    includeSymbol?: boolean;
  } = {},
): string {
  const { decimals = 2, includeSymbol = false } = options;

  // Convert satoshis to BTC then to USD
  const btcValue = satoshis / SATOSHIS_PER_BTC;
  const usdValue = btcValue * btcPrice;

  // Format with specified decimal places
  const formatted = usdValue.toFixed(decimals);

  // Return with or without symbol
  return includeSymbol ? `$${formatted}` : formatted;
}

export function formatNumber(value: number, decimals: number = 8): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

interface DateFormatOptions {
  timeZone?: boolean;
  month?: "short" | "long" | "numeric" | "2-digit";
  year?: "numeric" | "2-digit";
  day?: "numeric" | "2-digit";
  includeRelative?: boolean;
}

export function formatDate(
  date: Date | string,
  options: { includeRelative?: boolean } = {},
): string {
  if (!date) return "INVALID DATE";

  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return "INVALID DATE";

  const locale = navigator.language || "en-US";
  const formatOptions: Intl.DateTimeFormatOptions = {};

  // Add timeZone if requested (default: true)
  if (options.timeZone !== false) {
    formatOptions.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  // Add other format options if provided
  if (options.month) formatOptions.month = options.month;
  if (options.year) formatOptions.year = options.year;
  if (options.day) formatOptions.day = options.day;

  const formattedDate = dateObj.toLocaleDateString(locale, formatOptions);

  // Add relative time if requested
  if (options.includeRelative) {
    return `${formattedDate} (${dayjs(dateObj).fromNow()})`;
  }

  return formattedDate;
}

export function stripTrailingZeros(num: number | string): string {
  const str = num.toString();
  const parts = str.split(".");
  if (parts.length === 1) {
    return str; // No decimal point, return as is
  }
  const integerPart = parts[0];
  const decimalPart = parts[1].replace(/0+$/, "");
  return decimalPart.length > 0 ? `${integerPart}.${decimalPart}` : integerPart;
}

export function bigFloatToString(
  value: BigFloat,
  precision: number = 3,
): string {
  const stringValue = value.toString();
  const [integerPart, fractionalPart] = stringValue.split(".");

  if (!fractionalPart) {
    return integerPart;
  }

  const roundedFractionalPart = fractionalPart.slice(0, precision);
  const result = `${integerPart}.${roundedFractionalPart}`;

  // Remove trailing zeros
  return result.replace(/\.?0+$/, "");
}

export function formatSupplyValue(
  supply: number | string | undefined,
  divisible: boolean,
): string {
  if (supply === undefined) return "0";

  if (typeof supply === "string") {
    supply = parseInt(supply);
  }
  return divisible ? (supply / 100000000).toFixed(2) : supply.toString();
}

export function isIntOr32ByteHex(value: string) {
  const isInt = Number.isInteger(value) ||
    (typeof value === "string" && Number.isInteger(Number(value)));

  const is32ByteHex = typeof value === "string" &&
    /^[0-9a-fA-F]{64}$/.test(value);

  return isInt || is32ByteHex;
}

export function categorizeInput(
  value: string | number,
): "number" | "hex_string" | "none" {
  if (
    (typeof value === "string" && /^\d+$/.test(value)) ||
    Number.isInteger(value)
  ) {
    return "number";
  }

  if (typeof value === "string" && /^[0-9a-fA-F]+$/.test(value)) {
    return "hex_string";
  }

  return "none";
}

export function formatBigInt(value: bigint): string {
  return value.toString();
}

export function bigIntSerializer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

export function jsonStringifyWithBigInt(obj: object): string {
  return JSON.stringify(obj, bigIntSerializer);
}

export function formatUSDValue(value: number): number {
  // Round to 2 decimal places and ensure it's a number
  return Number(value.toFixed(2));
}

/**
 * Formats a numeric string by removing leading zeros before the decimal
 * and trailing zeros after the decimal point
 * @param value The string value to format
 * @returns Formatted string without unnecessary zeros
 */
export function formatAmount(value: string): string {
  const [whole, decimal = ""] = value.replace(/^0+/, "").split(".");
  const trimmedDecimal = decimal.replace(/0+$/, "");
  return trimmedDecimal ? `${whole}.${trimmedDecimal}` : whole;
}

export function decodeBase64(base64String: string) {
  // Use atob to decode the base64 string to a binary string
  const binaryString = atob(base64String);

  // Convert the binary string to a Uint8Array
  const utf8Array = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    utf8Array[i] = binaryString.charCodeAt(i);
  }

  // Decode the Uint8Array back to a UTF-8 string
  const decodedText = new TextDecoder().decode(utf8Array);
  return decodedText;
}
