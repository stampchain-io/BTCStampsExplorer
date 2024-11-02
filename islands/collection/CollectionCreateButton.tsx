import { useState } from "preact/hooks";

export function CollectionCreateButton() {
  const [name, setName] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [stamps, setStamps] = useState("");

  const handlePreview = () => {
  };

  const handleSave = () => {
  };

  return (
    <div class="group relative">
      <div class="bg-[#5503A6] p-4 border border-[#8A8989] min-w-[210px] w-[210px] h-[50px] rounded cursor-pointer mb-3 text-[#F5F5F5] flex justify-between items-center gap-2">
        <img src="/img/icon_create.png" class="w-4 h-4" />
        <p>Create a collection</p>
      </div>
      <div class="bg-[#3E2F4C] text-[#F5F5F5] p-6 rounded absolute hidden group-hover:flex z-[100] flex-col gap-5 w-[calc(100vw-16px)] tablet:w-[650px]">
        <div class="flex flex-col">
          <span class="text-2xl">Create a collection</span>
        </div>
        <hr class="w-[300px] tablet:w-[350px]" />
        <div class="flex flex-col gap-1">
          <span>Name</span>
          <input
            class="bg-[#4F3666] border border-[#8A8989] rounded w-[300px] tablet:w-[350px] py-2 px-3"
            onChange={(e) => setName((e.target as HTMLInputElement).value)}
          />
        </div>
        <hr class="w-[300px] tablet:w-[350px]" />
        <div class="flex flex-col gap-1">
          <span>X (Twitter)</span>
          <input
            class="bg-[#4F3666] border border-[#8A8989] rounded w-[300px] tablet:w-[350px] py-2 px-3"
            onChange={(e) => setTwitter((e.target as HTMLInputElement).value)}
          />
        </div>
        <hr class="w-[300px] tablet:w-[350px]" />
        <div class="flex flex-col gap-1">
          <span>Website</span>
          <input
            class="bg-[#4F3666] border border-[#8A8989] rounded w-[300px] tablet:w-[350px] py-2 px-3"
            onChange={(e) => setWebsite((e.target as HTMLInputElement).value)}
          />
        </div>
        <hr class="w-[300px] tablet:w-[350px]" />
        <div class="flex flex-col gap-1">
          <span>Description</span>
          <input
            class="bg-[#4F3666] border border-[#8A8989] rounded w-[300px] tablet:w-[350px] py-2 px-3"
            onChange={(e) =>
              setDescription((e.target as HTMLInputElement).value)}
          />
        </div>
        <hr class="w-full" />
        <div class="flex flex-col gap-1">
          <span>Stamps</span>
          <textarea
            class="bg-[#4F3666] border border-[#8A8989] rounded w-full py-2 px-3"
            rows={5}
            onChange={(e) => setStamps((e.target as HTMLTextAreaElement).value)}
          />
        </div>
        <button
          class="w-[150px] bg-[#5503A6] border border-[#8A8989] py-4 rounded-md mt-2"
          onClick={() => handlePreview()}
        >
          Preview
        </button>
        <p class="mt-7">
          NB: Please only add Stamps you've created or have the owner's
          permission.
        </p>
        <button
          class="w-full bg-[#5503A6] border border-[#8A8989] py-4 rounded-md"
          onClick={() => handleSave()}
        >
          Save
        </button>
      </div>
    </div>
  );
}
