import { useListStreamsQuery } from "@/core/cameraApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { useEffect } from "react";

export interface SelectStreamProps {
  mxid?: string | null;
  value?: string | null;
  onSelect: (streamName: string | null) => void;
}

export const SelectStream = ({ mxid, value, onSelect }: SelectStreamProps) => {
  const { data: streams } = useListStreamsQuery(mxid!, {
    skip: !mxid,
  });

  useEffect(() => {
    // Select first stream automatically
    if (streams && streams.length > 0 && !value) {
      onSelect(streams[0].name);
    }
  }, [streams]);

  return (
    <Select value={value} onValueChange={(val) => onSelect(val)}>
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
