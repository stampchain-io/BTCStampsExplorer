import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { RouteType } from "$server/services/cacheService.ts";
import { validateRequiredParams } from "$server/services/routeValidationService.ts";

export async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");
    const utxoOnly = url.searchParams.get("utxoOnly") === "true";

    // Validate required parameters
    const paramsValidation = validateRequiredParams({ address });
    if (!paramsValidation.isValid) {
      return paramsValidation.error!;
    }

    const { balances: stampBalance } = await XcpManager.getXcpBalancesByAddress(
      address,
      undefined, // cpid
      utxoOnly,
      { type: "all" },
    );

    return ResponseUtil.success(
      { stampBalance },
      { routeType: RouteType.DYNAMIC },
    );
  } catch (error) {
    return ResponseUtil.internalError(error, "Error retrieving stamps balance");
  }
}
