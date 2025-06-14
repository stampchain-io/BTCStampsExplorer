/* ===== CONTENT IMAGE ROUTE ===== */
import { Handlers } from "$fresh/server.ts";
import { handleContentRequest } from "$routes/handlers/sharedContentHandler.ts";

/* ===== SERVER HANDLER ===== */
export const handler: Handlers = {
  GET(_req: Request, ctx) {
    return handleContentRequest(ctx.params.imgpath, ctx);
  },
};
