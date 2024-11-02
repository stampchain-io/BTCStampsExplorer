export function HistoryTable() {
  return (
    <div class="relative overflow-x-auto shadow-md mt-3">
      <table class="hidden tablet:table w-full text-sm text-left rtl:text-right text-[#F5F5F5]">
        <thead class="bg-[#2B0E49] uppercase text-lg text-[#C184FF]">
          <tr class="border-b border-[#B9B9B9]">
            <th scope="col" class="px-6 py-3">#</th>
            <th scope="col" class="px-6 py-3">image</th>
            <th scope="col" class="px-6 py-3">tick</th>
            <th scope="col" class="px-6 py-3">block</th>
            <th scope="col" class="px-6 py-3">total</th>
            <th scope="col" class="px-6 py-3">sellar address</th>
            <th scope="col" class="px-6 py-3">buyer address</th>
            <th scope="col" class="px-6 py-3">time</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(3)].map((transaction, index) => {
            return (
              <tr class="bg-[#2B0E49] border-b border-[#B9B9B9] text-sm">
                <td class="px-6 py-4 uppercase">
                  {index + 1}
                </td>
                <td class="px-6 py-4 uppercase cursor-pointer">
                  <img
                    src={`/img/mock.png`}
                    class="w-[65px] h-[65px]"
                  />
                </td>
                <td class="px-6 py-4 uppercase">
                  KEVIN
                </td>
                <td class="px-6 py-4">
                  410659
                </td>
                <td class="px-6 py-4">
                  2,500
                </td>
                <td class="px-6 py-4">
                  bc1p2...l64r
                </td>
                <td class="px-6 py-4">
                  bc1r4...c26x
                </td>
                <td class="px-6 py-4">
                  12:34PM 06/24/2024
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div class="flex tablet:hidden flex-col gap-3">
        {[...Array(3)].map((transaction, index) => {
          return (
            <div class="text-[#F5F5F5] bg-[#2B0E49] border-2 border-[#3F2A4E] p-2">
              <div class="w-full flex items-center gap-2 mb-2">
                <img
                  src={`/img/mock.png`}
                  class="w-[74px] h-[74px] rounded-[3px]"
                />
                <div class="w-full">
                  <div class="flex justify-between">
                    KEVIN
                    <p class="text-sm">
                      12:34PM 06/24/2024
                    </p>
                  </div>
                  <div class="flex justify-between">
                    <p>
                      Block:{" "}
                      <span class="text-lg font-medium">
                        410659
                      </span>
                    </p>
                    <p>
                      Total:{" "}
                      <span class="text-lg font-medium">
                        2,500
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div class="w-full flex justify-between pr-6">
                <div>
                  <p>
                    From:
                    <span class="text-lg">
                      bc1p2...l64r
                    </span>
                  </p>
                </div>
                <div>
                  <p>
                    To:
                    <span class="text-lg">
                      bc1r4...c26x
                    </span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
