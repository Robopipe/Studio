import {
  useBatchUpdateStreamsMutation,
  useListStreamsQuery,
} from "@/core/cameraApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface SelectStreamProps {
  mxid?: string | null;
  value?: string | null;
  onSelect: (streamName: string | null) => void;
  onSwitchingChange?: (isSwitching: boolean) => void;
}

export const SelectStream = ({
  mxid,
  value,
  onSelect,
  onSwitchingChange,
}: SelectStreamProps) => {
  const { data: streams } = useListStreamsQuery(mxid!, {
    skip: !mxid,
  });
  const [batchUpdateStreams] = useBatchUpdateStreamsMutation();
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    // Auto-select the active stream
    if (streams && streams.length > 0 && !value) {
      const activeStream = streams.find((s) => s.active);
      if (activeStream) {
        onSelect(activeStream.name);
      }
    }
  }, [streams, value, onSelect]);

  const handleStreamChange = useCallback(
    async (newStream: string | null) => {
      if (!mxid || !newStream || newStream === value) return;

      setIsSwitching(true);
      onSwitchingChange?.(true);
      try {
        await batchUpdateStreams({
          mxid,
          activate: [newStream],
          deactivate: value ? [value] : [],
        }).unwrap();
        onSelect(newStream);
      } catch {
        toast.error("Failed to switch stream");
      } finally {
        setIsSwitching(false);
        onSwitchingChange?.(false);
      }
    },
    [mxid, value, batchUpdateStreams, onSelect, onSwitchingChange],
  );

  return (
    <Select
      value={value}
      onValueChange={handleStreamChange}
      disabled={isSwitching}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select stream" />
      </SelectTrigger>
      <SelectContent>
        {streams?.map((stream) => (
          <SelectItem key={stream.name} value={stream.name}>
            {stream.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
