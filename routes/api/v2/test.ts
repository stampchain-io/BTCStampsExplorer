import { conf } from "utils/config.ts";

export const handler = async (
  _req: Request,
  ctx,
): Promise<Response> => {
  console.log(conf);
  const img_from_env = Deno.env.get("IMAGES_SRC_PATH");
  const body = JSON.stringify({
    img_path: conf.IMAGES_SRC_PATH,
    fee: conf.MINTING_SERVICE_FEE_FIXED_SATS,
    img_from_env,
  });
  return new Response(body);
};
