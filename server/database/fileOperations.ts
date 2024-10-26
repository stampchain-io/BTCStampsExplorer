import { dbManager } from "../db.ts";

const SRC20_BACKGROUND_TABLE = "srcbackground";

export class FileOperations {
  static async saveFileToDatabase(
    tick: string,
    tickHash: string,
    base64Data: string,
  ): Promise<boolean> {
    try {
      const query = `
        INSERT INTO ${SRC20_BACKGROUND_TABLE} (tick, tick_hash, base64)
        VALUES (?, ?, ?)
        tick_hash = VALUES(tick_hash),
        base64 = VALUES(base64)
      `;

      const result = await dbManager.executeQuery(query, [
        tick,
        tickHash,
        base64Data,
      ]);

      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Error saving file to database:", error);
      return false;
    }
  }

  static async getFileFromDatabase(
    tick: string,
  ): Promise<{ tickHash: string; base64Data: string } | null> {
    try {
      const query = `
        SELECT tick_hash, base64
        FROM ${SRC20_BACKGROUND_TABLE}
        WHERE tick = ?
      `;

      const result = await dbManager.executeQueryWithCache(
        query,
        [tick],
        1000 * 60 * 5,
      ); // Cache for 5 minutes

      if ((result as any).rows.length > 0) {
        return {
          tickHash: (result as any).rows[0].tick_hash,
          base64Data: (result as any).rows[0].base64,
        };
      }

      return null;
    } catch (error) {
      console.error("Error retrieving file from database:", error);
      return null;
    }
  }
}

export const saveFileToDatabase = FileOperations.saveFileToDatabase;
export const getFileFromDatabase = FileOperations.getFileFromDatabase;
