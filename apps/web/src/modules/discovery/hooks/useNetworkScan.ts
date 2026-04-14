import { useCallback, useRef, useState } from "react";
import { DiscoveredDevice } from "../types";
import {
  generateIpRange,
  parseCidr,
  parsePorts,
  probeRobopipeApi,
  scanNetwork,
} from "../utils/discovery";

const CONCURRENCY = 30;

export interface ScanProgress {
  phase: "mdns" | "scan";
  scanned: number;
  total: number;
}

export function useNetworkScan() {
  const [results, setResults] = useState<DiscoveredDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress>({
    phase: "scan",
    scanned: 0,
    total: 0,
  });
  const abortRef = useRef<AbortController | null>(null);

  const scan = useCallback(
    async (cidr: string, portsInput: string, hostname?: string) => {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      setIsScanning(true);
      setResults([]);

      const ports = parsePorts(portsInput);
      const foundDevices: DiscoveredDevice[] = [];
      const existingUrls = new Set<string>();

      try {
        // Phase 1: mDNS probe
        if (hostname?.trim()) {
          setProgress({ phase: "mdns", scanned: 0, total: 1 });

          for (const port of ports) {
            if (controller.signal.aborted) break;
            const url = `http://${hostname.trim()}.local:${port}`;
            const found = await probeRobopipeApi(
              url,
              3000,
              controller.signal,
            );
            if (found) {
              foundDevices.push({
                url,
                host: `${hostname.trim()}.local`,
                port,
                source: "mdns",
              });
              existingUrls.add(url);
            }
          }

          setProgress({ phase: "mdns", scanned: 1, total: 1 });
          setResults([...foundDevices]);
        }

        // Phase 2: CIDR scan
        if (!controller.signal.aborted) {
          const { startIp, endIp } = parseCidr(cidr);
          const ips = generateIpRange(startIp, endIp);
          const total = ips.length * ports.length;
          setProgress({ phase: "scan", scanned: 0, total });

          const networkResults = await scanNetwork(
            ips,
            ports,
            CONCURRENCY,
            controller.signal,
            (scanned) => setProgress({ phase: "scan", scanned, total }),
            existingUrls,
          );

          const taggedResults = networkResults.map((d) => ({
            ...d,
            source: "network" as const,
          }));
          setResults([...foundDevices, ...taggedResults]);
        }
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
