import { useState } from "preact/hooks";

import { SRC20HoldersInfo } from "$components/src20/SRC20HoldersInfo.tsx";
import { SRC20TX } from "$components/src20/SRC20TX.tsx";

type SRC20DetailsTabProps = {
  holders: any[];
  sends: any[];
  mints: any[];
};

export const SRC20DetailsTab = (props: SRC20DetailsTabProps) => {
  const { holders, sends, mints } = props;
  const [selected, setSelected] = useState(0);

  const updateSelected = (index: number) => {
    setSelected(index);
  };

  return (
    <>
      <div class="flex gap-12 text-2xl cursor-pointer mb-5">
        <p
          className={`pb-4 border-[#7A00F5] ${
            selected === 0 ? "text-[#7A00F5] border-b-4" : "text-[#625F5F]"
          }`}
          onClick={() => updateSelected(0)}
        >
          Holders
        </p>
        <p
          className={`pb-4 border-[#7A00F5] ${
            selected === 1 ? "text-[#7A00F5] border-b-4" : "text-[#625F5F]"
          }`}
          onClick={() => updateSelected(1)}
        >
          Transfers
        </p>
        <p
          className={`pb-4 border-[#7A00F5] ${
            selected === 2 ? "text-[#7A00F5] border-b-4" : "text-[#625F5F]"
          }`}
          onClick={() => updateSelected(2)}
        >
          Mints
        </p>
      </div>

      {selected === 0 && <SRC20HoldersInfo holders={holders} />}
      {selected === 1 && <SRC20TX txs={sends} type="TRANSFER" />}
      {selected === 2 && <SRC20TX txs={mints} type="MINT" />}
    </>
  );
};
