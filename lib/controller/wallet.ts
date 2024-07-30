import { Src20Class, StampRepository } from "$lib/database/index.ts";
import { getBtcAddressInfo } from "utils/btc.ts";
import { paginate } from "utils/util.ts";
import { SRC20Repository } from "$lib/database/src20Repository.ts";
import { StampService } from "$lib/services/stampService.ts";
import { dbManager } from "$lib/database/db.ts";

export const api_get_src20_valid_tx = async (tx_hash: string) => {
  try {
    const client = await dbManager.getClient();
    const tx_data = await Src20Class.get_valid_src20_tx_with_client( // FIXME: refactor
      client,
      null,
      null,
      null,
      undefined,
      undefined,
      "ASC",
      tx_hash,
    );
    dbManager.releaseClient(client);
    return tx_data.rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * @deprecated use controller functions
 * Retrieves the balance information for a given address.
 * @param address - The address for which to retrieve the balance.
 * @param limit - The maximum number of results to return per page. Default is 50.
 * @param page - The page number to retrieve. Default is 1.
 * @returns An object containing the balance information.
 */
export const api_get_balance = async (
  address: string,
  limit = 50,
  page = 1,
) => {
  try {
    const client = await dbManager.getClient();
    const total = (await StampRepository.getCountStampBalancesByAddressFromDb(
      address,
    ))
      .rows[0]["total"] || 0;
    const pagination = paginate(total, page, limit);

    const btcInfo = await getBtcAddressInfo(address); // frequently getting conn reset errors https://mempool.space/api/address/bc1qhy4t0j60sysrfmp6e5g0h67rthtvz4ktnggjpu): connection error: connection reset
    let stamps;
    if (total !== 0) {
      stamps = await StampService.getStampBalancesByAddress(
        address,
        limit,
        page,
      );
    } else {
      stamps = [];
    }
    const src20 = await SRC20Repository.getSrc20BalanceFromDb(
      client,
      { address, limit, page, sort: "ASC", tick: undefined, amt: undefined },
    );
    dbManager.releaseClient(client);
    return {
      ...pagination,
      btc: btcInfo,
      data: {
        stamps: Array.isArray(stamps) ? stamps : [stamps],
        src20: Array.isArray(src20) ? src20 : [src20],
      },
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};
