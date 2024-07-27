import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { FreshContext } from "$fresh/server.ts";
import { SRC20TrxRequestParams } from "globals";

export const handler = async (
  req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 11;
    const sortBy = url.searchParams.get("sortBy") || "ASC";

    const params: SRC20TrxRequestParams = {
      op: "DEPLOY",
      page,
      limit,
      sort: sortBy,
    };

    const result = await Src20Controller.handleSrc20TransactionsRequest(
      req,
      params,
    );
    const resultData = await result.json();

    const formattedData = {
      src20s: resultData.data || [],
      total: resultData.total || 0,
      page: resultData.page || page,
      totalPages: resultData.totalPages || 1,
      limit: resultData.limit || limit,
      last_block: resultData.last_block || 0,
      filterBy: [],
      sortBy: sortBy,
    };

    return new Response(JSON.stringify(formattedData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in src20/tick handler:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
