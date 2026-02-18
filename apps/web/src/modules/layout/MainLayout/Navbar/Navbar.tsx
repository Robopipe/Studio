import { useLogoutMutation, useProfileQuery } from "@/core/auth/services";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import {
  useGetProjectQuery,
  useGetProjectsQuery,
} from "@/modules/project/services/projectApi";
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
} from "@repo/ui";
import { Link, matchPath, useLocation, useNavigate } from "react-router";

import { useEffect } from "react";
import styles from "./Navbar.module.scss";
import { NavDropdown } from "./components/NavDropdown";
import { NavItem } from "./components/NavItem";
import { webConfig } from "@/config/web";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [logout] = useLogoutMutation();
  const { data: projects } = useGetProjectsQuery();
  const { data: profile } = useProfileQuery();
  const [activeProject, setActiveProject] = useActiveProject();

  const match = matchPath(
    { path: "/projects/:projectId/*" },
    location.pathname,
  );
  const activeId = match?.params.projectId;
  const isProjectRoute = !!activeId;
  const projectIdMalformed =
    !activeId || activeId === "undefined" || isNaN(Number(activeId));

  const { isError, isLoading } = useGetProjectQuery(
    { projectId: Number(activeId) },
    { skip: projectIdMalformed },
  );

  useEffect(() => {
    if (isProjectRoute) {
      if (projectIdMalformed || (isError && !isLoading)) {
        console.warn(
          `Project validation failed for ID: ${activeId}. Redirecting...`,
        );
        navigate("/", { replace: true });
      }
    }
  }, [isProjectRoute, activeId, isError, isLoading, navigate]);

  useEffect(() => {
  if (activeId && projects) {
    const matchingProject = projects.find((p) => String(p.id) === String(activeId));
    
    if (matchingProject && matchingProject.id !== activeProject?.id) {
      setActiveProject(matchingProject);
    }
  }
}, [activeId, projects, setActiveProject, activeProject?.id]);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/login");
    } catch (error) {
      navigate("/login");
    }
  };

  const initials = profile
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "";

  return (
    <nav className={styles.navbar}>
      {/* Left: Logo & Dropdown */}
      <Stack direction="row" align="center" gap={24}>
        <div className={styles.logoWrapper} onClick={() => navigate("/")}>
          <Logo height={20} width={"100%"} />
        </div>
        {isProjectRoute && (
          <Stack direction="row" align="center" gap={12}>
            <div className={styles.divider} />
            <NavDropdown
              label={activeProject?.name ?? "Select a project..."}
              items={
                projects?.map((p) => ({
                  label: p.name,
                  onClick: () => {
                    setActiveProject(p);
                    navigate(`/projects/${p.id}/label`);
                  },
                })) ?? []
              }
            />
          </Stack>
        )}
      </Stack>

      {/* Center: Tabs */}
      {isProjectRoute && !isLoading && !isError && (
        <Stack
          direction="row"
          align="center"
          gap={4}
          className={styles.centerStack}
        >
          <NavItem
            to={`/projects/${activeId}/capture`}
            label="Capture"
            icon={<CameraIcon />}
          />
          <NavItem
            to={`/projects/${activeId}/label`}
            label="Label"
            icon={<AnnotateIcon />}
          />
          <NavItem
            to={`/projects/${activeId}/models`}
            label="Train"
            icon={<AiPowerIcon />}
          />
          <NavItem
            to={`/projects/${activeId}/run`}
            label="Run"
            icon={<RunIcon />}
          />
          <NavItem
            to={`/projects/${activeId}/analytics`}
            label="Analytics"
            icon={<ChartIcon />}
          />
        </Stack>
      )}

      {/* Right: User Actions */}
      <Stack direction="row" align="center" gap={12} className={styles.right}>
        <Link to={webConfig.routes.account} className={styles.userAvatar}>{initials}</Link>
        <button
          className={styles.iconBtn}
          onClick={() => window.open("https://robopipe.gitbook.io/doc", "_blank")}
        >
          <SupportIcon />
          <span className={styles.btnText}>Help</span>
        </button>
        <button className={styles.iconBtn} onClick={handleLogout}>
          <LogoutIcon />
        </button>
      </Stack>
    </nav>
  );
};
