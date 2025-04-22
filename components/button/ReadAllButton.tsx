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
      <a
        href={href}
        target="_top"
        class="font-semibold text-base text-stamp-grey-light hover:text-stamp-grey animated-underline"
      >
        Read the full guide
      </a>
    </div>
  );
}

/* ===== BUTTON ===== */
/*
<Button
variant="outline"
color="grey"
size="lg"
href={href}
target="_top"
>
READ MORE
</Button>
*/
