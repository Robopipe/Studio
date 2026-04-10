import { useCallback, useRef, useState } from "react";
import { DiscoveredDevice } from "../types";
import {
  generateIpRange,
  parseCidr,
  parsePorts,
  scanNetwork,
} from "../utils/discovery";

const CONCURRENCY = 30;

export function useNetworkScan() {
  const [results, setResults] = useState<DiscoveredDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState({ scanned: 0, total: 0 });
  const abortRef = useRef<AbortController | null>(null);

  const scan = useCallback(
    async (cidr: string, portsInput: string) => {
      abortRef.current?.abort();

      const { startIp, endIp } = parseCidr(cidr);
      const ips = generateIpRange(startIp, endIp);
      const ports = parsePorts(portsInput);
      const total = ips.length * ports.length;

      const controller = new AbortController();
      abortRef.current = controller;

      setIsScanning(true);
      setResults([]);
      setProgress({ scanned: 0, total });

      try {
        const found = await scanNetwork(
          ips,
          ports,
          CONCURRENCY,
          controller.signal,
          (scanned) => setProgress({ scanned, total }),
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
