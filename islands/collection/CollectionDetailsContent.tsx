import { StampRow } from "globals";

import { StampCard } from "$components/stamp/StampCard.tsx";

export const CollectionDetailsContent = ({ stamps = [] }: {
  stamps: StampRow[];
}) => {
  const stampData: StampRow = {
    stamp: 368059,
    cpid: "K0xoPyzPdyaqB4W992qo",
    creator: "bc1q2n4sptqck72w0dhcr8nt5jt8urwdl8wkuetvsy",
    creator_name: null,
    tx_hash: "20149ee15c2ae72411fb84a2a3172f953cf890cb059d78c92553e5f7d3db1b2c",
    stamp_mimetype: "image/svg+xml",
    supply: 690000000,
    divisible: null,
    locked: null,
    ident: "SRC-20",
    block_time: "2024-03-14T01:37:24.000Z",
    block_index: 834568,
  };

  const stampsArray = Array.from({ length: 15 }, () => stampData);

  return (
    <div name="stamps">
      <div class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4 xl:gap-6 transition-opacity duration-700 ease-in-out">
        {stamps.map((stamp: StampRow) => (
          <StampCard stamp={stamp} kind="stamp" />
        ))}
      </div>
    </div>
  );
};
