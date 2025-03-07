import { useCallback, useEffect, useRef, useState } from "react";
import { Block, Elem } from "../../utils/bem";
import { Button } from "../Button/Button";
import { format } from "date-fns";
import "./ModelLogs.scss";

export const ModelLogs = ({ subscribe, unsubscribe, maxLogs = 1000 }) => {
  const listRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
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

  const addLog = useCallback(
    log => setLogs(prev => [...prev.slice(-maxLogs + 1), log]),
    [maxLogs]
  );

  const updateAutoScroll = useCallback(() => {
    if (listRef.current)
      setAutoScroll(
        listRef.current.scrollTop + listRef.current.clientHeight >=
          listRef.current.scrollHeight
      );
  }, [listRef]);

  useEffect(() => {
    if (autoScroll && listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [logs, autoScroll]);

  useEffect(() => {
    const setLogsHeight = () => {
      if (listRef.current) {
        listRef.current.style.height = `${window.innerHeight -
          listRef.current.offsetTop -
          20}px`;
      }
    };

    const observer = new ResizeObserver(setLogsHeight);
    if (listRef.current) observer.observe(listRef.current);

    setLogsHeight();

    window.addEventListener("resize", setLogsHeight);

    return () => {
      window.removeEventListener("resize", setLogsHeight);
      observer.disconnect();
    };
  }, [listRef]);

  useEffect(() => {
    const id = subscribe(addLog);
    console.log(id);
    return () => {
      unsubscribe(id);
    };
  }, []);

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
      <Elem name="logs-list-container">
        <Elem name="logs-list" ref={listRef} onScroll={updateAutoScroll}>
          {logs.map((log, i) => (
            <Elem name="log" key={`log-${i}`}>
              {format(log.timestamp, "[yyyy-MM-dd HH:mm:ss,SSS]")} {log.content}
            </Elem>
          ))}
        </Elem>
      </Elem>
    </Block>
  );
};
