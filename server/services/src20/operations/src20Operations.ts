import { SRC20Service } from "$server/services/src20/index.ts";
import type { IDeploySRC20, IMintSRC20, ITransferSRC20, IPrepareSRC20TX } from "$server/types/services/src20.d.ts";
import { SRC20MultisigPSBTService } from "$server/services/src20/psbt/src20MultisigPSBTService.ts";
import { logger } from "$lib/utils/logger.ts";

interface SRC20Operation {
  op: string;
  p: "SRC-20";
  tick: string;
  [key: string]: unknown;
}

// Create a union type for all SRC20 operation parameters
type SRC20OperationParams = IMintSRC20 | IDeploySRC20 | ITransferSRC20;

export class SRC20OperationService {
  private static async executeSRC20Operation<T extends SRC20OperationParams>(
    params: T,
    createOperationObject: (params: T) => SRC20Operation,
    additionalChecks: (params: T) => Promise<void>,
  ) {
    try {
      await additionalChecks(params);

      const operationObject = createOperationObject(params);
      const transferString = JSON.stringify(operationObject);

      const prepare: IPrepareSRC20TX = {
        ...params,
        transferString,
      };

      const result = await SRC20MultisigPSBTService.preparePSBT(prepare);
      
      return {
        hex: result.psbtHex,
        base64: result.psbtBase64,
        inputsToSign: result.inputsToSign,
        est_tx_size: result.estimatedTxSize || 0,
        est_miner_fee: result.fee,
        change_value: result.change,
      };
    } catch (error) {
      logger.error("src20-operation-service", {
        message: "Error in executeSRC20Operation",
        error: error instanceof Error ? error.message : String(error),
        params
      });
      return { error: error instanceof Error ? error.message : "Unknown error in SRC20 operation" };
    }
  }

  static mintSRC20(params: IMintSRC20) {
    return this.executeSRC20Operation(
      params,
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
      ({ tick, max, lim, dec, x, web, email, tg, description, desc }) => ({
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
        ...((description || desc) && { description: description || desc }),
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
