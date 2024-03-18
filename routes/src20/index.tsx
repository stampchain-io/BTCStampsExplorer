import { HandlerContext } from "$fresh/server.ts";

import { CommonClass, connectDb, Src20Class } from "$lib/database/index.ts";
import { paginate } from "utils/util.ts";
import { SRC20DeployTable } from "$islands/src20/SRC20DeployTable.tsx";

//TODO: Add pagination

export const handler = {
  async GET(req: Request, ctx: HandlerContext) {
    try {
      const url = new URL(req.url);
      const limit = Number(url.searchParams.get("limit")) || 1000;
      const page = Number(url.searchParams.get("page")) || 1;

      const client = await connectDb();
      const data = await Src20Class.get_valid_src20_tx_by_op_with_client(
        client,
        "DEPLOY",
        limit,
        page,
      );
      const total = await Src20Class.get_total_valid_src20_tx_by_op_with_client(
        client,
        "DEPLOY",
      );
      const last_block = await CommonClass.get_last_block_with_client(client);
      await client.close();

      const pagination = paginate(total.rows[0]["total"], page, limit);

      const body = {
        ...pagination,
        last_block: last_block.rows[0]["last_block"],
        data: data.rows.map((row) => {
          return {
            ...row,
            max: row.max ? row.max.toString() : null,
            lim: row.lim ? row.lim.toString() : null,
            amt: row.amt ? row.amt.toString() : null,
          };
        }),
      };
      return await ctx.render(body);
    } catch (error) {
      console.error(error);
      const body = { error: `Error: Internal server error` };
      return ctx.render(body);
    }
  },
};

export function SRC20Page(props) {
  const { data, total, page, pages, limit } = props.data;
  return (
    <div>
      <SRC20DeployTable data={data} />
    </div>
  );
}
export default SRC20Page;
