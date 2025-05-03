import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { BlockService } from "$server/services/blockService.ts";
import { getCurrentBlock } from "$lib/utils/mempool.ts";
import { StampService } from "$server/services/stampService.ts";
import { SRC20Repository } from "$server/database/src20Repository.ts";
import { XcpManager } from "$server/services/xcpService.ts";

interface HealthStatus {
  status: "OK" | "ERROR";
  services: {
    api: boolean;
    indexer: boolean;
    mempool: boolean;
    database: boolean;
    xcp: boolean;
    blockSync?: {
      indexed: number;
      network: number;
      isSynced: boolean;
    };
    stats?: {
      src20Deployments: number;
      totalStamps: number;
    };
  };
}

export const handler: Handlers = {
  /**
   * Simple health check for load balancer
   * Returns 200 without checking any services
   */
  async GET(_req, ctx) {
    // Extract path to check if this is a simple health check
    const url = new URL(ctx.url);
    if (url.searchParams.has('simple')) {
      return new Response(JSON.stringify({ status: "OK" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Continue with full health check if not simple
    const health: HealthStatus = {
      status: "OK",
      services: {
        api: true,
        indexer: false,
        mempool: false,
        database: false,
        xcp: false,
      },
    };

    try {
      const [
        lastIndexedBlock,
        currentBlockHeight,
        stampCount,
        src20Deployments,
        xcpHealth,
      ] = await Promise.all([
        BlockService.getLastBlock(),
        getCurrentBlock(),
        StampService.countTotalStamps(),
        SRC20Repository.checkSrc20Deployments(),
        XcpManager.checkHealth(30000), // 30 second cache for health checks
      ]);

      // Update service statuses
      health.services.indexer = !!lastIndexedBlock;
      health.services.mempool = !!currentBlockHeight;
      health.services.database = stampCount.isValid;
      health.services.xcp = xcpHealth;

      // Add block sync information
      if (lastIndexedBlock && currentBlockHeight) {
        health.services.blockSync = {
          indexed: lastIndexedBlock,
          network: currentBlockHeight,
          isSynced: lastIndexedBlock >= currentBlockHeight - 1,
        };
      }

      // Add stats information
      health.services.stats = {
        src20Deployments: src20Deployments.count,
        totalStamps: stampCount.count,
      };

      // Update overall status
      // Make the health check more resilient - only require database and API to be healthy
      // This is to fix ELB health check failures
      const essentialServices = {
        api: health.services.api,
        database: health.services.database,
      };
      
      // Non-essential services can be down without failing the health check
      const isError = !Object.values(essentialServices).every(Boolean);

      health.status = isError ? "ERROR" : "OK";
    } catch (error) {
      console.error("Health check failed:", error);
      health.status = "ERROR";
    }

    return ApiResponseUtil.success(health, { forceNoCache: true });
  },
};
