import { titlePurpleLD } from "$text";

const WalletProfileHeader = () => {
  return (
    <div class="flex justify-between items-center gap-3 w-full relative">
      <h1 className={titlePurpleLD}>WALLET</h1>
      {
        /*
        import { SearchStampModal } from "$islands/modal/SearchStampModal.tsx";
        <div class="flex gap-3 justify-between h-9 items-center">
        <SearchStampModal showButton />
        </div>
        */
      }
    </div>
  );
};

export default WalletProfileHeader;
