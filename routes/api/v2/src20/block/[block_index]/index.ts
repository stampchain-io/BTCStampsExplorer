// routes/block/[block_index]/index.ts
import { handleSrc20TransactionsRequest } from "$lib/database/src20Transactions.ts";
import { FreshContext } from "$fresh/server.ts";

export const handler = (
  req: Request,
  ctx: FreshContext,
): Promise<Response> => {
  const { block_index } = ctx.params;
  const params = {
    block_index: parseInt(block_index, 10),
  };
  return handleSrc20TransactionsRequest(req, params);
};

// import { fetchAndFormatSrc20Transactions } from "$lib/database/src20Transactions.ts";
// import { ErrorResponseBody } from "globals";
// import { FreshContext } from "$fresh/server.ts";
// import { SRC20TrxRequestParams } from "globals";

// export const handler = async (
//   req: Request,
//   ctx: FreshContext,
// ): Promise<Response> => {
//   const { block_index } = ctx.params;
//   const url = new URL(req.url);

//   const params: SRC20TrxRequestParams = {
//     block_index: block_index ? parseInt(block_index, 10) : null,
//     op: url.searchParams.get("op"),
//     limit: Number(url.searchParams.get("limit")) || 1000,
//     page: Number(url.searchParams.get("page")) || 1,
//     sort: url.searchParams.get("sort") || "ASC",
//   };

//   try {
//     const responseBodyString = await fetchAndFormatSrc20Transactions(params);
//     return new Response(responseBodyString, {
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     console.error("Error processing request:", error);
//     const errorBody: ErrorResponseBody = {
//       error: `Error: Internal server error`,
//     };
//     return new Response(JSON.stringify(errorBody), { status: 500 });
//   }
// };
