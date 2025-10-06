import { titleGreyLD } from "$text";

export default function BlockHeader() {
  return (
    <div class="flex items-center justify-between">
      <h1 class={`${titleGreyLD} ml-1.5`}>STAMP BLOCK EXPLORER</h1>
    </div>
  );
}
