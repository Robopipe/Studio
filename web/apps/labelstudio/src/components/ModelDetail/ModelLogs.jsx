import { useCallback, useEffect, useRef } from "react";
import { Block, Elem } from "../../utils/bem";
import { Button } from "../Button/Button";
import { format } from "date-fns";
import "./ModelLogs.scss";

export const ModelLogs = ({ logs }) => {
  const listRef = useRef(null);
  const exportLogs = useCallback(() => {
    const logsStr = logs
      .map(
        log =>
          `${format(log.timestamp, "[yyyy-MM-dd HH:mm:SS]")} ${log.content}`
      )
      .join("\n");
    const blob = new Blob([logsStr], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "logs.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [logs]);

  return (
    <Block name="model-logs">
      <Elem name="header">
        <Elem tag="h2" name="heading">
          Logs
        </Elem>
        <Button size="small" name="export" onClick={exportLogs}>
          Export
        </Button>
      </Elem>
      <Elem name="logs-list" ref={listRef}>
        {logs.map((log, i) => (
          <Elem name="log" key={`log-${i}`}>
            {format(log.timestamp, "[yyyy-MM-dd HH:mm:ss,SSS]")} {log.content}
          </Elem>
        ))}
      </Elem>
    </Block>
  );
};
