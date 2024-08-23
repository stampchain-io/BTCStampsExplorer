import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { FreshContext } from "$fresh/server.ts";
import { AddressHandlerContext, PaginatedBalanceResponseBody } from "globals";
export const handler = async (
  req: Request,
  ctx: FreshContext<AddressHandlerContext>,
): Promise<Response> => {
  try {
    const { address } = ctx.params;
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 50;

    const result = await Src20Controller.handleWalletBalanceRequest(
      address,
      limit,
      page,
    );
    const resultData = await result.json();

    console.log("Debug: resultData", JSON.stringify(resultData, null, 2));

    const responseBody: PaginatedBalanceResponseBody = {
      page: resultData.pagination.page,
      limit: resultData.pagination.limit,
      totalPages: resultData.pagination.totalPages,
      total: resultData.pagination.totalItems,
      last_block: resultData.last_block,
      btc: resultData.btc,
      data: resultData.data,
    };

    console.log("Debug: responseBody", JSON.stringify(responseBody, null, 2));

    return new Response(JSON.stringify(responseBody), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in balance/[address] handler:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
