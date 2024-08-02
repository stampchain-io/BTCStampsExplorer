import { useState } from "preact/hooks";
import { HistoryTable } from "$components/wallet/HistoryTable.tsx";

export const HistoryContent = () => {
  const [selectedButton, setSelectedButton] = useState("All History");

  return (
    <>
      <div class="flex items-center justify-end">
        <button
          className={"border-2 border-[#2B0E49] min-w-[120px] py-[20px] text-[19px] font-semibold " +
            (selectedButton == "All History"
              ? "bg-[#321A43] text-[#7A00F5]"
              : "bg-[#4A3757] text-[#B9B9B9]")}
          onClick={() => setSelectedButton("All History")}
        >
          All History
        </button>
        <button
          className={"border-2 border-[#2B0E49] min-w-[120px] py-[20px] text-[19px] font-semibold " +
            (selectedButton == "Dispenser"
              ? "bg-[#321A43] text-[#7A00F5]"
              : "bg-[#4A3757] text-[#B9B9B9]")}
          onClick={() => setSelectedButton("Dispenser")}
        >
          Dispenser
        </button>
        <button
          className={"border-2 border-[#2B0E49] min-w-[120px] py-[20px] text-[19px] font-semibold " +
            (selectedButton == "Destroys"
              ? "bg-[#321A43] text-[#7A00F5]"
              : "bg-[#4A3757] text-[#B9B9B9]")}
          onClick={() => setSelectedButton("Destroys")}
        >
          Destroys
        </button>
      </div>
      <HistoryTable />
    </>
  );
};
