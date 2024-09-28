const RecentDeploy = () => {
  return (
    <div className="w-full md:w-1/2 flex flex-col gap-4 items-start md:items-end">
      <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-[#AA00FF] via-[#660099] to-[#440066] text-3xl md:text-6xl font-black">
        RECENT DEPLOYS
      </h1>
      <p className="text-2xl md:text-5xl text-[#AA00FF]">LOREM IPSUM</p>
      <a class="text-[#660099] text-sm md:text-base font-light border-2 border-[#660099] py-1 text-center min-w-[132px] rounded-md cursor-pointer">
        View All
      </a>
    </div>
  );
};

export default RecentDeploy;
