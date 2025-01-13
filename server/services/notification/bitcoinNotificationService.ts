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
    await dbManager.invalidateCache('last_block');
    await dbManager.invalidateCache(`block_${data.blockHeight}`);
    await dbManager.invalidateCache('block_*');
  }

  private static async handlePriceUpdate(data: PriceNotification) {
    console.log(`Processing price update notification: $${data.price}`);
    await dbManager.invalidateCache('btc_price*');
  }
} 