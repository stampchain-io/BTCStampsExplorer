import { BigFloat } from "bigfloat/mod.ts";

import {
  IDeploySRC20,
  IMintSRC20,
  ITransferSRC20,
} from "$lib/types/src20.d.ts";
import { isValidBitcoinAddress } from "./utils.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";

export async function checkMintedOut(tick: string, amount: string) {
  try {
    const result = await Src20Controller.handleCheckMintedOut(tick, amount);
    return result;
  } catch (error) {
    console.error(error);
    throw new Error("Error: Internal server error");
  }
}

export async function checkParams({
  operation, // "Mint" or "Deploy"
  toAddress,
  changeAddress,
  feeRate,
  tick,
  amt,
  max,
  lim,
  dec = 18,
}: {
  operation: "Mint" | "Deploy";
  toAddress: string;
  changeAddress: string;
  feeRate: number;
  tick: string;
  amt?: string;
  max?: number | string | undefined;
  lim?: number | string | undefined;
  dec?: number;
}) {
  // Common checks for both Mint and Deploy
  if (!toAddress || toAddress === "" || !isValidBitcoinAddress(toAddress)) {
    throw new Error("Error: toAddress not found");
  }
  if (
    !changeAddress || changeAddress === "" ||
    !isValidBitcoinAddress(changeAddress)
  ) {
    throw new Error("Error: changeAddress not found");
  }
  if (!feeRate) {
    throw new Error("Error: feeRate not found");
  }
  if (!tick || tick === "") {
    throw new Error("Error: tick not found");
  }

  // Operation-specific checks
  switch (operation) {
    case "Mint":
      if (!amt || amt === "" || new BigFloat(amt).lte(0)) {
        throw new Error("Error: amt not found or invalid");
      }
      break;
    case "Deploy":
      if (!max || max === "" || new BigFloat(max).lte(0)) {
        throw new Error("Error: max not found or invalid");
      }
      if (
        !lim || lim === "" || new BigFloat(lim).lte(0) ||
        new BigFloat(lim).gt(new BigFloat(max))
      ) {
        throw new Error("Error: lim not found or invalid");
      }
      if (!dec || dec === 0) {
        throw new Error("Error: dec not found or invalid");
      }
      try {
        const token_status = await Src20Controller.getTotalCountValidSrc20Tx({
          tick,
          op: "DEPLOY",
        });
        return { deployed: token_status !== 0 };
      } catch (error) {
        console.error(error);
        throw new Error("Error: Internal server error");
      }
    default:
      throw new Error("Error: Invalid operation type");
  }
}

export function checkMintParams({
  toAddress,
  changeAddress,
  feeRate,
  tick,
  amt,
}: IMintSRC20) {
  if (!toAddress || toAddress === "" || !isValidBitcoinAddress(toAddress)) {
    throw new Error("Error: toAddress not found");
  }
  if (
    !changeAddress || changeAddress === "" || !isValidBitcoinAddress(toAddress)
  ) {
    throw new Error("Error: changeAddress not found");
  }
  if (!feeRate) {
    throw new Error("Error: feeRate not found");
  }
  if (!tick || tick === "") {
    throw new Error("Error: tick not found");
  }
  const float_amt = new BigFloat(amt);
  if (!amt || amt === "" || float_amt.lte(0)) {
    throw new Error("Error: amt not found or invalid");
  }
}

export async function checkDeployedTick(
  tick: string,
) {
  try {
    const token_status = await Src20Controller.getTotalCountValidSrc20Tx({
      tick,
      op: "DEPLOY",
    });
    if (token_status === 0) {
      return {
        deployed: false,
      };
    }
    return {
      deployed: true,
    };
  } catch (error) {
    console.error(error);
    throw new Error("Error: Internal server error");
  }
}

export function checkDeployParams({
  toAddress,
  changeAddress,
  tick,
  feeRate,
  max,
  lim,
  dec = 18, // Default to 18 if not provided
  x,
  web,
  email,
}: IDeploySRC20) {
  if (!toAddress || toAddress === "" || !isValidBitcoinAddress(toAddress)) {
    throw new Error("Error: toAddress not found");
  }
  if (
    !changeAddress || changeAddress === "" || !isValidBitcoinAddress(toAddress)
  ) {
    throw new Error("Error: changeAddress not found");
  }
  if (!feeRate) {
    throw new Error("Error: feeRate not found");
  }
  if (!tick || tick === "") {
    throw new Error("Error: tick not found");
  }
  const float_max = new BigFloat(max);
  if (!max || max === "" || float_max.lte(0)) {
    throw new Error("Error: max not found or invalid");
  }
  const float_lim = new BigFloat(lim);
  if (!lim || lim === "" || float_lim.lte(0) || float_lim.gt(float_max)) {
    throw new Error("Error: lim not found or invalid");
  }
  if (dec < 0 || dec > 18) {
    throw new Error("dec value invalid");
  }

  // Optional validation for x (username)
  if (x && x !== "" && (x.length > 15 || !/^[a-zA-Z0-9_]+$/.test(x))) {
    throw new Error("Error: Invalid x username");
  }

  // Optional validation for web (website address)
  if (
    web && web !== "" &&
    !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(web)
  ) {
    throw new Error("Error: Invalid website address");
  }

  // Optional validation for email
  if (email && email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Error: Invalid email address");
  }

  // Check for dec
  if (dec === undefined || dec === null) {
    dec = 18; // Default to 18 if not provided
  } else {
    const decValue = Number(dec);
    if (
      isNaN(decValue) || decValue < 0 || decValue > 18 ||
      !Number.isInteger(decValue)
    ) {
      throw new Error("Error: dec must be an integer between 0 and 18");
    }
  }
}

export async function checkEnoughBalance(
  address: string,
  tick: string,
  amount: string,
) {
  try {
    const params = {
      address,
      tick,
      limit: 1,
      page: 1,
    };

    const balanceData = await Src20Controller.handleSrc20BalanceRequest(params);

    if (!balanceData || !balanceData.data) {
      console.error("No SRC-20 token balance found");
      throw new Error("No SRC-20 token balance found");
    }

    const balance = balanceData.data.amt;

    if (new BigFloat(amount).gt(balance)) {
      throw new Error("Error: Not enough SRC-20 token balance");
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export function checkTransferParams({
  toAddress,
  fromAddress,
  tick,
  feeRate,
  amt,
}: ITransferSRC20) {
  if (!toAddress || toAddress === "" || !isValidBitcoinAddress(toAddress)) {
    throw new Error("Error: toAddress not found");
  }
  if (
    !fromAddress || fromAddress === "" || !isValidBitcoinAddress(fromAddress)
  ) {
    throw new Error("Error: fromAddress not found");
  }
  if (!feeRate) {
    throw new Error("Error: feeRate not found");
  }
  if (!tick || tick === "") {
    throw new Error("Error: tick not found");
  }
  const float_amt = new BigFloat(amt);
  if (!amt || amt === "" || float_amt.lte(0)) {
    throw new Error("Error: amt not found or invalid");
  }
}

export function performChecks(operation: string, params: any) {
  switch (operation.toLowerCase()) {
    case "deploy":
      return checkDeployParams(params);
    case "mint":
      return checkMintParams(params);
    case "transfer":
      return checkTransferParams(params);
    default:
      throw new Error("Error: Invalid operation type");
  }
}
