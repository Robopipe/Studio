import { Badge } from "@/modules/shadcn/ui/badge";

interface PassedBadgeProps {
  passed: boolean;
}

export const PassedBadge = ({ passed }: PassedBadgeProps) => (
  <Badge
    variant={passed ? "secondary" : "destructive"}
    className={passed ? "bg-emerald-500/10 text-emerald-700" : undefined}
  >
    {passed ? "Passed" : "Failed"}
  </Badge>
);
