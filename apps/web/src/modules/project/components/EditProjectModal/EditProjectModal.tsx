import { cameraApi } from "@/core/cameraApi";
import { useAppDispatch } from "@/hooks/redux";
import { Button } from "@/modules/shadcn/ui/button";
import { Project } from "@repo/schema";
import { useState } from "react";
import { toast } from "sonner";
import { validateCameraApiUrl } from "../../utils/validateCameraApiUrl";
import {
  useCreateProjectLabelMutation,
  useGetProjectLabelsQuery,
  useUpdateProjectLabelMutation,
  useUpdateProjectMutation,
} from "../../services/projectApi";
import { LabelingSetup, LocalLabel } from "../LabelingSetup";
import { Modal, ModalTab } from "../Modal";
import { ProjectDetailsForm } from "../ProjectDetailsForm";

interface EditProjectModalProps {
  project: Project;
  initialTabId?: string;
  onClose: () => void;
}

export const EditProjectModal = ({
  project,
  initialTabId,
  onClose,
}: EditProjectModalProps) => {
  const dispatch = useAppDispatch();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [cameraApiUrl, setCameraApiUrl] = useState<string | null>(
    project.cameraApiUrl,
  );
  const [cameraApiUrlError, setCameraApiUrlError] = useState<string | null>(null);
  const [selectedCameraMxid, setSelectedCameraMxid] = useState<string | null>(
    project.cameraMxid,
  );

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

  const handleSave = async () => {
    if (!name.trim()) return;

    const urlError = validateCameraApiUrl(cameraApiUrl);
    if (urlError) {
      setCameraApiUrlError(urlError);
      return;
    }

    const normalizedUrl = (cameraApiUrl ?? "").trim() || null;

    try {
      await updateProject({
        projectId: project.id,
        name,
        description,
        cameraApiUrl: normalizedUrl,
        cameraMxid: selectedCameraMxid,
      }).unwrap();

      // Eagerly reset cameraApi when the project URL changes so any in-flight
      // request against the old URL is aborted before the project list refetches.
      if (cameraApiUrl !== project.cameraApiUrl) {
        dispatch(cameraApi.util.resetApiState());
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
        disabled={isUpdating || !name.trim() || !!cameraApiUrlError}
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
