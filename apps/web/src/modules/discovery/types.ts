export interface DiscoveredDevice {
  url: string;
  host: string;
  port: number;
  source?: "mdns" | "network";
}
