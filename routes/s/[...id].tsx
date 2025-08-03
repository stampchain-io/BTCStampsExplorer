/* ===== STAMP CONTENT ROUTE ===== */
import { Handlers } from "$fresh/server.ts";
import { handleContentRequest } from "$routes/handlers/sharedContentHandler.ts";
import type { State } from "$types/ui.d.ts";

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<unknown, State> = {
  GET(_req: Request, ctx) {
    const id = ctx.params.id.split("/").pop();
    if (!id) return ctx.renderNotFound();
    return handleContentRequest(id, ctx);
  },
};
