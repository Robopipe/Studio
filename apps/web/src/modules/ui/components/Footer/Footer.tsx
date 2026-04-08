import { cn } from "@/lib/utils";

export interface FooterProps {
  variant: "light" | "dark";
}

export const Footer = ({ variant }: FooterProps) => {
  const textColor =
    variant === "light" ? "text-muted-foreground" : "text-white/60";

  return (
    <footer className="mt-auto flex flex-row justify-center gap-3">
      <span className={cn("text-xs", textColor)}>Powered by Robopipe</span>
      <span className={cn("text-xs", textColor)}>|</span>
      <span className={cn("text-xs", textColor)}>© All rights reserved</span>
    </footer>
  );
};
