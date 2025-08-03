/* ===== CONTENT IMAGE ROUTE ===== */
import { Handlers } from "$fresh/server.ts";
import { handleContentRequest } from "$routes/handlers/sharedContentHandler.ts";
import type { State } from "$types/ui.d.ts";

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<any, State> = {
  GET(_req: Request, ctx) {
    return handleContentRequest(ctx.params.imgpath, ctx);
  },
};
