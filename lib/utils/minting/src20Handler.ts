import { InputData, TX, TXError } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { deploySRC20, mintSRC20, transferSRC20 } from "./src20/index.ts";
import {
  IDeploySRC20,
  IMintSRC20,
  ITransferSRC20,
} from "$lib/types/index.d.ts";

type SRC20Operation = "deploy" | "mint" | "transfer";

export async function handleSRC20Operation(
  operation: SRC20Operation,
  body: InputData,
): Promise<TX | TXError> {
  let result;

  const commonParams = {
    network: "mainnet",
    changeAddress: body.changeAddress,
    toAddress: body.toAddress,
    feeRate: body.feeRate,
  };

  switch (operation) {
    case "deploy":
      result = await deploySRC20({
        ...commonParams,
        ...prepareDeploy(body),
      } as IDeploySRC20);
      break;
    case "mint":
      if (!body.amt) {
        return ResponseUtil.error(
          "Error: amt is required for mint operation",
          400,
        );
      }
      result = await mintSRC20({
        ...commonParams,
        ...prepareMint(body),
      } as IMintSRC20);
      break;
    case "transfer":
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
      result = await transferSRC20({
        ...commonParams,
        ...prepareTransfer(body),
      } as ITransferSRC20);
      break;
    default:
      return ResponseUtil.error("Invalid operation", 400);
  }

  if ("error" in result) {
    return ResponseUtil.error(result.error, 400);
  }

  console.log("psbtHex", result.psbtHex, "inputsToSign", result.inputsToSign);
  return ResponseUtil.success({
    hex: result.psbtHex,
    inputsToSign: result.inputsToSign,
  });
}

function prepareDeploy(body: InputData): IDeploySRC20 {
  return {
    toAddress: body.toAddress,
    changeAddress: body.changeAddress,
    tick: body.tick,
    feeRate: body.feeRate,
    max: body.max?.toString() ?? "",
    lim: body.lim?.toString() ?? "",
    dec: body.dec !== undefined ? Number(body.dec) : 18,
    x: body.x ?? "",
    web: body.web ?? "",
    email: body.email ?? "",
    tg: body.tg ?? "",
    description: body.description ?? "",
  };
}

function prepareMint(body: InputData): IMintSRC20 {
  return {
    toAddress: body.toAddress,
    changeAddress: body.changeAddress,
    tick: body.tick,
    feeRate: body.feeRate,
    amt: body.amt.toString(),
  };
}

function prepareTransfer(body: InputData): ITransferSRC20 {
  return {
    toAddress: body.toAddress,
    fromAddress: body.fromAddress,
    tick: body.tick,
    feeRate: body.feeRate,
    amt: body.amt.toString(),
  };
}
