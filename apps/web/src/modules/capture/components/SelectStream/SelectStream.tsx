import { useListStreamsQuery } from "@/core/cameraApi";
import { Select } from "@repo/ui/components/Select/Select";
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
    <Select<string>
      placeholder="Select stream"
      items={
        streams?.map((stream) => ({
          label: stream.name,
          value: stream.name,
        })) || []
      }
      value={value}
      onValueChange={(value) => onSelect(value)}
    />
  );
};
