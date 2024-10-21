export function MyItemCard({ item }) {
  return (
    <a
      href={`/collection/123456789`}
      className="bg-[#2E0F4D] text-white group relative z-10 flex h-full w-full grow flex-col m-1 p-2 rounded-lg @container transition-all min-w-[200px]"
    >
      <div class="relative flex overflow-hidden">
        <div class="pointer-events-none relative aspect-square min-h-[70px] grow overflow-hidden rounded-lg">
          <div class="center relative aspect-square overflow-hidden">
            <img
              src="/img/mock.png"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = `/not-available.png`;
              }}
              alt="collection image"
              class="h-full w-full object-contain items-center standalone:h-full standalone:w-auto pixelart image-rendering-pixelated"
            />
          </div>
        </div>
      </div>
      <div class="flex grow flex-col pt-1 font-title text-[13px] font-medium text-text">
        <div class="flex justify-between text-black">
          <h3 class="text-[#6E6E6E]">
            {`#12353235`}
          </h3>
        </div>
        <div class="flex justify-between text-black">
          <h3 class="font-semibold text-white text-xl">
            {`Stamp Name`}
          </h3>
        </div>
        <div>
          <div class="flex justify-between text-black">
            <h3 class="text-[#BF83FC] font-medium">0.1 BTC</h3>
          </div>
        </div>
      </div>
    </a>
  );
}
