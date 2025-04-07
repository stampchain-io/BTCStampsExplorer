import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { FairmintContent } from "$islands/fairmint/FairmintContent.tsx";

interface FairmintPageProps {
  fairminters: any[];
}

export const handler: Handlers<FairmintPageProps> = {
  async GET(_req, ctx) {
    try {
      const fairminters = await XcpManager.getFairminters();
      return ctx.render({ fairminters });
    } catch (error) {
      console.error("Error fetching fairminters:", error);
      return ctx.render({ fairminters: [] });
    }
  },
};

export default function FairmintPage({ data }: PageProps<FairmintPageProps>) {
  return (
    <>
      <Head>
        <title>Fairmint Tokens</title>
      </Head>
      <div className="flex flex-col items-center gap-8">
        <h4 className="text-4xl tablet:text-5xl font-black purple-gradient bg-clip-text text-transparent">
          Fairmint Tokens
        </h4>
        <FairmintContent fairminters={data.fairminters} />
      </div>
    </>
  );
}
