import { Handlers } from "$fresh/server.ts";

import WalletDashboardHeader from "$islands/Wallet/details/WalletDashboardHeader.tsx";
import WalletDashboardDetails from "$islands/Wallet/details/WalletDashboardDetails.tsx";
import WalletDashboardContent from "$islands/Wallet/details/WalletDashboardContent.tsx";
import { WalletOverviewInfo, WalletPageProps } from "$lib/types/index.d.ts";
import { StampController } from "$server/controller/stampController.ts";
import { getBTCBalanceInfo } from "$lib/utils/balanceUtils.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { SRC20MarketService } from "$server/services/src20/marketService.ts";
import { enrichTokensWithMarketData } from "$server/services/src20Service.ts";
import {
  PaginatedResponse,
  PaginationQueryParams,
} from "$lib/types/pagination.d.ts";
import { DispenserRow, SRC20Row, StampRow } from "$globals";

/**
 * We add stampsSortBy to the query to handle the ASC / DESC sorting on stamps.
 * This is optional; if not provided, default to "DESC".
 */
export const handler: Handlers = {
  async GET(req, ctx) {
    const { address } = ctx.params;
    const url = new URL(req.url);

    // Get sort parameters for each section
    const stampsSortBy =
      (url.searchParams.get("stampsSortBy")?.toUpperCase() || "DESC") as
        | "ASC"
        | "DESC";
    const src20SortBy =
      (url.searchParams.get("src20SortBy")?.toUpperCase() || "DESC") as
        | "ASC"
        | "DESC";
    const dispensersSortBy =
      (url.searchParams.get("dispensersSortBy")?.toUpperCase() || "DESC") as
        | "ASC"
        | "DESC";

    // Get pagination parameters for each section
    const stampsParams = {
      page: Number(url.searchParams.get("stamps_page")) || 1,
      limit: Number(url.searchParams.get("stamps_limit")) || 32,
    } as PaginationQueryParams;

    const src20Params = {
      page: Number(url.searchParams.get("src20_page")) || 1,
      limit: Number(url.searchParams.get("src20_limit")) || 10,
    } as PaginationQueryParams;

    const dispensersParams = {
      page: Number(url.searchParams.get("dispensers_page")) || 1,
      limit: Number(url.searchParams.get("dispensers_limit")) || 10,
    } as PaginationQueryParams;

    const anchor = url.searchParams.get("anchor");

    try {
      const [
        stampsResponse,
        src20Response,
        btcInfoResponse,
        dispensersResponse,
        stampsCreatedCount,
        marketDataResponse,
      ] = await Promise.allSettled([
        // Stamps with sorting and pagination
        StampController.getStampBalancesByAddress(
          address,
          stampsParams.limit || 10,
          stampsParams.page || 1,
          stampsSortBy,
        ),

        // SRC20 tokens with sorting and pagination
        Src20Controller.handleSrc20BalanceRequest({
          address,
          includePagination: true,
          limit: src20Params.limit || 10,
          page: src20Params.page || 1,
          includeMintData: true,
          sortBy: src20SortBy,
        }),

        // BTC info
        getBTCBalanceInfo(address, {
          includeUSD: true,
          apiBaseUrl: url.origin,
        }),

        // Dispensers with sorting and pagination
        StampController.getDispensersWithStampsByAddress(
          address,
          dispensersParams.page || 1,
          dispensersParams.limit || 10,
          {
            sortBy: dispensersSortBy,
          },
        ),

        StampController.getStampsCreatedCount(address),
        SRC20MarketService.fetchMarketListingSummary(),
      ]);

      // Process responses and handle errors
      const stampsData = stampsResponse.status === "fulfilled"
        ? {
          data: stampsResponse.value.data as unknown as StampRow[],
          total: (stampsResponse.value as any).total || 0,
          page: stampsParams.page,
          limit: stampsParams.limit,
          totalPages: Math.ceil(
            ((stampsResponse.value as any).total || 0) / stampsParams.limit,
          ),
        }
        : { data: [], total: 0, page: 1, limit: 32, totalPages: 0 };

      // Calculate stamp values
      const stampValues = stampsResponse.status === "fulfilled"
        ? await StampController.calculateWalletStampValues(
          stampsResponse.value.data,
        )
        : { stampValues: {}, totalValue: 0 };

      const src20Data = src20Response.status === "fulfilled"
        ? {
          ...src20Response.value,
          data: enrichTokensWithMarketData(
            src20Response.value.data,
            marketDataResponse.status === "fulfilled"
              ? marketDataResponse.value
              : [],
          ),
        } as PaginatedResponse<SRC20Row>
        : { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };

      // Calculate total SRC20 value from enriched tokens
      const src20Value = src20Data.data.reduce((total, token: any) => {
        // token.value is added by enrichTokensWithMarketData
        // it's floor_unit_price * amt
        return total + (token.value || 0);
      }, 0);

      const dispensersData = dispensersResponse.status === "fulfilled"
        ? {
          data: dispensersResponse.value.dispensers,
          total: dispensersResponse.value.total,
          page: dispensersParams.page,
          limit: dispensersParams.limit,
          totalPages: Math.ceil(
            dispensersResponse.value.total / dispensersParams.limit,
          ),
        } as PaginatedResponse<DispenserRow>
        : { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };

      const btcInfo = btcInfoResponse.status === "fulfilled"
        ? btcInfoResponse.value
        : null;

      // Calculate dispenser counts from the full response
      const allDispensers = dispensersResponse.status === "fulfilled"
        ? dispensersResponse.value.dispensers
        : [];
      const openDispensers = allDispensers.filter((d) => d.give_remaining > 0);
      const closedDispensers = allDispensers.filter((d) =>
        d.give_remaining === 0
      );

      // Build wallet data
      const walletData = {
        balance: btcInfo?.balance ?? 0,
        usdValue: (btcInfo?.balance ?? 0) * (btcInfo?.btcPrice ?? 0),
        address,
        btcPrice: btcInfo?.btcPrice ?? 0,
        fee: 0,
        txCount: btcInfo?.txCount ?? 0,
        unconfirmedBalance: btcInfo?.unconfirmedBalance ?? 0,
        unconfirmedTxCount: btcInfo?.unconfirmedTxCount ?? 0,
        stampValue: stampValues.totalValue,
        src20Value: src20Value,
        dispensers: {
          open: openDispensers.length,
          closed: closedDispensers.length,
          total: allDispensers.length,
          items: dispensersData.data,
        },
      };

      return ctx.render({
        data: {
          stamps: {
            data: stampsData.data,
            pagination: {
              page: stampsParams.page,
              limit: stampsParams.limit,
              total: stampsData.total,
              totalPages: Math.ceil(stampsData.total / stampsParams.limit),
            },
          },
          src20: {
            data: src20Data.data,
            pagination: {
              page: src20Params.page,
              limit: src20Params.limit,
              total: src20Data.total,
              totalPages: Math.ceil(src20Data.total / src20Params.limit),
            },
          },
          dispensers: {
            data: dispensersData.data,
            pagination: {
              page: dispensersParams.page,
              limit: dispensersParams.limit,
              total: dispensersData.total,
              totalPages: Math.ceil(
                dispensersData.total / dispensersParams.limit,
              ),
            },
          },
        },
        walletData,
        stampsTotal: stampsData.total,
        src20Total: src20Data.total,
        stampsCreated: stampsCreatedCount.status === "fulfilled"
          ? stampsCreatedCount.value
          : 0,
        anchor,
        stampsSortBy,
        src20SortBy,
        dispensersSortBy,
      });
    } catch (error) {
      console.error("Error:", error);
      // Return safe default state with empty data
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
          dispensers: {
            data: [],
            pagination: { page: 1, limit: 8, total: 0, totalPages: 0 },
          },
        },
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
        anchor: "",
        stampsSortBy: "DESC",
        src20SortBy: "DESC",
        dispensersSortBy: "DESC",
      });
    }
  },
};

export default function Dashboard(props: WalletPageProps) {
  const { data } = props;

  return (
    <div class="flex flex-col gap-3 mobileMd:gap-6" f-client-nav>
      <WalletDashboardHeader />
      <WalletDashboardDetails
        walletData={data.walletData as WalletOverviewInfo}
        stampsTotal={data.stampsTotal}
        src20Total={data.src20Total}
        stampsCreated={data.stampsCreated}
        setShowItem={() => {}}
      />
      <WalletDashboardContent
        stamps={data.data.stamps}
        src20={data.data.src20}
        dispensers={data.data.dispensers}
        address={data.walletData.address as string}
        anchor={data.anchor}
        stampsSortBy={props.stampsSortBy ?? "DESC"}
        src20SortBy={props.src20SortBy ?? "DESC"}
      />
    </div>
  );
}
