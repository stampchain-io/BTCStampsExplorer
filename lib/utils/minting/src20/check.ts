import { BigFloat } from "bigfloat/mod.ts";
import { Client } from "$mysql/mod.ts";

import { Src20Class } from "$lib/database/index.ts";

export async function checkMintedOut(
  client: Client,
  tick: string,
  amount: string,
) {
  try {
    const mint_status = await Src20Class
      .get_src20_minting_progress_by_tick_with_client(
        client,
        tick,
      );
    if (!mint_status) {
      throw new Error("Tick not found");
    }
    const { max_supply, total_minted } = mint_status;
    if (BigFloat(total_minted).add(BigFloat(amount)).gt(max_supply)) {
      return { ...mint_status, minted_out: true };
    }
    return { ...mint_status, minted_out: false };
  } catch (error) {
    console.error(error);
    throw new Error("Error: Internal server error");
  }
}

export async function checkDeployedTick(
  client: Client,
  tick: string,
) {
  try {
    const token_status = await Src20Class
      .get_total_valid_src20_tx_by_tick_with_op_with_client(
        client,
        tick,
        "DEPLOY",
      );
    if (!token_status.rows[0]["total"]) {
      return {
        deployed: false,
      };
    }
    return {
      deployed: true,
    };
  } catch (error) {
    console.error(error);
    throw new Error("Error: Internal server error");
  }
}
