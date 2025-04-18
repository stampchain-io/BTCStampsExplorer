import { titlePurpleLD } from "$text";

const WalletDashboardHeader = () => {
  return (
    <div class="flex justify-between items-center gap-3 w-full relative">
      <h1 className={titlePurpleLD}>DASHBOARD</h1>
      {
        /*
        import { SearchStampModal } from "$modal";
        <div class="flex gap-3 justify-between h-9 items-center">
        <SearchStampModal showButton={true} />
        </div>
        */
      }
    </div>
  );
};

export default WalletDashboardHeader;
