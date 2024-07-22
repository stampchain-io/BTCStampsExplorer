import { Handler, HandlerContext, Handlers, PageProps } from "$fresh/server.ts";
import { BlockService } from "$lib/services/blockService.ts";
import BlockInfo from "$components/BlockInfo.tsx";
import BlockHeader from "$islands/block/BlockHeader.tsx";
import BlockSelector from "$islands/block/BlockSelector.tsx";
import { useSignal } from "@preact/signals";
import { BlockInfoResponseBody, BlockRow } from "globals";

type BlockPageProps = {
  params: {
    id: string;
    block: BlockInfoResponseBody;
  };
};

export const handler: Handlers<BlockRow[]> = {
  async GET(_req: Request, ctx: HandlerContext) {
    let blockIdentifier: number | string;
    if (!ctx.params.id || isNaN(Number(ctx.params.id))) {
      const { last_block } = await BlockService.getLastBlock();
      blockIdentifier = last_block;
    } else {
      blockIdentifier = ctx.params.id;
    }

    try {
      const stampBlockResponse = await BlockService.getBlockInfo(
        blockIdentifier,
        "stamps",
      );
      const block = BlockService.transformToBlockInfoResponse(
        stampBlockResponse,
      );
      const related_blocks = await BlockService.getRelatedBlocks(
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
  return (
    <div class="flex flex-col gap-8">
      <BlockHeader />
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 py-2 overflow-y-auto">
        {blocks.map((block: BlockRow) => (
          <BlockSelector block={block} selected={selected} />
        ))}
      </div>
      <BlockInfo block={block} />
    </div>
  );
}

export default BlockPage;
