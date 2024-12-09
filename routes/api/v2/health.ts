import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
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
  async GET() {
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
        XcpManager.checkHealth(),
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
      if (
        !Object.values({
          ...health.services,
          src20: src20Deployments.isValid,
          stamps: stampCount.isValid,
        }).every(Boolean)
      ) {
        health.status = "ERROR";
      }
    } catch (error) {
      console.error("Health check failed:", error);
      health.status = "ERROR";
    }

    return ResponseUtil.success(health, { forceNoCache: true });
  },
};
