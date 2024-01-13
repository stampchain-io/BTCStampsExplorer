import { connectDb, StampsClass } from "$lib/database/index.ts";

export const handler: Handlers<StampRow> = {
  async GET(req: Request, ctx: HandlerContext) {
    const { id } = ctx.params;
    const client = await connectDb();
    const file_name = await StampsClass
      .get_stamp_file_by_identifier_with_client(
        client,
        id as string,
      );
    client.close();
    if (!file_name) {
      return ctx.renderNotFound();
    }
    return new Response("", {
      status: 301,
      headers: { Location: `/content/${file_name}` },
    });
  },
};
