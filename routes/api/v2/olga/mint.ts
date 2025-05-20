import { FreshContext, Handlers } from "$fresh/server.ts";
// MintStampInputData import removed as RawRequestBody is now explicitly defined
import { serverConfig } from "$server/config/config.ts";
import {
  StampMintService,
  StampValidationService,
} from "$server/services/stamp/index.ts";
import { normalizeFeeRate, XcpManager } from "$server/services/xcpService.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import * as bitcoin from "bitcoinjs-lib"; // Keep for Psbt.fromHex
import { logger } from "$lib/utils/logger.ts"; // Import logger
import { SATOSHIS_PER_BTC } from "$lib/utils/constants.ts"; // For XCP decimal handling if values are not base units

// Define TransactionInput if not available globally or for clarity here
interface TransactionInput {
  txid: string;
  vout: number;
  signingIndex: number;
}

// Interface for the raw request body, allowing flexible types for parsing
interface RawRequestBody {
  sourceWallet?: string;
  assetName?: string;
  qty?: number | string;
  locked?: boolean;
  divisible?: boolean;
  filename?: string;
  file?: string;
  description?: string; // Now explicitly on RawRequestBody
  prefix?: "stamp" | "file" | "glyph"; // Now explicitly on RawRequestBody
  dryRun?: boolean;
  satsPerKB?: number | string;
  satsPerVB?: number | string;
  feeRate?: number | string;
  service_fee?: number | string;
  service_fee_address?: string;
  isPoshStamp?: boolean;
  // Include other fields from MintStampInputData if they can be in the body
}

// Type for the object passed to StampMintService.createStampIssuance
// This should match the parameters of that method precisely.
interface CreateStampIssuanceParams {
  sourceWallet: string;
  assetName: string;
  qty: number;
  locked: boolean;
  divisible: boolean;
  filename: string;
  file: string;
  satsPerKB: number;
  satsPerVB: number;
  description: string;
  prefix: "stamp" | "file" | "glyph";
  isDryRun?: boolean;
  service_fee: number;
  service_fee_address: string;
}

interface NormalizedMintResponse {
  hex: string;
  cpid: string;
  est_tx_size: number;
  input_value: number;
  total_dust_value: number;
  est_miner_fee: number;
  change_value: number;
  total_output_value: number;
  txDetails: TransactionInput[];
}

export const handler: Handlers<NormalizedMintResponse | { error: string }> = {
  async POST(req: Request, _ctx: FreshContext) {
    let body: RawRequestBody;
    try {
      body = await req.json();
    } catch (_error) {
      return ApiResponseUtil.badRequest("Invalid JSON format in request body");
    }

    // Validate essential fields that StampMintService will require
    if (
      !body.sourceWallet || !body.filename || !body.file ||
      body.qty === undefined || body.locked === undefined ||
      body.divisible === undefined
    ) {
      return ApiResponseUtil.badRequest(
        "Missing required fields: sourceWallet, filename, file, qty, locked, or divisible.",
      );
    }

    let normalizedFees;
    try {
      const feeInputArgs: { satsPerKB?: number; satsPerVB?: number } = {};
      if (body.satsPerKB !== undefined) {
        feeInputArgs.satsPerKB = typeof body.satsPerKB === "string"
          ? parseInt(body.satsPerKB, 10)
          : body.satsPerKB;
      }
      if (body.satsPerVB !== undefined) {
        feeInputArgs.satsPerVB = typeof body.satsPerVB === "string"
          ? parseInt(body.satsPerVB, 10)
          : body.satsPerVB;
      }

      if (
        body.feeRate !== undefined && feeInputArgs.satsPerKB === undefined &&
        feeInputArgs.satsPerVB === undefined
      ) {
        feeInputArgs.satsPerKB = typeof body.feeRate === "string"
          ? parseInt(body.feeRate, 10)
          : body.feeRate;
      }
      normalizedFees = normalizeFeeRate(feeInputArgs);
    } catch (error) {
      return ApiResponseUtil.badRequest(
        error instanceof Error ? error.message : "Invalid fee rate",
      );
    }

    const isDryRun = body.dryRun === true;
    let validatedAssetName;
    try {
      validatedAssetName = await StampValidationService
        .validateAndPrepareAssetName(body.assetName);
    } catch (error: unknown) {
      return ApiResponseUtil.badRequest(
        error instanceof Error
          ? error.message
          : "Invalid asset name (ensure it is a string)",
      );
    }

    // XCP Check for POSH stamps
    if (body.isPoshStamp && validatedAssetName && body.sourceWallet) {
      try {
        logger.info("api", {
          message: "Performing XCP balance check for POSH stamp",
          assetName: validatedAssetName,
          wallet: body.sourceWallet,
        });
        const balancesResult = await XcpManager.getXcpBalancesByAddress(
          body.sourceWallet,
          "XCP",
        ); // Fetch specific XCP balance

        const xcpAsset = balancesResult.balances.find((b) => b.cpid === "XCP");
        const xcpBalance = xcpAsset ? xcpAsset.quantity : 0;

        // Standard cost for issuing a named asset in Counterparty is 0.5 XCP.
        // XCP has 8 decimal places, so 0.5 XCP = 50,000,000 base units.
        const requiredXcpBaseUnits = 50000000;

        logger.debug("api", {
          message: "XCP Balance Check Details",
          assetName: validatedAssetName,
          wallet: body.sourceWallet,
          xcpBalanceBaseUnits: xcpBalance,
          requiredXcpBaseUnits,
          xcpAssetFound: !!xcpAsset,
        });

        if (xcpBalance < requiredXcpBaseUnits) {
          const xcpBalanceDecimal = xcpBalance / SATOSHIS_PER_BTC; // Display as decimal XCP
          const requiredXcpDecimal = requiredXcpBaseUnits / SATOSHIS_PER_BTC;
          return ApiResponseUtil.badRequest(
            `Insufficient XCP for POSH stamp issuance. Required: ${requiredXcpDecimal} XCP, Available: ${xcpBalanceDecimal} XCP.`,
          );
        }
        logger.info("api", {
          message: "XCP balance sufficient for POSH stamp",
          assetName: validatedAssetName,
        });
      } catch (xcpError) {
        logger.error("api", {
          message: "Error during XCP balance check",
          assetName: validatedAssetName,
          error: xcpError instanceof Error
            ? xcpError.message
            : String(xcpError),
          stack: xcpError instanceof Error ? xcpError.stack : undefined,
        });
        return ApiResponseUtil.internalError(
          "Error checking XCP balance for POSH stamp issuance.",
        );
      }
    }

    const serviceFeeNum = body.service_fee !== undefined
      ? (typeof body.service_fee === "string"
        ? parseInt(body.service_fee, 10)
        : body.service_fee)
      : parseInt(serverConfig.MINTING_SERVICE_FEE_FIXED_SATS, 10);

    const serviceFeeAddr = body.service_fee_address !== undefined
      ? body.service_fee_address
      : serverConfig.MINTING_SERVICE_FEE_ADDRESS || ""; // Provide ultimate fallback for string

    const createIssuanceParams: CreateStampIssuanceParams = {
      sourceWallet: body.sourceWallet,
      assetName: validatedAssetName || "",
      qty: typeof body.qty === "string" ? parseInt(body.qty, 10) : body.qty,
      locked: body.locked,
      divisible: body.divisible,
      filename: body.filename,
      file: body.file,
      satsPerKB: normalizedFees.normalizedSatsPerKB,
      satsPerVB: normalizedFees.normalizedSatsPerVB,
      description: body.description || "stamp:",
      prefix: body.prefix || "stamp",
      isDryRun: isDryRun,
      service_fee: serviceFeeNum,
      service_fee_address: serviceFeeAddr,
    };

    try {
      const mint_tx_details = await StampMintService.createStampIssuance(
        createIssuanceParams,
      );

      if (isDryRun) {
        return ApiResponseUtil.success({
          hex: "",
          cpid: validatedAssetName || "",
          est_tx_size: Number(mint_tx_details.est_tx_size),
          input_value: Number(mint_tx_details.input_value),
          total_dust_value: Number(mint_tx_details.total_dust_value),
          est_miner_fee: Number(mint_tx_details.est_miner_fee),
          change_value: Number(mint_tx_details.change_value),
          total_output_value: Number(mint_tx_details.total_output_value),
          txDetails: [],
        } as NormalizedMintResponse, { forceNoCache: true });
      }

      if (!mint_tx_details || !mint_tx_details.hex) {
        console.error(
          "Invalid mint_tx_details structure (missing hex for PSBT):",
          mint_tx_details,
        );
        return ApiResponseUtil.badRequest(
          "Error generating mint transaction: PSBT hex missing",
        );
      }

      const psbt = bitcoin.Psbt.fromHex(mint_tx_details.hex);
      const txDetails: TransactionInput[] = psbt.txInputs.map(
        (input, index) => {
          if (!input.hash) {
            throw new Error(`Input hash missing for input at index ${index}`);
          }
          const hashAsUint8Array = new Uint8Array(input.hash);
          const inputTxid = Array.from(hashAsUint8Array).reverse().map((b) =>
            (b as number).toString(16).padStart(2, "0")
          ).join("");
          return {
            txid: inputTxid,
            vout: input.index,
            signingIndex: index,
          };
        },
      );

      return ApiResponseUtil.success({
        hex: mint_tx_details.hex,
        cpid: validatedAssetName || "",
        est_tx_size: Number(mint_tx_details.est_tx_size),
        input_value: Number(mint_tx_details.input_value),
        total_dust_value: Number(mint_tx_details.total_dust_value),
        est_miner_fee: Number(mint_tx_details.est_miner_fee),
        change_value: Number(mint_tx_details.change_value),
        total_output_value: Number(mint_tx_details.total_output_value),
        txDetails: txDetails,
      } as NormalizedMintResponse, { forceNoCache: true });
    } catch (error: unknown) {
      console.error("Minting error in API route:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "An unexpected error occurred during minting";
      if (
        errorMessage.toLowerCase().includes("insufficient funds") ||
        errorMessage.includes("UTXO selection failed")
      ) {
        return ApiResponseUtil.badRequest(errorMessage);
      }
      return ApiResponseUtil.internalError(errorMessage);
    }
  },
};
