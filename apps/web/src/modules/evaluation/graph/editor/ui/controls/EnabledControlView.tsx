import type { EnabledControl } from "@/modules/evaluation/graph/editor/controls/enabled";
import { Switch } from "@/modules/shadcn/ui/switch";
import { useSyncExternalStore } from "react";

type Props = {
  data: EnabledControl;
};

export const EnabledControlView = ({ data }: Props) => {
  const value = useSyncExternalStore(data.subscribe, data.getSnapshot);

  return (
    <div onPointerDown={(e) => e.stopPropagation()}>
      <Switch
        checked={value}
        onCheckedChange={(next) => data.setValue(next)}
        aria-label={value ? "Disable check" : "Enable check"}
      />
    </div>
  );
};
