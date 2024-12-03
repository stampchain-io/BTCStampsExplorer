import { Handlers } from "$fresh/server.ts";
import { handleContentRequest } from "$routes/handlers/sharedContentHandler.ts";

export const handler: Handlers = {
  GET(_req: Request, ctx) {
    const id = ctx.params.id.split("/").pop();
    if (!id) return ctx.renderNotFound();
    return handleContentRequest(id);
  },
};
