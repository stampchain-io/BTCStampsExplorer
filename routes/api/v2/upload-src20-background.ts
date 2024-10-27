import { Handlers } from "$fresh/server.ts";
import { saveFileToDatabase } from "$server/database/fileOperations.ts";
import { SRC20UtilityService } from "$server/services/src20/utilityService.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { fileData, tick } = body;

      if (!fileData || !tick) {
        return new Response("Missing required fields", { status: 400 });
      }

      // Remove the file mimetype prefix if present
      const base64Data = fileData.split(",").pop() || fileData;

      // Calculate tick_hash (assuming you have a function for this)
      const tickHash = SRC20UtilityService.calculateTickHash(tick);

      // Save the file to the database
      const saved = await saveFileToDatabase(tick, tickHash, base64Data);
      if (saved) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Failed to save file",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    } catch (error) {
      console.error("Error in upload-src20-background handler:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
