import { useState } from "preact/hooks";
import { TransactionsTable } from "$components/wallet/TransactionsTable.tsx";

export const TransactionsContent = () => {
  const [selectedButton, setSelectedButton] = useState("Send");

  return (
    <>
      <div class="flex items-center justify-end">
        <button
          className={"border-2 border-[#2B0E49] min-w-[120px] py-[20px] text-[19px] font-semibold " +
            (selectedButton == "Send"
              ? "bg-[#321A43] text-[#7A00F5]"
              : "bg-[#4A3757] text-[#B9B9B9]")}
          onClick={() => setSelectedButton("Send")}
        >
          Send
        </button>
        <button
          className={"border-2 border-[#2B0E49] min-w-[120px] py-[20px] text-[19px] font-semibold " +
            (selectedButton == "Receive"
              ? "bg-[#321A43] text-[#7A00F5]"
              : "bg-[#4A3757] text-[#B9B9B9]")}
          onClick={() => setSelectedButton("Receive")}
        >
          Receive
        </button>
      </div>
      <TransactionsTable />
    </>
  );
};
