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
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function numberToIp(n: number): string {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ].join(".");
}

const MAX_IP_RANGE = 1024;

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
    return Number.isInteger(num) && num >= 0 && num <= 255 && part === String(num);
  });
}

export async function scanIpRange(
  ips: string[],
  port: number,
  concurrency: number,
  signal: AbortSignal,
  onProgress: (scanned: number) => void,
): Promise<DiscoveredDevice[]> {
  const results: DiscoveredDevice[] = [];
  let scanned = 0;

  for (let i = 0; i < ips.length; i += concurrency) {
    if (signal.aborted) break;

    const batch = ips.slice(i, i + concurrency);
    const promises = batch.map(async (ip) => {
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
