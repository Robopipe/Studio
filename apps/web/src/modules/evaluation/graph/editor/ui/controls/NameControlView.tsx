import { cn } from "@/lib/utils";
import type { NameControl } from "@/modules/evaluation/graph/editor/controls/name";
import { Input } from "@/modules/shadcn/ui/input";
import { useEffect, useState, useSyncExternalStore } from "react";

type Props = {
  data: NameControl;
};

export const NameControlView = ({ data }: Props) => {
  const value = useSyncExternalStore(data.subscribe, data.getSnapshot);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commitValue = (raw: string) => {
    data.setValue(raw);
  };

  return (
    <div onPointerDown={(e) => e.stopPropagation()}>
      <Input
        type="text"
        value={draft}
        className={cn(
          "h-9",
          data.hasValidationErrors &&
            "border-red-500 focus-visible:ring-red-500",
        )}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commitValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commitValue(e.currentTarget.value);
          }
        }}
      />
    </div>
  );
};
