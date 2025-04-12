import { titlePurpleLD } from "$text";

const WalletProfileHeader = () => {
  return (
    <div class="flex justify-between items-center gap-3 w-full relative">
      <h1 className={titlePurpleLD}>WALLET</h1>
      {
        /*<div class="flex gap-3 justify-between h-9 items-center">
        <Filter
          initFilter={filterBy}
          open={isOpen1}
          handleOpen={handleOpen1}
          filterButtons={[
            "all",
            "stamps",
            "collections",
            "dispensers",
            "tokens",
          ]}
        />
        <StampSearchClient open2={isOpen2} handleOpen2={handleOpen2} />
        </div>*/
      }
    </div>
  );
};

export default WalletProfileHeader;
