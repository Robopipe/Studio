import { cn } from "@/lib/utils";
import { EvalLogicNodeOperatorValueEnum } from "@repo/schema";
import { useLogicBuilderContext } from "./LogicBuilderContext";
import { OperatorNode } from "./logicBuilder.utils";

interface OperatorChipProps {
  node: OperatorNode;
}

const NEXT_VALUE: Record<string, EvalLogicNodeOperatorValueEnum> = {
  [EvalLogicNodeOperatorValueEnum.AND]: EvalLogicNodeOperatorValueEnum.OR,
  [EvalLogicNodeOperatorValueEnum.OR]: EvalLogicNodeOperatorValueEnum.AND,
};

export function OperatorChip({ node }: OperatorChipProps) {
  const { changeOperator } = useLogicBuilderContext();

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = NEXT_VALUE[node.operatorValue];
    if (next) changeOperator(node.id, next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
        node.operatorValue === EvalLogicNodeOperatorValueEnum.AND
          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
          : "bg-amber-100 text-amber-700 hover:bg-amber-200",
      )}
    >
      {node.operatorValue}
    </button>
  );
}
