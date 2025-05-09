/* ===== BLOCK INDEX PAGE ROUTE ===== */
import { Handlers, PageProps } from "$fresh/server.ts";
import { BlockController } from "$server/controller/blockController.ts";
import { BlockRow } from "$globals";
import { BlockHeader } from "$header";
import { BlockSelector, BlockTransactions } from "$content";
import { signal } from "@preact/signals";

/* ===== TYPES ===== */
interface BlockIndexData {
  currentBlock: BlockRow;
  relatedBlocks: BlockRow[];
  lastBlock: number;
  error?: string;
}

import { body } from "$layout";
import { subtitlePurple, textLg } from "$text";

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<BlockIndexData> = {
  async GET(_req, ctx) {
    try {
      /* ===== DATA FETCHING ===== */
      // Get the latest block number
      const lastBlock = await BlockController.getLastBlock();

      // Get current block info and related blocks
      const blockInfo = await BlockController.getBlockInfoResponse(
        lastBlock,
        "all",
      );
      const relatedBlocks = await BlockController.getRelatedBlocksWithStamps(
        lastBlock,
      );

      /* ===== RESPONSE ===== */
      return ctx.render({
        currentBlock: blockInfo.block_info,
        relatedBlocks: Array.isArray(relatedBlocks) ? relatedBlocks : [],
        lastBlock: lastBlock,
      });
    } catch (error) {
      /* ===== ERROR HANDLING ===== */
      console.error("Error in block index handler:", error);
      return ctx.render({
        currentBlock: {
          block_index: 0,
          block_hash: "",
          block_time: new Date().toISOString(),
          issuances: 0,
          // ... other required BlockRow properties
        } as BlockRow,
        relatedBlocks: [],
        lastBlock: 0,
        error: "Failed to load current block data",
      });
    }
  },
};

/* ===== PAGE COMPONENT ===== */
export default function BlockIndexPage({ data }: PageProps<BlockIndexData>) {
  /* ===== STATE ===== */
  const selectedBlock = signal(data.currentBlock);

  /* ===== RENDER ===== */
  return (
    <div class={body}>
      <BlockHeader />

      {/* ===== PAGE TITLE ===== */}
      <div class="mb-6">
        <h2 class={subtitlePurple}>
          CURRENT BLOCK
          <span class="font-bold ml-3">{data.lastBlock.toLocaleString()}</span>
        </h2>
        <p class={textLg}>
          Latest block information and related transactions
        </p>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-4">
          <h3 class={subtitlePurple}>RELATED BLOCKS</h3>
          {data.relatedBlocks.map((block) => (
            <BlockSelector
              key={block.block_index}
              block={block}
              selected={selectedBlock}
            />
          ))}
        </div>

        <div>
          <BlockTransactions />
        </div>
      </div>

      {data.error && (
        <div class="mt-4 p-4 bg-red-500 text-white rounded">
          {data.error}
        </div>
      )}
    </div>
  );
}
