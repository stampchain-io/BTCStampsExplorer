import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { Handlers } from "$fresh/server.ts";

import WalletHeader from "$islands/Wallet/details/WalletHeader.tsx";
import WalletDetails from "$islands/Wallet/details/WalletDetails.tsx";
import WalletContent from "$islands/Wallet/details/WalletContent.tsx";
import { BTCAddressService } from "$server/services/btc/addressService.ts";
import { serverConfig } from "$server/config/config.ts";
import { fetchBTCPriceInUSD } from "$lib/utils/btc.ts";
import { Dispenser, WalletData } from "$types/index.d.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { StampRow } from "globals";
import { StampController } from "$server/controller/stampController.ts";

type WalletPageProps = {
  data: {
    data: {
      stamps: {
        data: StampRow[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
      src20: {
        data: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
      dispensers: Dispenser[];
    };
    address: string;
    walletData: WalletData;
    stampsTotal: number;
    src20Total: number;
  };
};

export const handler: Handlers = {
  async GET(req, ctx) {
    const { address } = ctx.params;
    const url = new URL(req.url);
    const stampsParams = getPaginationParams(url, "stamps");
    const src20Params = getPaginationParams(url, "src20");

    try {
      // Fetch all required data in parallel
      const [stampsResponse, src20Response, btcInfo, btcPrice, dispensersData] =
        await Promise
          .all([
            // Stamps data with pagination
            fetch(
              `${serverConfig.API_BASE_URL}/api/v2/stamps/balance/${address}?page=${stampsParams.page}&limit=${stampsParams.limit}`,
            ),
            // SRC20 data with pagination
            fetch(
              `${serverConfig.API_BASE_URL}/api/v2/src20/balance/${address}?page=${src20Params.page}&limit=${src20Params.limit}`,
            ),
            // BTC wallet info
            BTCAddressService.getAddressInfo(address),
            // BTC price
            fetchBTCPriceInUSD(serverConfig.API_BASE_URL),
            // Fetch dispensers
            // FIXME Need to add proper pagination to this
            StampController.getDispensersWithStampsByAddress(address, {
              limit: 1000,
            }),
          ]);

      const stampsData = await stampsResponse.json();
      const src20Data = await src20Response.json();
      const dispensers: Dispenser[] = dispensersData.dispensers;

      const walletData: WalletData = {
        balance: btcInfo?.balance ?? 0,
        usdValue: (btcInfo?.balance ?? 0) * btcPrice,
        address,
        fee: btcInfo?.fee_per_vbyte ?? 0,
        btcPrice: btcPrice,
        dispensers: {
          open: dispensersData.dispensers.filter((d) =>
            d.give_remaining > 0
          ).length,
          closed: dispensersData.dispensers.filter((d) =>
            d.give_remaining === 0
          ).length,
          total: dispensersData.total,
          items: dispensersData.dispensers,
        },
      };

      return ctx.render({
        data: {
          stamps: {
            data: stampsData.data,
            pagination: {
              page: stampsData.page,
              limit: stampsData.limit,
              total: stampsData.total,
              totalPages: stampsData.totalPages,
            },
          },
          src20: {
            data: src20Data.data,
            pagination: {
              page: src20Data.page,
              limit: src20Data.limit,
              total: src20Data.total,
              totalPages: src20Data.totalPages,
            },
          },
          dispensers,
        },
        address,
        walletData,
        stampsTotal: stampsData.total || 0,
        src20Total: src20Data.total || 0,
      });
    } catch (error) {
      console.error("Error:", error);
      // Return safe default state
      return ctx.render({
        data: {
          stamps: {
            data: [],
            pagination: { page: 1, limit: 8, total: 0, totalPages: 0 },
          },
          src20: {
            data: [],
            pagination: { page: 1, limit: 8, total: 0, totalPages: 0 },
          },
          dispensers: [],
        },
        address,
        walletData: {
          balance: 0,
          usdValue: 0,
          address,
          fee: 0,
          btcPrice: 0,
          dispensers: {
            open: 0,
            closed: 0,
            total: 0,
            items: [],
          },
        },
        stampsTotal: 0,
        src20Total: 0,
      });
    }
  },
};

export default function Wallet(props: WalletPageProps) {
  const { data } = props;

  return (
    <div class="flex flex-col gap-8">
      <WalletHeader
        filterBy={[]}
        sortBy="DESC"
      />
      <WalletDetails
        walletData={data.walletData}
        stampsTotal={data.stampsTotal}
        src20Total={data.src20Total}
        stampsCreated={0}
        setShowItem={() => {}}
      />
      <WalletContent
        stamps={data.data.stamps}
        src20={data.data.src20}
        dispensers={data.data.dispensers}
        address={data.address}
        showItem="stamp"
      />
    </div>
  );
}
