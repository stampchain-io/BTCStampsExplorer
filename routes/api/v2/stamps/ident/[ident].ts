import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import { PROTOCOL_IDENTIFIERS } from "$lib/utils/protocol.ts";
import { IdentHandlerContext, PaginatedIdResponseBody } from "globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import {
  checkEmptyResult,
  DEFAULT_PAGINATION,
  validateRequiredParams,
  validateSortParam,
} from "$server/services/routeValidationService.ts";
import { SUBPROTOCOLS } from "globals";

export const handler: Handlers<IdentHandlerContext> = {
  async GET(req, ctx) {
    const { ident } = ctx.params;

    // Validate required parameters
    const paramsValidation = validateRequiredParams({ ident });
    if (!paramsValidation.isValid) {
      return paramsValidation.error!;
    }

    // Validate protocol identifier
    if (!PROTOCOL_IDENTIFIERS.includes(ident.toUpperCase())) {
      return ResponseUtil.notFound(
        `Error: ident: ${ident} not found, use ${PROTOCOL_IDENTIFIERS}`,
      );
    }

    const url = new URL(req.url);
    const pagination = getPaginationParams(url);

    // Check if pagination validation failed
    if (pagination instanceof Response) {
      return pagination;
    }

    const { limit, page } = pagination;

    // Validate sort parameter
    const sortValidation = validateSortParam(url);
    if (!sortValidation.isValid) {
      return sortValidation.error!;
    }

    try {
      const result = await StampController.getStamps({
        page: page || DEFAULT_PAGINATION.page,
        limit: limit || DEFAULT_PAGINATION.limit,
        sortBy: sortValidation.data,
        type: "stamps",
        ident: [ident.toUpperCase() as SUBPROTOCOLS],
      });

      // Check for empty result
      const emptyCheck = checkEmptyResult(result, "stamp data");
      if (emptyCheck) {
        return emptyCheck;
      }

      const body: PaginatedIdResponseBody = {
        page: result.page || DEFAULT_PAGINATION.page,
        limit: result.limit || DEFAULT_PAGINATION.limit,
        totalPages: result.totalPages,
        total: result.total,
        last_block: result.last_block,
        ident: ident.toUpperCase(),
        data: result.data,
      };

      return ResponseUtil.success(body);
    } catch (error) {
      console.error(`Error in stamps/ident handler:`, error);
      return ResponseUtil.internalError(
        error,
        `Error: stamps with ident: ${ident} not found`,
      );
    }
  },
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};
