/* ===== VIEW ALL BUTTON COMPONENT ===== */
import { Button } from "$button";
import type { ViewAllButtonProps } from "$types/ui.d.ts";

/* ===== TYPES ===== */

/* ===== COMPONENT ===== */
export function ViewAllButton({ href }: ViewAllButtonProps) {
  return (
    <div class="flex justify-end w-full mt-6 mobileLg:mt-9">
      <Button
        variant="outline"
        color="purple"
        size="md"
        href={href}
        target="_top"
      >
        VIEW
      </Button>
    </div>
  );
}
