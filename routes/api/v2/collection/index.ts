import { CollectionController } from "$lib/controller/collectionController.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";

export const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const { limit, page } = getPaginationParams(url);
  const creator = url.searchParams.get("creator");

  try {
    const result = await CollectionController.getCollections({
      limit,
      page,
      creator: creator || undefined,
    });
    return ResponseUtil.success(result);
  } catch (error) {
    console.error("Error processing request:", error);
    return ResponseUtil.error(
      `Error: Internal server error. ${error.message || ""}`,
      500,
    );
  }
};
