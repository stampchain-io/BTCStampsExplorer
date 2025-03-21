import { Button } from "$buttons";

type ViewAllButtonProps = {
  href: string;
};

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
