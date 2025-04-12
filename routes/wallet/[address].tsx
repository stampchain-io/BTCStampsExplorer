/* ===== WALLET PAGE ===== */
/*@baba-367*/
import { Handlers } from "$fresh/server.ts";
import { WalletPageProps } from "$types/index.d.ts";
import { StampController } from "$server/controller/stampController.ts";
import { Src101Controller } from "$server/controller/src101Controller.ts";
import { getBTCBalanceInfo } from "$lib/utils/balanceUtils.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { SRC20MarketService } from "$server/services/src20/marketService.ts";
import { enrichTokensWithMarketData } from "$server/services/src20Service.ts";
import {
  PaginatedResponse,
  PaginationQueryParams,
} from "$types/pagination.d.ts";
import { SRC20Row, StampRow } from "$globals";
import { DEFAULT_PAGINATION } from "$server/services/routeValidationService.ts";
import { WalletOverviewInfo } from "$types/wallet.d.ts";
import { WalletProfileHeader } from "$header";
import { WalletProfileContent } from "$content";
import WalletProfileDetails from "$islands/content/WalletProfileDetails.tsx";
import WalletDispenserDetails from "$islands/content/WalletDispenserDetails.tsx";

/* ===== SERVER HANDLER ===== */
/**
 * We add stampsSortBy to the query to handle the ASC / DESC sorting on stamps.
 * This is optional; if not provided, default to "DESC".
 */
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

    /* ===== DATA FETCHING ===== */
    try {
      const [
        stampsResponse,
        src20Response,
        btcInfoResponse,
        dispensersResponse,
        stampsCreatedCount,
        marketDataResponse,
        src101Response,
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

        // SRC101 Balance request
        await Src101Controller.handleSrc101BalanceRequest({
          address,
          limit: DEFAULT_PAGINATION.limit,
          page: DEFAULT_PAGINATION.page,
          sort: "ASC",
        }),
        fetch(
          `${url.origin}/api/v2/src101/balance/${address}?limit=100&offset=0`,
        ).then(async (res) => {
          if (!res.ok) {
            console.error("SRC101 fetch failed:", res.status, res.statusText);
            return null;
          }
          const data = await res.json();
          console.log("Raw SRC-101 Response:", data);

          // If we have pagination info and there's more data, fetch the rest
          if (data.pagination?.total > 100) {
            const remainingPages = Math.ceil(data.pagination.total / 100) - 1;
            const additionalRequests = Array.from(
              { length: remainingPages },
              (_, i) =>
                fetch(
                  `${url.origin}/api/v2/src101/balance/${address}?limit=100&offset=${
                    (i + 1) * 100
                  }`,
                )
                  .then((r) => r.json()),
            );

            const additionalData = await Promise.all(additionalRequests);
            // Combine all data
            data.data = [
              ...data.data,
              ...additionalData.flatMap((d) => d.data || []),
            ];
          }

          return data;
        }),
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
        ? dispensersResponse.value.dispensers
        : [];

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

      // Process SRC-101 response to get all BitNames
      const src101Data =
        src101Response.status === "fulfilled" && src101Response.value
          ? {
            names: (src101Response.value.data || [])
              .filter((item: any) => item?.tokenid_utf8)
              .map((item: any) => item.tokenid_utf8),
            total: src101Response.value.last_block || 0,
          }
          : { names: [], total: 0 };

      console.log("Final Processed SRC-101 Data:", src101Data);

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
          items: dispensersData,
        },
        src101: src101Data,
      };
      console.log("Final Wallet Data:", walletData);

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
            data: dispensersData,
            pagination: {
              page: dispensersParams.page,
              limit: dispensersParams.limit,
              total: dispensersData.length,
              totalPages: Math.ceil(
                dispensersData.length / dispensersParams.limit,
              ),
            },
          },
          src101: src101Response,
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
          src101: { names: [], total: 0 },
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

/* ===== HELPERS ===== */
// Helper function to determine if address should be treated as dispenser-only
function isDispenserOnlyAddress(data: WalletPageProps["data"]) {
  // Check if address has dispensers
  const hasDispensers = data.data.dispensers.data.length > 0;

  // Check if address has other assets
  const hasOtherStamps =
    data.data.stamps.data.length > (data.data.dispensers.data.length || 0);
  const hasSrc20Tokens = data.data.src20.data.length > 0;
  const hasCreatedStamps = data.stampsCreated > 0;

  // Only treat as dispenser if it ONLY has dispenser activity
  return hasDispensers && !hasOtherStamps && !hasSrc20Tokens &&
    !hasCreatedStamps;
}

/* ===== PAGE COMPONENT ===== */
export default function WalletPage(props: WalletPageProps) {
  const { data } = props;
  const isDispenserOnly = isDispenserOnlyAddress(data);

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col gap-6" f-client-nav>
      <WalletProfileHeader />
      {isDispenserOnly
        ? (
          <WalletDispenserDetails
            walletData={data.walletData as WalletOverviewInfo}
            stampsTotal={data.stampsTotal}
            src20Total={data.src20Total}
            stampsCreated={data.stampsCreated}
            setShowItem={() => {}}
          />
        )
        : (
          <>
            <WalletProfileDetails
              walletData={data.walletData as WalletOverviewInfo}
              stampsTotal={data.stampsTotal}
              src20Total={data.src20Total}
              stampsCreated={data.stampsCreated}
              setShowItem={() => {}}
            />
            <WalletProfileContent
              stamps={data.data.stamps}
              src20={data.data.src20}
              dispensers={data.data.dispensers}
              address={data.address}
              anchor={data.anchor}
              stampsSortBy={props.stampsSortBy ?? "DESC"}
              src20SortBy={props.src20SortBy ?? "DESC"}
            />
          </>
        )}
    </div>
  );
}
