import {
  deploySRC20,
  mintSRC20,
  transferSRC20,
} from "utils/minting/src20/index.ts";
import { Handlers } from "$fresh/server.ts";
import { InputData, TX, TXError } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { performChecks } from "utils/minting/src20/check.ts";

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request) {
    const body: InputData = await req.json();

    try {
      performChecks(body.op, body);
    } catch (error) {
      return ResponseUtil.error(error.message, 400);
    }

    switch (body.op.toLowerCase()) {
      case "deploy":
        return await handleDeploy(body);
      case "mint":
        return await handleMint(body);
      case "transfer":
        return await handleTransfer(body);
      default:
        return ResponseUtil.error("Invalid operation", 400);
    }
  },
};

async function handleDeploy(body: InputData) {
  const hex = await deploySRC20({
    toAddress: body.toAddress,
    changeAddress: body.changeAddress,
    tick: body.tick,
    feeRate: body.feeRate,
    max: body.max?.toString() ?? "", // Convert to string, use empty string if undefined
    lim: body.lim?.toString() ?? "", // Convert to string, use empty string if undefined
    dec: body.dec !== undefined ? Number(body.dec) : 18, // Convert to number, default to 18 if undefined
    x: body.x ?? "", // Use empty string if undefined
    web: body.web ?? "", // Use empty string if undefined
    email: body.email ?? "", // Use empty string if undefined
  });

  if (hex === null) {
    return ResponseUtil.error(
      `Error: Tick ${body.tick} already exists or error generating tx`,
      400,
    );
  }
  return ResponseUtil.success(hex);
}

async function handleMint(body: InputData) {
  if (!body.amt) {
    return ResponseUtil.error("Error: amt is required for mint operation", 400);
  }
  const hex = await mintSRC20({
    toAddress: body.toAddress,
    changeAddress: body.changeAddress,
    tick: body.tick,
    feeRate: body.feeRate,
    amt: body.amt.toString(),
  });
  return ResponseUtil.success(hex);
}

async function handleTransfer(body: InputData) {
  if (!body.fromAddress) {
    return ResponseUtil.error(
      "Error: fromAddress is required for transfer operation",
      400,
    );
  }
  if (!body.amt) {
    return ResponseUtil.error(
      "Error: amt is required for transfer operation",
      400,
    );
  }
  const hex = await transferSRC20({
    toAddress: body.toAddress,
    fromAddress: body.fromAddress,
    tick: body.tick,
    feeRate: body.feeRate,
    amt: body.amt.toString(),
  });
  return ResponseUtil.success(hex);
}
