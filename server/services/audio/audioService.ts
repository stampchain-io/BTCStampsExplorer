import { dbManager } from "$server/database/databaseManager.ts";
import { logger } from "$lib/utils/logger.ts";

const AUDIO_TABLE = "audio_files";

interface AudioData {
  id: string;
  data: Uint8Array;
  size: number;
  stream(start?: number, end?: number): ReadableStream<Uint8Array>;
}

export class AudioService {
  static async getAudioFile(id: string): Promise<AudioData | null> {
    try {
      const query = `
        SELECT data, size
        FROM ${AUDIO_TABLE}
        WHERE id = ?
      `;

      const result = await dbManager.executeQueryWithCache(
        query,
        [id],
        1000 * 60 * 5, // Cache for 5 minutes
      );

      if (!result?.rows?.[0]) {
        return null;
      }

      const { data, size } = result.rows[0];
      const audioBuffer = new Uint8Array(data);

      return {
        id,
        data: audioBuffer,
        size,
        stream(start?: number, end?: number) {
          if (start !== undefined && end !== undefined) {
            const chunk = this.data.slice(start, end + 1);
            return new ReadableStream({
              start(controller) {
                controller.enqueue(chunk);
                controller.close();
              },
            });
          }
          return new ReadableStream({
            start(controller) {
              controller.enqueue(audioBuffer);
              controller.close();
            },
          });
        },
      };
    } catch (error) {
      logger.error("stamps", {
        message: "Error retrieving audio file",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        id,
      });
      return null;
    }
  }

  static async saveAudioFile(id: string, audioData: Uint8Array): Promise<boolean> {
    try {
      const query = `
        INSERT INTO ${AUDIO_TABLE} (id, data, size)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          data = VALUES(data),
          size = VALUES(size)
      `;

      const result = await dbManager.executeQuery(query, [
        id,
        audioData,
        audioData.length,
      ]);

      return (result as any).affectedRows > 0;
    } catch (error) {
      logger.error("stamps", {
        message: "Error saving audio file",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        id,
        dataSize: audioData.length,
      });
      return false;
    }
  }
} 