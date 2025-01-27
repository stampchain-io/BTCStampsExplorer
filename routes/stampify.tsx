import { Handlers, PageProps } from "$fresh/server.ts";
import StampifyPage from "$islands/stampify/StampifyPage.tsx";

interface StampifyPageData {
  balances: any[];
  error: string | undefined;
}

export const handler: Handlers<StampifyPageData> = {
  async GET(_req, ctx) {
    return ctx.render({
      balances: [],
      error: undefined,
    });
  },
};

export default function Stampify({ data }: PageProps<StampifyPageData>) {
  return <StampifyPage initialBalances={data.balances} error={data.error} />;
}
