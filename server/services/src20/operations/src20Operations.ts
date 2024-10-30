import { SRC20Service } from "$server/services/src20/index.ts";
import type { IDeploySRC20, IMintSRC20, ITransferSRC20, IPrepareSRC20TX } from "$types/index.d.ts";

interface SRC20Operation {
  op: string;
  p: "SRC-20";
  tick: string;
  [key: string]: unknown;
}

export class SRC20OperationService {
  private static async executeSRC20Operation<T extends IPrepareSRC20TX>(
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

      const { psbtHex, inputsToSign } = await SRC20Service.PSBTService.preparePSBT(prepare);
      return { psbtHex, inputsToSign };
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  }

  static mintSRC20(params: IMintSRC20) {
    return this.executeSRC20Operation(
      params,
      SRC20Service.UtilityService.checkMintParams,
      ({ tick, amt }) => ({ op: "MINT", p: "SRC-20", tick, amt }),
      async ({ tick, amt }) => {
        const mintInfo = await SRC20Service.UtilityService.checkMintedOut(tick, amt);
        if (mintInfo.minted_out) {
          throw new Error(`Error: token ${tick} already minted out`);
        }
      },
    );
  }

  static deploySRC20(params: IDeploySRC20) {
    return this.executeSRC20Operation(
      params,
      SRC20Service.UtilityService.checkDeployParams,
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
        const mintInfo = await SRC20Service.UtilityService.checkDeployedTick(tick);
        if (mintInfo.deployed) {
          throw new Error(`Error: Token ${tick} already deployed`);
        }
      },
    );
  }

  static transferSRC20(params: ITransferSRC20) {
    return this.executeSRC20Operation(
      params,
      SRC20Service.UtilityService.checkTransferParams,
      ({ tick, amt }) => ({ op: "TRANSFER", p: "SRC-20", tick, amt }),
      async ({ fromAddress, tick, amt }) => {
        const hasEnoughBalance = await SRC20Service.UtilityService.checkEnoughBalance(fromAddress, tick, amt);
        if (!hasEnoughBalance) {
          throw new Error("Error: Not enough balance");
        }
      },
    );
  }
}
