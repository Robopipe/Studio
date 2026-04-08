import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { NavLink } from "react-router";

interface NavItemProps {
  label: string;
  icon?: ReactNode;
  to: string;
}

export const NavItem = ({ label, icon, to }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "block cursor-pointer rounded-lg px-3 py-1.5 text-gray-400 transition-all hover:bg-white/5 hover:text-white [&_svg]:size-5",
        isActive && "bg-emerald-500/10 text-emerald-400"
      )
    }
  >
    <div className="flex flex-row items-center gap-2">
      {icon && (
        <span className="flex items-center justify-center text-inherit">
          {icon}
        </span>
      )}
      <span className="text-sm font-medium">{label}</span>
    </div>
  </NavLink>
);
