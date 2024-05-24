import { fetch_quicknode } from "utils/quicknode.ts";

export async function handler(req: Request): Promise<Response> {
  const { name, params } = await req.json();
  console.log(name, params);
  const stampBalance = await fetch_quicknode(name, params);
  return new Response(JSON.stringify({ stampBalance }), {
    headers: { "Content-Type": "application/json" },
  });
}
