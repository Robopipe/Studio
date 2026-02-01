import { ReactNode } from "react";
import { NavLink } from "react-router";
import { Stack, Text } from "@repo/ui";
import clsx from "clsx";
import styles from "./NavItem.module.scss";

interface NavItemProps {
  label: string;
  icon?: ReactNode;
  to: string;
}

export const NavItem = ({ label, icon, to }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
  >
    <Stack direction="row" align="center" gap={8}>
      {icon && <span className={styles.navIcon}>{icon}</span>}
      <Text variant="text-14" weight="500">{label}</Text>
    </Stack>
  </NavLink>
);