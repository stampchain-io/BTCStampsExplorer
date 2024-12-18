import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { Handlers } from "$fresh/server.ts";

import WalletHeader from "$islands/Wallet/details/WalletHeader.tsx";
import WalletDetails from "$islands/Wallet/details/WalletDetails.tsx";
import WalletContent from "$islands/Wallet/details/WalletContent.tsx";
import { WalletData, WalletPageProps } from "$lib/types/index.d.ts";
import { StampController } from "$server/controller/stampController.ts";
import { getBTCBalanceInfo } from "$lib/utils/balanceUtils.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { SRC20MarketService } from "$server/services/src20/marketService.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const { address } = ctx.params;
    const url = new URL(req.url);
    const anchor = url.searchParams.get("anchor");
    const stampsParams = getPaginationParams(url, "stamps") as {
      page: number;
      limit: number;
    };
    const src20Params = getPaginationParams(url, "src20") as {
      page: number;
      limit: number;
    };
    const openListingsParams = getPaginationParams(url, "open_listings") as {
      page: number;
      limit: number;
    };
    const closedListingsParams = getPaginationParams(
      url,
      "closed_listings",
    ) as { page: number; limit: number };

    try {
      const [
        stampsResponse,
        src20Response,
        btcInfoResponse,
        openDispensersResponse,
        closedDispensersResponse,
        stampsCreatedCount,
        marketDataResponse,  // Add market data response
      ] = await Promise.allSettled([
        StampController.getStampBalancesByAddress(
          address,
          stampsParams.limit,
          stampsParams.page,
        ),
        Src20Controller.handleSrc20BalanceRequest({
          address,
          includePagination: true,
          limit: src20Params.limit,
          page: src20Params.page,
          includeMintData: true,
        }),
        getBTCBalanceInfo(address, {
          includeUSD: true,
          apiBaseUrl: url.origin,
        }),
        StampController.getDispensersWithStampsByAddress(
          address,
          openListingsParams.limit || 10,
          openListingsParams.page || 1,
          "open",
        ),
        StampController.getDispensersWithStampsByAddress(
          address,
          closedListingsParams.limit || 10,
          closedListingsParams.page || 1,
          "closed",
        ),
        StampController.getStampsCreatedCount(address),
        SRC20MarketService.fetchMarketListingSummary(),  // Add market data fetch
      ]);

      const marketData = marketDataResponse.status === "fulfilled"
        ? marketDataResponse.value
        : [];

      const stampsData = stampsResponse.status === "fulfilled"
        ? stampsResponse.value
        : { data: [], total: 0 };

      const src20Data = src20Response.status === "fulfilled"
        ? {
            ...src20Response.value,
            data: src20Response.value.data.map((token: any) => {
              const marketInfo = marketData.find(
                (item) => item.tick.toUpperCase() === token.tick.toUpperCase()
              ) || { floor_unit_price: 0 };
              return {
                ...token,
                floor_unit_price: marketInfo.floor_unit_price,
                value: marketInfo.floor_unit_price * Number(token.amt || 0)
              };
            })
          }
        : { data: [], total: 0 };

      const btcInfo = btcInfoResponse.status === "fulfilled"
        ? btcInfoResponse.value
        : null;

      const openDispensersData = openDispensersResponse.status === "fulfilled"
        ? openDispensersResponse.value
        : { dispensers: [], total: 0 };

      const closedDispensersData =
        closedDispensersResponse.status === "fulfilled"
          ? closedDispensersResponse.value
          : { dispensers: [], total: 0 };

      const walletData: WalletData = {
        balance: btcInfo?.balance ?? 0,
        usdValue: (btcInfo?.balance ?? 0) * (btcInfo?.btcPrice ?? 0),
        address,
        btcPrice: btcInfo?.btcPrice ?? 0,
        fee: 0,
        txCount: btcInfo?.txCount ?? 0,
        unconfirmedBalance: btcInfo?.unconfirmedBalance ?? 0,
        unconfirmedTxCount: btcInfo?.unconfirmedTxCount ?? 0,
        dispensers: {
          open: openDispensersData.dispensers.length,
          closed: closedDispensersData.dispensers.length,
          total: openDispensersData.total + closedDispensersData.total,
          items: [
            ...openDispensersData.dispensers,
            ...closedDispensersData.dispensers,
          ],
        },
      };

      const dispenserSection = {
        dispensers: [
          ...openDispensersData.dispensers,
          ...closedDispensersData.dispensers,
        ],
        openPagination: {
          page: openListingsParams.page || 1,
          limit: openListingsParams.limit || 10,
          total: openDispensersData.total,
          totalPages: Math.ceil(
            openDispensersData.total / (openListingsParams.limit || 10),
          ),
        },
        closedPagination: {
          page: closedListingsParams.page || 1,
          limit: closedListingsParams.limit || 10,
          total: closedDispensersData.total,
          totalPages: Math.ceil(
            closedDispensersData.total / (closedListingsParams.limit || 10),
          ),
        },
      };

      return ctx.render({
        data: {
          stamps: {
            data: stampsData.data,
            pagination: {
              page: stampsParams.page || 1,
              limit: stampsParams.limit || 10,
              total: stampsData.total,
              totalPages: Math.ceil(
                stampsData.total / (stampsParams.limit || 10),
              ),
            },
          },
          src20: {
            data: src20Data.data,
            pagination: {
              page: src20Params.page || 1,
              limit: src20Params.limit || 10,
              total: src20Data.total,
              totalPages: Math.ceil(
                src20Data.total / (src20Params.limit || 10),
              ),
            },
          },
          dispenser: dispenserSection,
        },
        address,
        walletData,
        stampsTotal: stampsData.total || 0,
        src20Total: src20Data.total || 0,
        stampsCreated: stampsCreatedCount.status === "fulfilled"
          ? stampsCreatedCount.value
          : 0,
        anchor: anchor,
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
          dispenser: {
            dispensers: [],
            pagination: { page: 1, limit: 8, total: 0, totalPages: 0 },
          },
        },
        address,
        walletData: {
          balance: 0,
          usdValue: 0,
          address,
          btcPrice: 0,
          fee: 0,
          txCount: 0,
          unconfirmedBalance: 0,
          unconfirmedTxCount: 0,
          dispensers: {
            open: 0,
            closed: 0,
            total: 0,
            items: [],
          },
        },
        stampsTotal: 0,
        src20Total: 0,
        stampsCreated: 0,
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
        stampsCreated={data.stampsCreated}
        setShowItem={() => {}}
      />
      <WalletContent
        stamps={data.data.stamps}
        src20={data.data.src20}
        dispenser={data.data.dispenser}
        address={data.address}
        showItem="stamp"
        anchor={data.anchor}
      />
    </div>
  );
}
