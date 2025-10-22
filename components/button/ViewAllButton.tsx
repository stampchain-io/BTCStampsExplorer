/* ===== VIEW ALL BUTTON COMPONENT ===== */
import { Button } from "$button";
import type { ViewAllButtonProps } from "$types/ui.d.ts";

/* ===== COMPONENT ===== */
export function ViewAllButton({ href }: ViewAllButtonProps) {
  return (
    <div class="flex justify-end w-full mt-6 mobileLg:mt-9">
      <Button
        variant="flat"
        color="grey"
        size="mdR"
        href={href}
        f-partial="/collection"
        target="_top"
      >
        VIEW ALL
      </Button>
    </div>
  );
}
