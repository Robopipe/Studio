import type { QuantifierUnitsControl } from "@/modules/evaluation/graph/editor/controls/quantifierUnits";
import { Button } from "@/modules/shadcn/ui/button";
import { ButtonGroup } from "@/modules/shadcn/ui/button-group";
import { Input } from "@/modules/shadcn/ui/input";
import { useEffect, useState, useSyncExternalStore } from "react";

type Props = {
  data: QuantifierUnitsControl;
};

export const QuantifierUnitsControlView = ({ data }: Props) => {
  const snapshot = useSyncExternalStore(data.subscribe, data.getSnapshot);
  const [draft, setDraft] = useState(String(snapshot.quantifierValue));

  useEffect(() => {
    setDraft(String(snapshot.quantifierValue));
  }, [snapshot.quantifierValue]);

  const commitValue = (raw: string) => {
    const parsed = Number(raw);
    data.setValue(Number.isFinite(parsed) ? parsed : 0);
    setDraft(String(data.getSnapshot().quantifierValue));
  };

  return (
    <ButtonGroup className="w-full" onPointerDown={(e) => e.stopPropagation()}>
      <Input
        className="h-9 px-2.5 text-sm bg-white"
        type="number"
        inputMode="numeric"
        min={0}
        max={snapshot.quantifierUnit === "PERCENT" ? 100 : undefined}
        step={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commitValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commitValue(e.currentTarget.value);
          }
        }}
      />

      <Button
        type="button"
        variant="outline"
        className="w-8"
        onClick={() => data.toggleMode()}
      >
        <span className="text-xs text-zinc-400">
          {snapshot.quantifierUnit === "PERCENT" ? "%" : "pcs"}
        </span>
      </Button>
    </ButtonGroup>
  );
};
