import {
  checkDeployedTick,
  checkDeployParams,
  checkEnoughBalance,
  checkMintedOut,
  checkMintParams,
  checkTransferParams,
} from "utils/minting/src20/check.ts";
import { prepareSrc20TX } from "utils/minting/src20/tx.ts";
import {
  IDeploySRC20,
  IMintSRC20,
  IPrepareSRC20TX,
  ITransferSRC20,
} from "$lib/types/index.d.ts";

interface SRC20Operation {
  op: string;
  p: "SRC-20";
  tick: string;
  [key: string]: unknown;
}

async function executeSRC20Operation<T extends IPrepareSRC20TX>(
  params: T,
  checkParams: (params: T) => void,
  createOperationObject: (params: T) => SRC20Operation,
  additionalChecks: (params: T) => Promise<void>,
) {
  try {
    checkParams(params);
    await additionalChecks(params);

    const operationObject = createOperationObject(params);
    const transferString = JSON.stringify(operationObject);

    const prepare: IPrepareSRC20TX = {
      ...params,
      transferString,
    };

    const { psbtHex, inputsToSign } = await prepareSrc20TX(prepare);
    return { psbtHex, inputsToSign };
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}

export function mintSRC20(params: IMintSRC20) {
  return executeSRC20Operation(
    params,
    checkMintParams,
    ({ tick, amt }) => ({ op: "MINT", p: "SRC-20", tick, amt }),
    async ({ tick, amt }) => {
      const mintInfo = await checkMintedOut(tick, amt);
      if (mintInfo.minted_out) {
        throw new Error(`Error: token ${tick} already minted out`);
      }
    },
  );
}

export function deploySRC20(params: IDeploySRC20) {
  return executeSRC20Operation(
    params,
    checkDeployParams,
    ({ tick, max, lim, dec, x, web, email, tg, description }) => ({
      op: "DEPLOY",
      p: "SRC-20",
      tick,
      max,
      lim,
      ...(dec !== undefined && dec >= 0 && dec < 18 && { dec }),
      ...(x && { x }),
      ...(web && { web }),
      ...(email && { email }),
      ...(tg && { tg }),
      ...(description && { description }),
    }),
    async ({ tick }) => {
      const mintInfo = await checkDeployedTick(tick);
      if (mintInfo.deployed) {
        throw new Error(`Error: Token ${tick} already deployed`);
      }
    },
  );
}

export function transferSRC20(params: ITransferSRC20) {
  return executeSRC20Operation(
    params,
    checkTransferParams,
    ({ tick, amt }) => ({ op: "TRANSFER", p: "SRC-20", tick, amt }),
    async ({ fromAddress, tick, amt }) => {
      const hasEnoughBalance = await checkEnoughBalance(fromAddress, tick, amt);
      if (!hasEnoughBalance) {
        throw new Error("Error: Not enough balance");
      }
    },
  );
}
