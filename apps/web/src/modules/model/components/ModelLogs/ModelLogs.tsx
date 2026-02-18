import { Stack, Text } from "@repo/ui";
import { useEffect, useRef } from "react";
import { useModelParams } from "../../hooks/useModelParams";
import { useGetModelLogsQuery } from "../../services";
import styles from "./ModelLogs.module.scss";

export interface ModelLogsProps {}

export const ModelLogs = ({}: ModelLogsProps) => {
  const { projectId, modelId } = useModelParams();
  const { data: logs } = useGetModelLogsQuery({ projectId, modelId });
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 30;
    isUserScrolledUp.current =
      el.scrollHeight - el.scrollTop - el.clientHeight > threshold;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el && !isUserScrolledUp.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  return (
    <div className={styles.modelLogs}>
      <Stack
        gap={2}
        className={styles.modelLogsInner}
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {logs?.map((log) => (
          <Text key={log.id} color="text-white-secondary" variant="code-14">
            [{log.createdAt}]{" "}
            {`epoch ${log.epoch}: ${JSON.stringify(log.metrics)}`}
          </Text>
        ))}
      </Stack>
    </div>
  );
};
