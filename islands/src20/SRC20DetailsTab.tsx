import { useState } from "preact/hooks";
import { SRC20HoldersInfo } from "$components/src20/SRC20HoldersInfo.tsx";
import { SRC20TX } from "$components/src20/SRC20TX.tsx";

type SRC20DetailsTabProps = {
  holders: any[];
  transfers: any[];
  mints: any[];
};

export const SRC20DetailsTab = (props: SRC20DetailsTabProps) => {
  const { holders, transfers, mints } = props;
  const [selected, setSelected] = useState(0);

  const updateSelected = (index: number) => {
    setSelected(index);
  };

  return (
    <>
      <div class="flex gap-12 text-2xl cursor-pointer mb-5">
        {["Holders", "Transfers", "Mints"].map((tab, index) => (
          <p
            key={tab}
            className={`pb-4 border-[#7A00F5] ${
              selected === index
                ? "text-[#7A00F5] border-b-4"
                : "text-[#625F5F]"
            }`}
            onClick={() => updateSelected(index)}
          >
            {tab}
          </p>
        ))}
      </div>

      {selected === 0 && <SRC20HoldersInfo holders={holders} />}
      {selected === 1 && <SRC20TX txs={transfers} type="TRANSFER" />}
      {selected === 2 && <SRC20TX txs={mints} type="MINT" />}
    </>
  );
};
