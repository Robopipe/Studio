import { useLogoutMutation } from "@/core/auth/services";
import { Logo } from "@/modules/ui";
import {
  AiPowerIcon,
  AnnotateIcon,
  CameraIcon,
  ChartIcon,
  LogoutIcon,
  RunIcon,
  Stack,
  SupportIcon,
  Text,
} from "@repo/ui";
import clsx from "clsx";
import { ReactNode } from "react";
import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router";
import styles from "./Navbar.module.scss";

export const Navbar = () => {
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/login");
    }
  };

  const handleSupport = () => {
    window.open("https://docs.robopipe.ai", "_blank");
  };

  return (
    <nav className={styles.navbar}>
      {/* Left: Home + Projects Dropdown */}
      <Stack direction="row" align="center" gap={24}>
        <div className={styles.logoWrapper} onClick={() => navigate("/")}>
          <Logo height={20} width={"100%"} />
        </div>
        <Stack direction="row" align="center" gap={12}>
          <div className={styles.divider} />
          <NavDropdown label="Production Sandwich" />
        </Stack>
      </Stack>

      {/* Center: Navigation Tabs */}
      <Stack direction="row" align="center" gap={4}>
        <NavItem to="/capture" label="Capture" icon={<CameraIcon />} />
        <NavItem to="/label" label="Label" icon={<AnnotateIcon />} />
        <NavItem to="/train" label="Train" icon={<AiPowerIcon />} />
        <NavItem to="/run" label="Run" icon={<RunIcon />} />
        <NavItem to="/analytics" label="Analytics" icon={<ChartIcon />} />
      </Stack>

      {/* Right: User & Actions */}
      <Stack direction="row" align="center" gap={12} className={styles.right}>
        <div className={styles.userAvatar}>FM</div>
        <button className={styles.iconBtn} onClick={handleSupport} aria-label="Help">
          <SupportIcon />
          <span className={styles.btnText}>Help</span>
        </button>
        <button className={styles.iconBtn} onClick={handleLogout} aria-label="Logout">
          <LogoutIcon />
        </button>
      </Stack>
    </nav>
  );
};



const NavDropdown = ({ label, items = ["Project 1", "Project 2"] }: { label: string, items?: string[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <div 
        className={clsx(styles.navDropdown, isOpen && styles.active)} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <Stack direction="row" align="center" gap={8}>
          <Text variant="text-14" weight="500" color="text-white-primary">
            {label}
          </Text>
          <span className={clsx(styles.chevron, isOpen && styles.open)} />
        </Stack>
      </div>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {items.map((item, index) => (
            <div key={index} className={styles.dropdownItem} onClick={() => setIsOpen(false)}>
              <Text variant="text-14">{item}</Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface NavItemProps {
  label: string;
  icon?: ReactNode;
  to: string;
}

const NavItem = ({ label, icon, to }: NavItemProps) => (
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
