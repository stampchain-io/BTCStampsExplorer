const WalletDashboardHeader = () => {
  const titlePurpleDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient1";

  return (
    <div class="flex justify-between items-center gap-3 w-full relative">
      <h1 className={titlePurpleDL}>DASHBOARD</h1>
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

export default WalletDashboardHeader;
