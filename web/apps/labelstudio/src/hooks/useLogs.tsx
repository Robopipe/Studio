import { useCallback, useRef, useState } from "react";

export type Log = {
  timestamp: Date;
  content: string;
};

export type LogSubscriber = {
  id: number;
  cb: (log: Log) => void;
};

export const useLogs = () => {
  const id = useRef(0);
  const [subscribers, setSubscribers] = useState<LogSubscriber[]>([]);
  const addLog = useCallback(
    (log: string) => {
      const logObj = { timestamp: new Date(), content: log };
      subscribers.forEach(subscriber => subscriber.cb(logObj));
    },
    [subscribers]
  );

  return {
    subscribe: (cb: LogSubscriber["cb"]) => {
      const currId = ++id.current;
      setSubscribers(prev => [...prev, { id: currId, cb }]);
      return currId;
    },
    unsubscribe: (id: number) =>
      setSubscribers(prev => prev.filter(subscriber => subscriber.id !== id)),
    addLog
  };
};
