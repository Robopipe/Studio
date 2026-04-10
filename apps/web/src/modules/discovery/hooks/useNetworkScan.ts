import { useCallback, useRef, useState } from "react";
import { DiscoveredDevice } from "../types";
import { generateIpRange, scanIpRange } from "../utils/discovery";

const CONCURRENCY = 30;

export function useNetworkScan() {
  const [results, setResults] = useState<DiscoveredDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState({ scanned: 0, total: 0 });
  const abortRef = useRef<AbortController | null>(null);

  const scan = useCallback(
    async (startIp: string, endIp: string, port: number) => {
      abortRef.current?.abort();

      const ips = generateIpRange(startIp, endIp);
      const controller = new AbortController();
      abortRef.current = controller;

      setIsScanning(true);
      setResults([]);
      setProgress({ scanned: 0, total: ips.length });

      try {
        const found = await scanIpRange(
          ips,
          port,
          CONCURRENCY,
          controller.signal,
          (scanned) => setProgress({ scanned, total: ips.length }),
        );
        setResults(found);
      } finally {
        setIsScanning(false);
        abortRef.current = null;
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { scan, cancel, results, isScanning, progress };
}
