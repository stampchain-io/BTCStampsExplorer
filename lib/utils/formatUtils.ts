import { BigFloat } from "bigfloat/mod.ts";
import { SATOSHIS_PER_BTC } from "$lib/utils/constants.ts";
import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

// Helper constant for satoshi conversion

export function abbreviateAddress(
  address?: string,
  sliceLength: number = 6,
): string {
  if (!address) return "";
  return `${address.slice(0, sliceLength)}...${address.slice(-sliceLength)}`;
}

export function formatBTCAmount(
  btc: number,
  options: {
    includeSymbol?: boolean;
    decimals?: number;
    stripZeros?: boolean;
  } = {},
): string {
  const {
    includeSymbol = true,
    decimals = 8,
    stripZeros = true,
  } = options;

  const formatted = btc.toFixed(decimals);
  const result = stripZeros ? stripTrailingZeros(formatted) : formatted;
  return includeSymbol ? `${result} BTC` : result;
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
  date: Date,
  options: DateFormatOptions = {},
): string {
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

  const formattedDate = date.toLocaleDateString(locale, formatOptions);

  // Add relative time if requested
  if (options.includeRelative) {
    return `${formattedDate} (${dayjs(date).fromNow()})`;
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
