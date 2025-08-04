/* ===== WALLET DASHBOARD PAGE ===== */
/*@baba - FINETUNE PAGE */

import { WalletDashboardContent } from "$content";
import { Handlers } from "$fresh/server.ts";

import { WalletDashboardHeader } from "$header";
import WalletDashboardDetails from "$islands/content/WalletDashboardDetails.tsx";
import type { PaginatedResponse } from "$lib/types/pagination.d.ts";
import { getBTCBalanceInfo } from "$lib/utils/data/processing/balanceUtils.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { StampController } from "$server/controller/stampController.ts";
import type { SRC20Row } from "$types/src20.d.ts";
import type { StampRow } from "$types/stamp.d.ts";

import type { WalletPageProps } from "$types/ui.d.ts";
import type { WalletOverviewInfo } from "$types/wallet.d.ts";

/* ===== HELPERS ===== */
/**
 * We add stampsSortBy to the query to handle the ASC / DESC sorting on stamps.
 * This is optional; if not provided, default to "DESC".
 */

/** Utility function to extract query parameters with defaults */
const getPaginationParams = (url: URL, prefix: string, defaultLimit = 10) => ({
  page: Number(url.searchParams.get(`${prefix}_page`)) || 1,
  limit: Number(url.searchParams.get(`${prefix}_limit`)) || defaultLimit,
});

/* ===== SERVER HANDLER ===== */
export const handler: Handlers = {
  async GET(req, ctx) {
    /* ===== PARAMETER EXTRACTION ===== */
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
    const paginationParams = {
      stamps: getPaginationParams(url, "stamps", 32),
      src20: getPaginationParams(url, "src20"),
      dispensers: getPaginationParams(url, "dispensers"),
    };

    // Define individual params for consistent use throughout the code
    const stampsParams = paginationParams.stamps;
    const src20Params = paginationParams.src20;
    const dispensersParams = paginationParams.dispensers;

    const anchor = url.searchParams.get("anchor");

    /* ===== DATA FETCHING ===== */
    try {
      const [
        stampsResponse,
        src20Response,
        btcInfoResponse,
        dispensersResponse,
        stampsCreatedCount,
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
          includeMarketData: true, // 🚀 FIX: Use controller's built-in market data
          sortBy: src20SortBy,
        }),

        // BTC info
        getBTCBalanceInfo(address, {
          includeUSD: true,
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
      ]);

      /* ===== DATA PROCESSING ===== */
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
          data: src20Response.value.data, // Use the data directly from the response
        } as PaginatedResponse<SRC20Row>
        : { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };

      // Calculate total SRC20 value from enriched tokens
      const src20Value = src20Data.data.reduce(
        (
          total,
          token: import("$lib/types/src20.d.ts").SRC20WithOptionalMarketData,
        ) => {
          // For v2.3, market data is in token.market_data
          const marketData = token.market_data;
          if (marketData?.floor_price_btc && token.amt) {
            const quantity = typeof token.amt === "bigint"
              ? Number(token.amt)
              : Number(token.amt);
            const valueInBTC = marketData.floor_price_btc * quantity;
            return total + valueInBTC;
          }
          return total;
        },
        0,
      );

      const dispensersData = dispensersResponse.status === "fulfilled"
        ? {
          data: dispensersResponse.value.dispensers?.map((dispenser: any) => ({
            ...dispenser,
            dispenses: dispenser.dispenses || [], // Ensure dispenses field exists
          })) ?? [],
          total: dispensersResponse.value.total,
          page: dispensersParams.page,
          limit: dispensersParams.limit,
          totalPages: Math.ceil(
            dispensersResponse.value.total / dispensersParams.limit,
          ),
        } as PaginatedResponse<any>
        : { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };

      const btcInfo = btcInfoResponse.status === "fulfilled"
        ? btcInfoResponse.value
        : null;

      // Calculate dispenser counts from the full response
      const allDispensers = dispensersResponse.status === "fulfilled"
        ? dispensersResponse.value.dispensers ?? []
        : [];
      const openDispensers = allDispensers.filter((d) => d.give_remaining > 0);
      const closedDispensers = allDispensers.filter((d) =>
        d.give_remaining === 0
      );

      /* ===== WALLET DATA ASSEMBLY ===== */
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

      /* ===== RESPONSE RENDERING ===== */
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
      /* ===== ERROR HANDLING ===== */
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

/* ===== PAGE COMPONENT ===== */
export default function DashboardPage(props: WalletPageProps) {
  const {
    data,
    walletData,
    stampsTotal,
    src20Total,
    stampsCreated,
    stampsSortBy,
    src20SortBy,
  } = props;

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col gap-6" f-client-nav>
      <WalletDashboardHeader />
      <WalletDashboardDetails
        walletData={walletData as WalletOverviewInfo}
        stampsTotal={stampsTotal}
        src20Total={src20Total}
        stampsCreated={stampsCreated}
        setShowItem={() => {}} // Add missing required prop
      />
      <WalletDashboardContent
        stamps={data.stamps}
        src20={data.src20}
        dispensers={data.dispensers}
        address={walletData.address}
        anchor=""
        stampsSortBy={stampsSortBy || "DESC"}
        src20SortBy={src20SortBy || "DESC"}
      />
    </div>
  );
}
