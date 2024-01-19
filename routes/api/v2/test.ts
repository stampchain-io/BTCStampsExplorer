import { conf } from "../../../lib/utils/config.ts";

export const handler = async (
  _req: Request,
  ctx,
): Promise<Response> => {
  const body = JSON.stringify({
    img_path: conf.IMAGES_SRC_PATH,
    fee: conf.MINTING_SERVICE_FEE_FIXED_SATS,
  });
  return new Response(body);
};
