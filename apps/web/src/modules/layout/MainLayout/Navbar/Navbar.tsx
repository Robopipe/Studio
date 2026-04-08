import { useLogoutMutation, useProfileQuery } from "@/core/auth/services";
import { AiPowerIcon, AnnotateIcon } from "@/components/icons";
import { CreateProjectModal } from "@/modules/project/components/CreateProjectModal";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import {
  useGetProjectQuery,
  useGetProjectsQuery,
} from "@/modules/project/services/projectApi";
import { Logo } from "@/modules/ui";
import { Box, Camera, LifeBuoy, LogOut, Play } from "lucide-react";
import { Link, matchPath, useLocation, useNavigate } from "react-router";

import { webConfig } from "@/config/web";
import { useEffect, useState } from "react";
import { NavDropdown } from "./components/NavDropdown";
import { NavItem } from "./components/NavItem";
import { OrgDropdown } from "./components/OrgDropdown";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [logout] = useLogoutMutation();
  const { data: projects } = useGetProjectsQuery();
  const { data: profile } = useProfileQuery();
  const [activeProject, setActiveProject] = useActiveProject();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialName, setCreateModalInitialName] = useState("");

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
      const matchingProject = projects.find(
        (p) => String(p.id) === String(activeId),
      );

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
    <nav className="relative flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-800 bg-[#111114] px-6">
      {/* Left: Logo & Dropdown */}
      <div className="flex flex-row items-center gap-6">
        <div
          className="flex cursor-pointer items-center text-white transition-opacity hover:opacity-80"
          onClick={() => navigate("/")}
        >
          <Logo height={20} width={"100%"} />
        </div>
        {isProjectRoute && (
          <div className="flex flex-row items-center gap-3">
            <div className="mx-1 h-6 w-px bg-gray-700" />
            <NavDropdown
              label={activeProject?.name ?? "Select a project..."}
              title="PROJECTS"
              placeholder="Search or create projects"
              itemIcon={<Box />}
              activeItemId={activeProject?.id}
              createLabel="Create"
              onCreate={(name) => {
                setCreateModalInitialName(name);
                setIsCreateModalOpen(true);
              }}
              items={
                projects?.map((p) => ({
                  id: p.id,
                  label: p.name,
                  onClick: () => {
                    setActiveProject(p);
                    navigate(`/projects/${p.id}/label`);
                  },
                })) ?? []
              }
            />
          </div>
        )}
      </div>

      {/* Center: Tabs */}
      {isProjectRoute && !isLoading && !isError && (
        <div className="absolute left-1/2 flex -translate-x-1/2 flex-row items-center gap-1 whitespace-nowrap">
          <NavItem
            to={`/projects/${activeId}/capture`}
            label="Capture"
            icon={<Camera />}
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
            icon={<Play />}
          />
        </div>
      )}

      {/* Right: Org Switcher & User Actions */}
      <div className="flex flex-row items-center gap-3">
        <OrgDropdown />
        <div className="mx-1 h-6 w-px bg-gray-700" />
        <Link
          to={webConfig.routes.account}
          className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-900"
        >
          {initials}
        </Link>
        <button
          type="button"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-none bg-transparent px-3 py-2 text-gray-400 transition-all hover:bg-white/5 hover:text-white"
          onClick={() =>
            window.open("https://robopipe.gitbook.io/doc", "_blank")
          }
        >
          <LifeBuoy />
          <span className="text-sm font-medium">Help</span>
        </button>
        <button
          type="button"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-none bg-transparent px-3 py-2 text-gray-400 transition-all hover:bg-red-500/10 hover:text-red-400"
          onClick={handleLogout}
        >
          <LogOut />
        </button>
      </div>

      {isCreateModalOpen && (
        <CreateProjectModal
          onClose={() => setIsCreateModalOpen(false)}
          initialName={createModalInitialName}
        />
      )}
    </nav>
  );
};
