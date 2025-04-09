/* ===== READ ALL BUTTON COMPONENT ===== */
import { Button } from "$button";

/* ===== TYPES ===== */
interface ReadAllButtonProps {
  href?: string;
}

/* ===== COMPONENT ===== */
export function ReadAllButton({ href = "/howto" }: ReadAllButtonProps) {
  return (
    <div className="flex justify-end tablet:justify-start mt-0.5 tablet:mt-1">
      <Button
        variant="outline"
        color="grey"
        size="lg"
        href={href}
        target="_top"
      >
        READ MORE
      </Button>
    </div>
  );
}
