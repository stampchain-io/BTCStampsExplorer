import { useSignal } from "@preact/signals";

import { BlockInfoResponseBody, BlockRow } from "globals";

import { FreshContext, Handlers } from "$fresh/server.ts";

import { BlockService } from "$lib/services/blockService.ts";
import BlockInfo from "$components/BlockInfo.tsx";
// import BlockHeader from "$islands/block/BlockHeader.tsx";
import BlockTransactions from "$islands/block/BlockTransactions.tsx";
// import BlockSelector from "$islands/block/BlockSelector.tsx";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

type BlockPageProps = {
  params: {
    id: string;
    block: BlockInfoResponseBody;
  };
};

export const handler: Handlers<BlockRow[]> = {
  async GET(_req: Request, ctx: FreshContext) {
    let blockIdentifier: number | string;
    if (!ctx.params.id || isNaN(Number(ctx.params.id))) {
      const { last_block } = await BlockService.getLastBlock();
      blockIdentifier = last_block;
    } else {
      blockIdentifier = ctx.params.id;
    }

    try {
      const stampBlockResponse = await BlockService.getBlockInfoWithStamps(
        blockIdentifier,
        "stamps",
      );
      const block = BlockService.transformToBlockInfoResponse(
        stampBlockResponse,
      );
      const related_blocks = await BlockService.getRelatedBlocksWithStamps(
        blockIdentifier,
      );

      return await ctx.render({
        block,
        related_blocks,
      });
    } catch (error) {
      console.error("Error fetching block info:", error);
      return new Response("Error fetching block info", { status: 500 });
    }
  },
};

export function BlockPage(props: BlockPageProps) {
  const { block, related_blocks } = props.data;
  const { block_info } = block;
  const { blocks, last_block } = related_blocks;
  const selected = useSignal<BlockRow>(
    blocks.find((b: BlockRow) => b.block_index === block_info.block_index),
  );
  const filterBy = [], sortBy = [];

  return (
    <div class="flex flex-col gap-8">
      {/* <BlockHeader /> */}
      <BlockTransactions />
      {
        /* <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 py-2 overflow-y-auto">
        {blocks.map((block: BlockRow) => (
          <BlockSelector block={block} selected={selected} />
        ))}
      </div> */
      }
      <div class="flex flex-col-reverse md:flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#2B0E49]">
            <img src="/img/icon_stamp_block.png" alt="" className="w-7 h-7" />
          </div>
          <div>
            <p className="text-white text-[26px]">Stamps Block Data</p>
            <p className="text-[#6E6E6E]">
              {new Date(block.block_info.block_time).toUTCString().replace(
                / GMT$/,
                " UTC",
              ).slice(0, -4)}
            </p>
          </div>
        </div>
        <div class="flex justify-between w-full md:w-auto gap-6">
          <StampNavigator initFilter={filterBy} initSort={sortBy} />
          <StampSearchClient />
        </div>
      </div>
      <BlockInfo block={block} />
    </div>
  );
}

export default BlockPage;
