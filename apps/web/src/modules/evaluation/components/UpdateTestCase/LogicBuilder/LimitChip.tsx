import { cn } from "@/lib/utils";
import { Button } from "@/modules/shadcn/ui/button";
import { XIcon } from "lucide-react";
import { useLogicBuilderContext } from "./LogicBuilderContext";
import { RenderLimitNode } from "./logicBuilder.utils";

interface LimitChipProps {
  node: RenderLimitNode;
  hasNot: boolean;
}

export function LimitChip({ node, hasNot }: LimitChipProps) {
  const { testCase, selectedIds, toggleSelect, toggleNot, removeNode } =
    useLogicBuilderContext();
    
  const limit = testCase.limits.find((l) => l.id === node.id);
  const isSelected = selectedIds.has(node.renderId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelect(node.renderId, e.shiftKey || e.metaKey || e.ctrlKey);
  };

  const handleNotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNot(node.renderId);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) =>
        e.key === "Enter" && handleClick(e as unknown as React.MouseEvent)
      }
      className={cn(
        "group/chip flex items-center gap-1.5 rounded-md border px-1.5 py-1.5 text-xs font-medium cursor-pointer select-none transition-colors",
        isSelected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-foreground hover:border-primary/50",
      )}
    >
      {/* NOT toggle — animates from zero width to full width on hover */}
      <div
        className={cn(
          "overflow-hidden transition-[max-width] duration-200 grayscale-100 opacity-50",
          hasNot ? "max-w-12 grayscale-0 opacity-100" : "max-w-0 group-hover/chip:max-w-12",
        )}
      >
        <Button
          size="xs"
          variant="destructive"
          onClick={handleNotClick}
          className="whitespace-nowrap rounded py-0.5 px-1 "
        >
          not
        </Button>
      </div>

      {/* Label color dot */}
      {limit?.targetLabel.color && (
        <span
          className="size-2 rounded-full shrink-0"
          style={{ backgroundColor: limit.targetLabel.color }}
        />
      )}

      <span className="max-w-[120px] truncate">{limit?.name ?? node.id}</span>

      {/* Remove */}
      <Button
        size="icon-xs"
        variant="ghost"
        title="Remove from logic"
        onClick={(e) => {
          e.stopPropagation();
          removeNode(node.renderId);
        }}
        className="opacity-0 group-hover/chip:opacity-100 transition-opacity"
      >
        <XIcon className="size-3 text-destructive" />
      </Button>
    </div>
  );
}
