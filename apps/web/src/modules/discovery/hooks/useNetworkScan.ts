import { useCallback, useRef, useState } from "react";
import { DiscoveredDevice } from "../types";
import {
  generateIpRange,
  parseCidr,
  parsePorts,
  scanNetwork,
} from "../utils/discovery";

const CONCURRENCY = 30;

export interface ScanProgress {
  scanned: number;
  total: number;
}

export function useNetworkScan() {
  const [results, setResults] = useState<DiscoveredDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress>({
    scanned: 0,
    total: 0,
  });
  const abortRef = useRef<AbortController | null>(null);

  const scan = useCallback(async (cidr: string, portsInput: string) => {
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setIsScanning(true);
    setResults([]);

    const ports = parsePorts(portsInput);

    try {
      const { startIp, endIp } = parseCidr(cidr);
      const ips = generateIpRange(startIp, endIp);
      const total = ips.length * ports.length;
      setProgress({ scanned: 0, total });

      await scanNetwork(
        ips,
        ports,
        CONCURRENCY,
        controller.signal,
        (scanned) => setProgress({ scanned, total }),
        (device) => setResults((prev) => [...prev, device]),
      );
    } finally {
      setIsScanning(false);
      abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { scan, cancel, results, isScanning, progress };
}
