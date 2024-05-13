import { Handler, HandlerContext, Handlers, PageProps } from "$fresh/server.ts";
import {
  api_get_block,
  api_get_last_block,
  api_get_related_blocks,
} from "$lib/controller/block.ts";
import BlockInfo from "$components/BlockInfo.tsx";
import BlockHeader from "$islands/block/BlockHeader.tsx";
import BlockSelector from "$islands/block/BlockSelector.tsx";

import { useSignal } from "@preact/signals";

type BlockPageProps = {
  params: {
    id: string;
    block: BlockInfo;
  };
};

export const handler: Handlers<BlockRow[]> = {
  async GET(_req: Request, ctx: HandlerContext) {
    let block: BlockInfo;
    if (!ctx.params.id || isNaN(Number(ctx.params.id))) {
      const { last_block } = await api_get_last_block();
      ctx.params.id = last_block;
    }
    block = await api_get_block(Number(ctx.params.id));
    const related_blocks = await api_get_related_blocks(
      Number(ctx.params.id),
    );
    return await ctx.render({
      block,
      related_blocks,
    });
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
