// import BlockHeaderTable from "$/components/BlockHeaderTable.tsx";
import BlockStampsTable from "./BlockStampsTable.tsx";
// import BlockSendsTable from "$/components/BlockSendsTable.tsx";
import type { BlockInfo } from "globals";

interface BlockInfoProps {
  block: BlockInfo;
}

export default function BlockInfo(props: BlockInfoProps) {
  const { block } = props;

  return (
    <div class="sm:p-1 relative overflow-x-auto shadow-lg mobile-768:rounded-lg h-full flex flex-col justify-around gap-4">
      {/* <BlockHeaderTable block={block} /> */}
      <BlockStampsTable block={block} />
      {/* <BlockSendsTable block={block} /> */}
    </div>
  );
}
