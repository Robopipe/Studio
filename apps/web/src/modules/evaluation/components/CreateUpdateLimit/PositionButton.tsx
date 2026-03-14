import { Button } from "@/modules/shadcn/ui/button";
import { MoveIcon } from "lucide-react";

export function PositionButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="size-9 shrink-0"
      aria-label="Set position"
    >
      <MoveIcon className="size-5" />
    </Button>
  );
}
