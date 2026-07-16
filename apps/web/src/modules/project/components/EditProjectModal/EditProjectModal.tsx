import { useAuth } from "@/core/auth/hooks";
import { cameraApi } from "@/core/cameraApi";
import { useAppDispatch } from "@/hooks/redux";
import { setCamera } from "@/modules/camera-selection/services/cameraSelectionSlice";
import { readCameraSelection } from "@/modules/camera-selection/utils/cameraSelectionStorage";
import { Button } from "@/modules/shadcn/ui/button";
import { Project } from "@repo/schema";
import { useState } from "react";
import { toast } from "sonner";
import { validateCameraApiUrl } from "../../utils/validateCameraApiUrl";
import { setCameraApiOverride } from "../../services/cameraApiOverrideSlice";
import {
  useCreateProjectLabelMutation,
  useGetProjectLabelsQuery,
  useUpdateProjectLabelMutation,
  useUpdateProjectMutation,
} from "../../services/projectApi";
import { readCameraApiOverride } from "../../utils/cameraApiOverride";
import { LabelingSetup, LocalLabel } from "../LabelingSetup";
import { Modal, ModalTab } from "../Modal";
import { ProjectDetailsForm } from "../ProjectDetailsForm";

interface EditProjectModalProps {
  project: Project;
  initialTabId?: string;
  /**
   * Guard invoked before applying a CHANGED camera on save. Resolving false
   * aborts the whole save (modal stays open, nothing applied). Used by the
   * Capture page to confirm stopping an active recording/interval capture.
   */
  confirmCameraChange?: () => Promise<boolean>;
  onClose: () => void;
}

export const EditProjectModal = ({
  project,
  initialTabId,
  confirmCameraChange,
  onClose,
}: EditProjectModalProps) => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [cameraApiUrl, setCameraApiUrl] = useState<string | null>(
    project.cameraApiUrl,
  );
  const [cameraApiUrlError, setCameraApiUrlError] = useState<string | null>(null);
  const [localOverride, setLocalOverride] = useState<string>(
    () => readCameraApiOverride(user?.id, project.id) ?? "",
  );
  const [localOverrideError, setLocalOverrideError] = useState<string | null>(null);
  const [multipleDashboardConfigs] = useState(project.multipleDashboardConfigs);
  // Read from storage, not the slice — this modal also opens for non-active
  // projects (ProjectCard) whose slice entry was never hydrated.
  const [initialCameraMxid] = useState<string | null>(
    () => readCameraSelection(user?.id, project.id)?.cameraMxid ?? null,
  );
  const [selectedCameraMxid, setSelectedCameraMxid] =
    useState<string | null>(initialCameraMxid);

  const { data: existingLabels } = useGetProjectLabelsQuery({
    projectId: project.id,
  });

  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [createLabel] = useCreateProjectLabelMutation();
  const [updateLabel] = useUpdateProjectLabelMutation();

  const handleCameraApiUrlChange = (val: string) => {
    setCameraApiUrl(val);
    if (cameraApiUrlError) setCameraApiUrlError(validateCameraApiUrl(val));
  };

  const handleCameraApiUrlBlur = () => {
    setCameraApiUrlError(validateCameraApiUrl(cameraApiUrl));
  };

  const handleLocalOverrideChange = (val: string) => {
    setLocalOverride(val);
    if (localOverrideError) setLocalOverrideError(validateCameraApiUrl(val));
  };

  const handleLocalOverrideBlur = () => {
    setLocalOverrideError(validateCameraApiUrl(localOverride));
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    const urlError = validateCameraApiUrl(cameraApiUrl);
    const overrideError = validateCameraApiUrl(localOverride);
    if (urlError) setCameraApiUrlError(urlError);
    if (overrideError) setLocalOverrideError(overrideError);
    if (urlError || overrideError) return;

    const normalizedUrl = (cameraApiUrl ?? "").trim() || null;

    // Guard before any mutation: on Capture, switching camera mid-recording
    // must be confirmed (StopCaptureDialog). Declining aborts the whole save.
    const cameraChanged = selectedCameraMxid !== initialCameraMxid;
    if (cameraChanged && confirmCameraChange && !(await confirmCameraChange())) {
      return;
    }

    try {
      await updateProject({
        projectId: project.id,
        name,
        description,
        cameraApiUrl: normalizedUrl,
        multipleDashboardConfigs,
      }).unwrap();

      if (user) {
        const trimmed = localOverride.trim();
        dispatch(
          setCameraApiOverride({
            userId: user.id,
            projectId: project.id,
            value: trimmed || null,
          }),
        );
      }

      // Eagerly reset cameraApi when the project URL changes so any in-flight
      // request against the old URL is aborted before the project list refetches.
      if (cameraApiUrl !== project.cameraApiUrl) {
        dispatch(cameraApi.util.resetApiState());
      }

      // Only on a real change — setCamera clears streamName by design and the
      // stream auto-pick then re-picks for the new camera.
      if (cameraChanged && user) {
        dispatch(
          setCamera({
            userId: user.id,
            projectId: project.id,
            cameraMxid: selectedCameraMxid,
          }),
        );
      }

      onClose();
    } catch (error) {
      console.error("Update failed:", error);
      const message =
        error != null &&
        typeof error === "object" &&
        "data" in error &&
        error.data != null &&
        typeof error.data === "object" &&
        "message" in error.data &&
        typeof (error.data as { message: unknown }).message === "string"
          ? (error.data as { message: string }).message
          : undefined;
      toast.error(message ?? "Failed to update project");
    }
  };

  const tabs: ModalTab[] = [
    {
      id: "details",
      label: "Projects Details",
      content: (
        <ProjectDetailsForm
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          cameraApiUrl={cameraApiUrl}
          setCameraApiUrl={handleCameraApiUrlChange}
          cameraApiUrlError={cameraApiUrlError}
          onCameraApiUrlBlur={handleCameraApiUrlBlur}
          selectedCameraMxid={selectedCameraMxid}
          setSelectedCameraMxid={setSelectedCameraMxid}
          localOverride={localOverride}
          setLocalOverride={handleLocalOverrideChange}
          localOverrideError={localOverrideError}
          onLocalOverrideBlur={handleLocalOverrideBlur}
          multipleDashboardConfigs={multipleDashboardConfigs}
        />
      ),
    },
    {
      id: "labeling",
      label: "Labeling Setup",
      content: (
        <LabelingSetup
          labels={(existingLabels || []) as LocalLabel[]}
          onAddLabel={(label) =>
            createLabel({ projectId: project.id, ...label })
          }
          onUpdateLabelColor={(labelName, color) => {
            const target = existingLabels?.find((l) => l.name === labelName);
            if (target) {
              updateLabel({
                projectId: project.id,
                labelId: target.id,
                name: target.name,
                color,
              });
            }
          }}
        />
      ),
    },
  ];

  const buttons = (
    <div className="flex flex-row gap-3">
      <Button variant="destructive" size="sm" onClick={onClose}>
        Cancel
      </Button>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={
          isUpdating ||
          !name.trim() ||
          !!cameraApiUrlError ||
          !!localOverrideError
        }
      >
        {isUpdating ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );

  return (
    <Modal
      title="Edit Project"
      tabs={tabs}
      closeButton={false}
      buttons={buttons}
      initialTabId={initialTabId}
      onClose={onClose}
    />
  );
};
