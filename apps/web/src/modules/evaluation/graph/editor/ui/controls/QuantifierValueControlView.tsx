// FIX(naming): file is named QuantifierValueControlView.tsx but exports QuantifierUnitsControlView for QuantifierUnitsControl — fix: rename the file to QuantifierUnitsControlView.tsx (or rename the component) so file and export match like the sibling control views; why: searching for the component by name misses the file and the mismatch invites wrong imports.
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

  // FIX(bug): QuantifierUnitsControl.setValue clamps via normalizeUnitsValue and early-returns when the clamped value equals the stored one, so the resync effect never fires and the stale raw text stays in the input (e.g. value is 100 in PERCENT mode, user types "150" -> clamps to 100 -> no emit -> field still shows "150") — fix: resync the draft from data.getSnapshot() after committing (or on blur) regardless of whether the store emitted; why: the displayed quantity silently diverges from the committed model value.
  const commitValue = (raw: string) => {
    const parsed = Number(raw);
    data.setValue(Number.isFinite(parsed) ? parsed : 0);
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
