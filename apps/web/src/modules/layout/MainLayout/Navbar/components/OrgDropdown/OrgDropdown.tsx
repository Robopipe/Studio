import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  useCreateOrganizationMutation,
  useListOrganizationsQuery,
  useSwitchOrganizationMutation,
} from "@/core/auth/services";
import { cameraApi } from "@/core/cameraApi";
import { captureApi } from "@/modules/capture/services/captureApi";
import { dashboardConfigApi } from "@/modules/dashboard/services";
import { modelApi } from "@/modules/model/services";
import { projectApi } from "@/modules/project/services/projectApi";
import { organizationApi } from "@/modules/account/services";
import { appConfig } from "@/config";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { NavDropdown } from "../NavDropdown";

export const OrgDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { organization } = useAuth();
  const { data: organizations } = useListOrganizationsQuery();
  const [switchOrganization] = useSwitchOrganizationMutation();
  const [createOrganization] = useCreateOrganizationMutation();

  const handleSwitch = async (organizationId: number) => {
    if (organizationId === organization?.id) return;
    try {
      await switchOrganization({ organizationId }).unwrap();
      // Reset all org-scoped API caches
      dispatch(projectApi.util.resetApiState());
      dispatch(organizationApi.util.resetApiState());
      dispatch(modelApi.util.resetApiState());
      dispatch(captureApi.util.resetApiState());
      dispatch(cameraApi.util.resetApiState());
      dispatch(dashboardConfigApi.util.resetApiState());
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Failed to switch organization:", error);
    }
  };

  const handleCreate = async (name: string) => {
    try {
      const newOrg = await createOrganization({ name }).unwrap();
      await handleSwitch(newOrg.id);
    } catch (error) {
      console.error("Failed to create organization:", error);
    }
  };

  return (
    <NavDropdown
      label={organization?.name ?? "Select organization..."}
      title="ORGANIZATIONS"
      placeholder="Search or create organizations"
      activeItemId={organization?.id}
      onSettingsClick={() => navigate(appConfig.web.routes.main.organization)}
      createLabel="Create"
      onCreate={handleCreate}
      align="right"
      maxLabelWidth={150}
      items={
        organizations?.map((org) => ({
          id: org.id,
          label: org.name,
          onClick: () => handleSwitch(org.id),
        })) ?? []
      }
    />
  );
};
