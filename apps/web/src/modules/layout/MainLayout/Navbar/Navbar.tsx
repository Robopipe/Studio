import { useLogoutMutation } from "@/core/auth/services";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useGetProjectsQuery } from "@/modules/project/services/projectApi";
import { Logo } from "@/modules/ui";
import {
  AddLargeIcon,
  AiPowerIcon,
  AnnotateIcon,
  BoxIcon,
  CameraIcon,
  ChartIcon,
  CloseIcon,
  LogoutIcon,
  RunIcon,
  SearchIcon,
  Stack,
  SupportIcon,
  Text,
} from "@repo/ui";
import clsx from "clsx";
import { ReactNode, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import styles from "./Navbar.module.scss";

export const Navbar = () => {
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  const { data: projects } = useGetProjectsQuery();
  const [activeProject, setActiveProject] = useActiveProject();

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
          <NavDropdown
            label={activeProject?.name ?? "Select a project..."}
            items={
              projects?.map((project) => ({
                label: project.name,
                onClick: () => setActiveProject(project),
              })) ?? []
            }
          />
        </Stack>
      </Stack>

      {/* Center: Navigation Tabs */}
      <Stack direction="row" align="center" gap={4} className={styles.centerStack}>
        <NavItem to="/capture" label="Capture" icon={<CameraIcon />} />
        <NavItem to="/label" label="Label" icon={<AnnotateIcon />} />
        <NavItem to="/train" label="Train" icon={<AiPowerIcon />} />
        <NavItem to="/run" label="Run" icon={<RunIcon />} />
        <NavItem to="/analytics" label="Analytics" icon={<ChartIcon />} />
      </Stack>

      {/* Right: User & Actions */}
      <Stack direction="row" align="center" gap={12} className={styles.right}>
        <div className={styles.userAvatar}>FM</div>
        <button
          className={styles.iconBtn}
          onClick={handleSupport}
          aria-label="Help"
        >
          <SupportIcon />
          <span className={styles.btnText}>Help</span>
        </button>
        <button
          className={styles.iconBtn}
          onClick={handleLogout}
          aria-label="Logout"
        >
          <LogoutIcon />
        </button>
      </Stack>
    </nav>
  );
};

const NavDropdown = ({
  label,
  items = [],
}: {
  label: string;
  items?: { label: string; onClick?: () => void }[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase())
  );

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
          {/* Header with Create and Close */}
          <Stack direction="row" align="center" justify="space-between" className={styles.menuHeader}>
            <Text variant="text-14" weight="600" color='text-white-primary'>PROJECTS</Text>
            <Stack direction="row" align="center" gap={12}>
              <button className={styles.actionBtn} aria-label="Create project">
                <AddLargeIcon /> 
              </button>
              <button className={styles.actionBtn} onClick={() => setIsOpen(false)}>
                <CloseIcon />
              </button>
            </Stack>
          </Stack>

          {/* Search Bar */}
          <div className={styles.searchContainer}>
            <SearchIcon className={styles.searchIcon} />
            <input 
              autoFocus
              className={styles.searchInput}
              placeholder="Search or create projects"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Items List */}
          <div className={styles.itemsList}>
            {filteredItems.map((item) => (
              <div
                key={item.label}
                className={styles.dropdownItem}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
              >
                <Stack direction="row" align="center" gap={10}>
                  <BoxIcon />
                  <Text variant="text-14">{item.label}</Text>
                </Stack>
              </div>
            ))}
          </div>
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
    className={({ isActive }) =>
      clsx(styles.navItem, isActive && styles.active)
    }
  >
    <Stack direction="row" align="center" gap={8}>
      {icon && <span className={styles.navIcon}>{icon}</span>}
      <Text variant="text-14" weight="500">
        {label}
      </Text>
    </Stack>
  </NavLink>
);
