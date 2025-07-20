import { dbManager } from "$server/database/databaseManager.ts";

interface BlockNotification {
  type: "new_block";
  blockHeight: number;
  blockHash: string;
  timestamp: number;
}

interface PriceNotification {
  type: "price_update";
  price: number;
  timestamp: number;
}

type BitcoinNotification = BlockNotification | PriceNotification;

export class BitcoinNotificationService {
  static async handleNotification(data: BitcoinNotification) {
    switch (data.type) {
      case "new_block":
        await this.handleNewBlock(data);
        break;
      case "price_update":
        await this.handlePriceUpdate(data);
        break;
      default:
        console.warn("Unknown notification type:", data);
    }
  }

  private static async handleNewBlock(data: BlockNotification) {
    console.log(`Processing new block notification: ${data.blockHeight}`);

    // Block-specific cache invalidation
    await dbManager.invalidateCacheByPattern('last_block');
    await dbManager.invalidateCacheByPattern(`block_${data.blockHeight}`);
    await dbManager.invalidateCacheByPattern('block_*');

    // Balance caches - these change with new transactions in blocks
    // OLD METHOD (INEFFECTIVE): Pattern-based invalidation doesn't work with SHA-256 hash keys
    // await dbManager.invalidateCacheByPattern('balance_*');
    // await dbManager.invalidateCacheByPattern('src20_balance_*');
    // await dbManager.invalidateCacheByPattern('src101_balance_*');
    // await dbManager.invalidateCacheByPattern('stamp_balance_*');

    // NEW METHOD (COMPREHENSIVE): Category-based invalidation using cache key registry
    // Clear all categories that might contain balance-related data
    await dbManager.invalidateCacheByCategory('balance');
    await dbManager.invalidateCacheByCategory('src20_balance');
    await dbManager.invalidateCacheByCategory('src101_balance');
    await dbManager.invalidateCacheByCategory('stamp_balance');

    // ADDITIONAL: Clear categories that balance queries might be miscategorized into
    await dbManager.invalidateCacheByCategory('stamp');      // Stamp balance queries
    await dbManager.invalidateCacheByCategory('market_data'); // Market data includes balance info
    await dbManager.invalidateCacheByCategory('block');      // Block queries might include balance data

    // Market data caches - prices/volumes may change with new blocks
    await dbManager.invalidateCacheByPattern('market_data_*');
    await dbManager.invalidateCacheByPattern('src20_market_*');

    // Transaction-related caches
    await dbManager.invalidateCacheByPattern('transaction_*');
    await dbManager.invalidateCacheByPattern('stamp_*');

    console.log(`Cache invalidated for new block ${data.blockHeight} (using comprehensive category-based invalidation)`);
  }

  private static async handlePriceUpdate(data: PriceNotification) {
    console.log(`Processing price update notification: $${data.price}`);
    await dbManager.invalidateCacheByPattern('btc_price*');
  }
}
