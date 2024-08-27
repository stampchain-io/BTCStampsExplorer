import { BigFloat } from "bigfloat/mod.ts";

import { Src20Class } from "$lib/database/index.ts";
import { IDeploySRC20, IMintSRC20, ITransferSRC20 } from "./src20.d.ts";
import { isValidBitcoinAddress } from "./utils.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";

export async function checkMintedOut(tick: string, amount: string) {
  try {
    const response = await Src20Controller.handleCheckMintedOut(tick, amount);
    const result = await response;
    if (response.ok) {
      return result;
    } else {
      throw new Error(result.error || "Error checking minted out status");
    }
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
  client, // Optional, only needed for Deploy check
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
  client?: Client;
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
      // Check if tick is already deployed
      if (client) {
        try {
          const token_status = await Src20Class
            .get_total_valid_src20_tx_with_client(tick, "DEPLOY");
          if (!token_status.rows[0]["total"]) {
            return { deployed: false };
          }
          return { deployed: true };
        } catch (error) {
          console.error(error);
          throw new Error("Error: Internal server error");
        }
      } else {
        throw new Error("Error: Client not provided for Deploy operation");
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
  client: Client,
  tick: string,
) {
  try {
    const token_status = await Src20Class
      .get_total_valid_src20_tx_with_client(
        tick,
        "DEPLOY",
      );
    if (!token_status.rows[0]["total"]) {
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
  dec = 18,
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
  if (!dec || dec === 0) {
    throw new Error("Error: dec not found or invalid");
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

    const response = await Src20Controller.handleSrc20BalanceRequest(params);
    const balanceData = await response.json();

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
