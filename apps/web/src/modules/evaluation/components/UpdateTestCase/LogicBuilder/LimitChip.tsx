import { cn } from "@/lib/utils";
import { Button } from "@/modules/shadcn/ui/button";
import { XIcon } from "lucide-react";
import { useLogicBuilderContext } from "./LogicBuilderContext";
import { LimitNode } from "./logicBuilder.utils";

interface LimitChipProps {
  node: LimitNode;
  hasNot: boolean;
}

export function LimitChip({ node, hasNot }: LimitChipProps) {
  const { testCase, selectedIds, toggleSelect, toggleNot, removeNode } =
    useLogicBuilderContext();

  const limit = testCase.limits.find((l) => l.id === node.limitId);
  const isSelected = selectedIds.has(node.id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelect(node.id, e.shiftKey || e.metaKey || e.ctrlKey);
  };

  const handleNotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNot(node.id);
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
      {/* NOT toggle */}
      <Button
        size={"xs"}
        variant={"destructive"}
        onClick={handleNotClick}
        className={cn(
          "rounded py-0.5 px-1 transition-colors",
          hasNot
            ? "text-destructive hover:text-destructive/70"
            : "text-destructive/40 hover:text-destructive/70 opacity-0 group-hover/chip:opacity-100",
        )}
      >
        not
      </Button>

      {/* Label color dot */}
      {limit?.targetLabel.color && (
        <span
          className="size-2 rounded-full shrink-0"
          style={{ backgroundColor: limit.targetLabel.color }}
        />
      )}

      <span className="max-w-[120px] truncate">{limit?.name ?? node.id}</span>

      {/* Remove */}
      <button
        type="button"
        title="Remove from logic"
        onClick={(e) => {
          e.stopPropagation();
          removeNode(node.id);
        }}
        className="rounded p-0.5 text-muted-foreground/40 hover:text-destructive "
      ></button>
      <Button
        size="icon-xs"
        variant="ghost"
        title="Remove from logic"
        onClick={(e) => {
          e.stopPropagation();
          removeNode(node.id);
        }}
        className="opacity-0 group-hover/chip:opacity-100 transition-colors"
      >
        <XIcon className="size-3 text-destructive" />
      </Button>
    </div>
  );
}
