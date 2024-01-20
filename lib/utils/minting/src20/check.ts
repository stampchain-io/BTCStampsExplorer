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
    if (new BigFloat(total_minted).add(new BigFloat(amount)).gt(max_supply)) {
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

export async function checkEnoughBalance(
  client: Client,
  address: string,
  tick: string,
  amount: string,
) {
  try {
    const balance_address_tick_data = await Src20Class
      .get_src20_balance_by_address_and_tick_with_client(
        client,
        address,
        tick,
      );
    const balance_address_tick = balance_address_tick_data.rows[0];
    if (balance_address_tick === null) {
      throw new Error("No balance found");
    }
    if (new BigFloat(amount).gt(balance_address_tick.amt)) {
      throw new Error("Error: Not enough balance");
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
