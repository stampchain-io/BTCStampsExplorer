/* ===== VIEW ALL BUTTON COMPONENT ===== */
import { Button } from "$button";

/* ===== TYPES ===== */
type ViewAllButtonProps = {
  href: string;
};

/* ===== COMPONENT ===== */
export function ViewAllButton({ href }: ViewAllButtonProps) {
  return (
    <div class="flex justify-end w-full mt-6 mobileLg:mt-9">
      <Button
        variant="outline"
        color="purple"
        size="mdR"
        href={href}
        target="_top"
      >
        VIEW
      </Button>
    </div>
  );
}
