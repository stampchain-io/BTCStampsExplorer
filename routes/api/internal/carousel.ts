import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import { CAROUSEL_STAMP_IDS } from "$lib/utils/constants.ts";

export const handler: Handlers = {
  async GET(_req, _ctx) {
    try {
      const stamps = await StampController.getStamps({
        identifier: CAROUSEL_STAMP_IDS,
        allColumns: false,
        noPagination: true,
        cacheDuration: 1000 * 60 * 60,
      });

      return Response.json(stamps.data);
    } catch (_error) {
      return Response.json([], { status: 500 });
    }
  },
};
