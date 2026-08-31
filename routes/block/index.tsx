/* ===== BLOCK INDEX PAGE ROUTE ===== */

import { Handlers, PageProps } from "$fresh/server.ts";
import { BlockController } from "$server/controller/blockController.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import type { BlockRow } from "$types/base.d.ts";
import type { BlockInfoResponseBody } from "$types/api.d.ts";
import type { StampRow } from "$types/stamp.d.ts";

import { BlockSelector } from "$content";
import { BlockHeader } from "$header";
import BlockTransactions from "$islands/content/blockContent/BlockTransactions.tsx";
import { body, container2 } from "$layout";
import { subtitleNeutral, textLg } from "$text";
import { signal } from "@preact/signals";

/* ===== TYPES ===== */
interface BlockIndexData {
  currentBlock: BlockRow;
  relatedBlocks: BlockRow[];
  lastBlock: number;
  stamps: unknown[];
  src20: unknown[];
  error?: string;
}

function relatedBlockList(related: unknown): BlockRow[] {
  if (Array.isArray(related)) return related as BlockRow[];
  const blocks = (related as { blocks?: BlockRow[] } | null)?.blocks;
  return Array.isArray(blocks) ? blocks : [];
}

function stampRows(
  blockInfo: BlockInfoResponseBody & { data?: StampRow[] },
): StampRow[] {
  const rows = Array.isArray(blockInfo.data)
    ? blockInfo.data
    : blockInfo.issuances ?? [];
  return rows.filter((s) => s.ident !== "SRC-20");
}

async function src20Rows(blockIndex: number) {
  try {
    const result = await SRC20Service.QueryService.fetchBasicSrc20Data({
      block_index: blockIndex,
      limit: 500,
      page: 1,
      sortBy: "ASC",
    });
    const data = result.data;
    return Array.isArray(data) ? data : data ? [data] : [];
  } catch (error) {
    console.error("Error fetching SRC-20 for block:", error);
    return [];
  }
}

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<BlockIndexData> = {
  async GET(_req, ctx) {
    try {
      const lastBlock = await BlockController.getLastBlock();

      const [blockInfo, relatedBlocks, src20] = await Promise.all([
        BlockController.getBlockInfoResponse(lastBlock, "all"),
        BlockController.getRelatedBlocksWithStamps(lastBlock),
        src20Rows(lastBlock),
      ]);

      return ctx.render({
        currentBlock: blockInfo.block_info,
        relatedBlocks: relatedBlockList(relatedBlocks),
        lastBlock: lastBlock,
        stamps: stampRows(blockInfo),
        src20,
      });
    } catch (error) {
      console.error("Error in block index handler:", error);
      return ctx.render({
        currentBlock: {
          block_index: 0,
          block_hash: "",
          block_time: new Date(),
          issuances: 0,
          previous_block_hash: "",
          difficulty: 0,
          ledger_hash: "",
          txlist_hash: "",
          messages_hash: "",
          indexed: 1,
        } as BlockRow,
        relatedBlocks: [],
        lastBlock: 0,
        stamps: [],
        src20: [],
        error: "Failed to load current block data",
      });
    }
  },
};

/* ===== PAGE COMPONENT ===== */
export default function BlockIndexPage({ data }: PageProps<BlockIndexData>) {
  const selectedBlock = signal(data.currentBlock);

  return (
    <div class={body}>
      <BlockHeader />

      <div class="mb-">
        <h2 class={subtitleNeutral}>
          CURRENT BLOCK
          <span class="font-bold ml-3">{data.lastBlock.toLocaleString()}</span>
        </h2>
        <p class={textLg}>
          Latest block information and related transactions
        </p>
      </div>

      <div class={`flex flex-col ${container2} gap-5`}>
        <div>
          <BlockTransactions
            stamps={data.stamps as never}
            src20={data.src20 as never}
            blockDifficulty={data.currentBlock.difficulty}
          />
        </div>

        <div class={`flex flex-col ${container2} gap-5`}>
          <h3 class={subtitleNeutral}>RELATED BLOCKS</h3>
          {data.relatedBlocks.map((block) => (
            <BlockSelector
              key={block.block_index}
              block={block}
              selected={{
                value: selectedBlock.value?.block_index === block.block_index,
              }}
            />
          ))}
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
