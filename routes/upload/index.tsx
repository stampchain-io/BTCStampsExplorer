/* ===== UPLOAD PAGE ===== */
/* @baba+@reinamora - what is this page used for, should it be improved? */
import { useEffect as _useEffect, useState as _useState } from "preact/hooks";
import { paginate } from "$lib/utils/paginationUtils.ts";
import {
  initialWallet as _initialWallet,
  walletContext,
} from "$client/wallet/wallet.ts";

import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { SRC20Row } from "$globals";
import { body } from "$layout";
import { titlePurpleLD } from "$text";
import { UploadImageTable } from "$table";

/* ===== SERVER HANDLER ===== */
export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
      const url = new URL(req.url);
      const { wallet: _wallet, isConnected: _isConnected } = walletContext;
      const limit = Number(url.searchParams.get("limit")) || 1000;
      const page = Number(url.searchParams.get("page")) || 1;

      const { data, total, lastBlock } = await Src20Controller.getUploadData({
        op: "DEPLOY",
        limit,
        page,
      });

      const pagination = paginate(total, page, limit);

      const body = {
        ...pagination,
        last_block: lastBlock,
        data: data.rows.map((row: any) => {
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

/* ===== TYPES ===== */
interface PropTypes {
  data: {
    data: SRC20Row[];
  };
}

/* ===== PAGE COMPONENT ===== */
export function UploadBackground(props: PropTypes) {
  const { data } = props.data;

  /* ===== RENDER ===== */
  return (
    <>
      <div className={body}>
        <h1 class={titlePurpleLD}>SRC20 STAMP UPLOAD</h1>

        <UploadImageTable data={data} />
      </div>
    </>
  );
}
export default UploadBackground;
