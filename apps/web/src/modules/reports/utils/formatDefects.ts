import type { ViolatedLimit } from "@/core/cameraApi/schemas/events";

export function formatDefect(limit: ViolatedLimit): string {
  return `${limit.limit_name} [${limit.display_id ?? "-"}, ${limit.parent_display_id ?? "-"}]`;
}

export function formatDefects(limits: ViolatedLimit[]): string {
  return limits.map(formatDefect).join("; ");
}
