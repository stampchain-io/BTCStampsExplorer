import { Handlers } from "$fresh/server.ts";
import { convertEmojiToTick, convertToEmoji } from "$lib/utils/emojiUtils.ts";
import { PaginatedTickResponseBody } from "$globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { BigFloat } from "bigfloat/mod.ts";
import {
  DEFAULT_PAGINATION,
  validateRequiredParams,
  validateSortParam,
} from "$server/services/routeValidationService.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const { tick } = ctx.params;

      // Validate required parameters
      const paramsValidation = validateRequiredParams({ tick });
      if (!paramsValidation.isValid) {
        return paramsValidation.error!;
      }

      const url = new URL(req.url);
      const pagination = getPaginationParams(url);

      // Check if pagination validation failed
      if (pagination instanceof Response) {
        return pagination;
      }

      const { limit, page } = pagination;
      const opParam = url.searchParams.get("op") || undefined;

      // Validate sort parameter
      const sortValidation = validateSortParam(url, "sortBy");
      if (!sortValidation.isValid) {
        return sortValidation.error!;
      }

      // Ensure required pagination values
      const params = {
        tick: convertEmojiToTick(String(tick)),
        limit: limit || DEFAULT_PAGINATION.limit,
        page: page || DEFAULT_PAGINATION.page,
        op: opParam,
        sortBy: sortValidation.data,
      };

      // Fetch data using controller
      const { src20_txs, total, lastBlock, mint_status } = await Src20Controller
        .getTickData(params);

      // Prepare pagination variables
      const totalPages = Math.ceil(total / (limit || DEFAULT_PAGINATION.limit));

      // Map data, ensuring all necessary fields are included
      const data = src20_txs.rows.map((tx: any) => ({
        ...tx,
        tick: convertToEmoji(tx.tick),
        max: tx.max ? new BigFloat(tx.max).toString() : null,
        lim: tx.lim ? new BigFloat(tx.lim).toString() : null,
        amt: tx.amt ? new BigFloat(tx.amt).toString() : null,
      }));

      // Construct response body
      const body: PaginatedTickResponseBody = {
        page: page || DEFAULT_PAGINATION.page,
        limit: limit || DEFAULT_PAGINATION.limit,
        total,
        totalPages,
        last_block: lastBlock,
        mint_status: mint_status
          ? {
            ...mint_status,
            max_supply: mint_status.max_supply?.toString() ?? null,
            total_minted: mint_status.total_minted?.toString() ?? null,
            limit: mint_status.limit ?? null,
          }
          : null,
        data,
      };

      return ResponseUtil.success(body);
    } catch (error) {
      console.error(error);
      return ResponseUtil.internalError(error, "Error processing request");
    }
  },
};
