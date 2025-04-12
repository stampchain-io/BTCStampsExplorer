import { StampSearchClient } from "$search";
import { titlePurpleLD } from "$text";

export default function BlockHeader() {
  return (
    <div class="flex items-center justify-between">
      <h1 class={titlePurpleLD}>STAMP BLOCK EXPLORER</h1>
      <StampSearchClient />
    </div>
  );
}
