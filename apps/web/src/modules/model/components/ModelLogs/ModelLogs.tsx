import { Stack, Text } from "@repo/ui";
import { useModelParams } from "../../hooks/useModelParams";
import { useGetModelLogsQuery } from "../../services";

export interface ModelLogsProps {}

export const ModelLogs = ({}: ModelLogsProps) => {
  const { projectId, modelId } = useModelParams();
  const { data: logs } = useGetModelLogsQuery({ projectId, modelId });
  return (
    <Stack gap={2}>
      {logs?.map((log) => (
        <Text key={log.id}>
          [{log.createdAt}]{" "}
          {`epoch ${log.epoch}: ${JSON.stringify(log.metrics)}`}
        </Text>
      ))}
    </Stack>
  );
};
