/* ===== VIEW ALL BUTTON COMPONENT ===== */
import { Button } from "$buttons";

/* ===== COMPONENT PROPS ===== */
type ViewAllButtonProps = {
  href: string;
};

/* ===== COMPONENT DEFINITION ===== */
export function ViewAllButton({ href }: ViewAllButtonProps) {
  return (
    <div className="flex justify-end w-full mt-6 mobileLg:mt-9">
      <Button
        variant="outline"
        color="purple"
        size="lg"
        href={href}
        target="_top"
      >
        VIEW ALL
      </Button>
    </div>
  );
}
