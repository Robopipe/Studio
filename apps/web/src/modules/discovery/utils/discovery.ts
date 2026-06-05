import { DiscoveredDevice } from "../types";

const ROBOPIPE_RESPONSE = "Hello from Robopipe API!";

export async function probeRobopipeApi(
  url: string,
  timeoutMs = 2000,
  signal?: AbortSignal,
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return false;

    const text = await response.text();
    return text.includes(ROBOPIPE_RESPONSE);
  } catch {
    return false;
  }
}

export function ipToNumber(ip: string): number {
  const parts = ip.split(".").map(Number);
  return (
    ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
  );
}

export function numberToIp(n: number): string {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ].join(".");
}

const MAX_IP_RANGE = Infinity;

export function parseCidr(cidr: string): { startIp: string; endIp: string } {
  const parts = cidr.split("/");
  if (parts.length !== 2) {
    throw new Error("Invalid CIDR notation. Expected format: 192.168.1.0/24");
  }

  const [ip, prefixStr] = parts;
  if (!isValidIpv4(ip)) {
    throw new Error("Invalid IP address in CIDR notation");
  }

  const prefix = Number(prefixStr);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new Error("CIDR prefix must be between 0 and 32");
  }

  const ipNum = ipToNumber(ip);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | ~mask) >>> 0;

  // Skip network and broadcast addresses for prefixes <= 30
  const start = prefix <= 30 ? network + 1 : network;
  const end = prefix <= 30 ? broadcast - 1 : broadcast;

  return { startIp: numberToIp(start), endIp: numberToIp(end) };
}

export function generateIpRange(startIp: string, endIp: string): string[] {
  const start = ipToNumber(startIp);
  const end = ipToNumber(endIp);

  if (end < start) {
    throw new Error("End IP must be greater than or equal to start IP");
  }

  const count = end - start + 1;
  if (count > MAX_IP_RANGE) {
    throw new Error(`IP range too large (max ${MAX_IP_RANGE} addresses)`);
  }

  const ips: string[] = [];
  for (let i = start; i <= end; i++) {
    ips.push(numberToIp(i));
  }
  return ips;
}

export function isValidIpv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = Number(part);
    return (
      Number.isInteger(num) && num >= 0 && num <= 255 && part === String(num)
    );
  });
}

export function parsePorts(input: string): number[] {
  const trimmed = input.trim();

  if (trimmed.includes("-")) {
    const [startStr, endStr] = trimmed.split("-");
    const start = Number(startStr);
    const end = Number(endStr);
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 1 ||
      end > 65535 ||
      start > end
    ) {
      throw new Error("Invalid port range. Expected format: 8080-8090");
    }
    if (end - start + 1 > 100) {
      throw new Error("Port range too large (max 100 ports)");
    }
    const ports: number[] = [];
    for (let p = start; p <= end; p++) ports.push(p);
    return ports;
  }

  const port = Number(trimmed);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Port must be between 1 and 65535");
  }
  return [port];
}

interface ScanTarget {
  ip: string;
  port: number;
}

export async function scanNetwork(
  ips: string[],
  ports: number[],
  concurrency: number,
  signal: AbortSignal,
  onProgress: (scanned: number) => void,
): Promise<DiscoveredDevice[]> {
  const targets: ScanTarget[] = [];
  for (const ip of ips) {
    for (const port of ports) {
      targets.push({ ip, port });
    }
  }

  const results: DiscoveredDevice[] = [];
  let scanned = 0;

  for (let i = 0; i < targets.length; i += concurrency) {
    if (signal.aborted) break;

    const batch = targets.slice(i, i + concurrency);
    const promises = batch.map(async ({ ip, port }) => {
      const url = `http://${ip}:${port}`;
      const found = await probeRobopipeApi(url, 2000, signal);
      scanned++;
      onProgress(scanned);
      if (found) {
        results.push({ url, host: ip, port });
      }
    });

    await Promise.allSettled(promises);
  }

  return results;
}
