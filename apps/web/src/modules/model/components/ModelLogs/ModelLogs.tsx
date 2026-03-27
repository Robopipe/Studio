import { Stack, Text } from "@repo/ui";
import { useEffect, useRef } from "react";
import { useModelParams } from "../../hooks/useModelParams";
import { useGetModelLogsQuery, useGetModelQuery } from "../../services";
import styles from "./ModelLogs.module.scss";

export interface ModelLogsProps {}

const formatMetricValue = (value: unknown): string => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toString() : "nan";
  }

  return String(value);
};

export const ModelLogs = ({}: ModelLogsProps) => {
  const { projectId, modelId } = useModelParams();
  const { data: model } = useGetModelQuery({ projectId, modelId });
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
            <span className={styles.timestamp}>[{log.createdAt}]</span>{" "}
            <span className={styles.epochLabel}>epoch</span>{" "}
            <span className={styles.epochValue}>{log.epoch}</span>
            <span className={styles.separator}>: </span>
            <span className={styles.brace}>{"{"}</span>
            {Object.entries(log.metrics).map(([key, value], index, entries) => (
              <span key={key}>
                <span className={styles.metricKey}>{key}</span>
                <span className={styles.separator}>: </span>
                <span className={styles.metricValue}>
                  {formatMetricValue(value)}
                </span>
                {index < entries.length - 1 ? (
                  <span className={styles.separator}>, </span>
                ) : null}
              </span>
            ))}
            <span className={styles.brace}>{"}"}</span>
          </Text>
        ))}
        {model?.errorMessage && (
          <Text color="red-500" variant="code-14">
            <span className={styles.timestamp}>[{model.updatedAt}]</span> Error:{" "}
            {model.errorMessage}
          </Text>
        )}
      </Stack>
    </div>
  );
};
