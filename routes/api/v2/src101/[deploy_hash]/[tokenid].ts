import { Handlers } from "$fresh/server.ts";
import { Src101Controller } from "$server/controller/src101Controller.ts";
import { ResponseUtil } from "$lib/utils/api/responses/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/data/pagination/paginationUtils.ts";
import {
  checkEmptyResult,
  DEFAULT_PAGINATION,
  validateRequiredParams,
  validateSortParam,
} from "$server/services/validation/routeValidationService.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const { deploy_hash, tokenid } = ctx.params;

      // Validate required parameters
      const paramsValidation = validateRequiredParams({ deploy_hash, tokenid });
      if (!paramsValidation.isValid) {
        return paramsValidation.error!;
      }

      // Validate deploy_hash format (should be alphanumeric hash)
      if (!/^[a-fA-F0-9]+$/.test(deploy_hash) || deploy_hash.length < 8) {
        return ResponseUtil.badRequest(
          `Invalid deploy hash format: ${deploy_hash}. Must be a valid hexadecimal hash.`,
        );
      }

      // Validate tokenid format (should be numeric or alphanumeric)
      if (!/^[a-zA-Z0-9-]+$/.test(tokenid)) {
        return ResponseUtil.badRequest(
          `Invalid token ID format: ${tokenid}. Must be alphanumeric.`,
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

      const queryParams = {
        deploy_hash,
        tokenid,
        limit: limit || DEFAULT_PAGINATION.limit,
        page: page || DEFAULT_PAGINATION.page,
        ...(sortValidation.data && { sort: sortValidation.data }),
      };

      const result = await Src101Controller.handleSrc101OwnerRequest(
        queryParams,
      );

      // Check for empty result
      const emptyCheck = checkEmptyResult(result, "owner data");
      if (emptyCheck) {
        return emptyCheck;
      }

      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in [deploy_hash]/[tokenid] handler:", error);
      return ResponseUtil.internalError(
        error,
        "Error processing src101 tokenid request",
      );
    }
  },
};
