import { useAuth } from "@/core/auth/hooks";
import { useAppDispatch } from "@/hooks/redux";
import { Button } from "@/modules/shadcn/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { validateCameraApiUrl } from "../../utils/validateCameraApiUrl";
import {
  useCreateProjectLabelMutation,
  useCreateProjectMutation,
} from "../../services/projectApi";
import { setCameraApiOverride } from "../../services/cameraApiOverrideSlice";
import { LabelingSetup, LocalLabel } from "../LabelingSetup/LabelingSetup";
import { Modal, ModalTab } from "../Modal";
import { ProjectDetailsForm } from "../ProjectDetailsForm";

interface CreateProjectModalProps {
  onClose: () => void;
  initialName?: string;
}

export const CreateProjectModal = ({
  onClose,
  initialName,
}: CreateProjectModalProps) => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const [name, setName] = useState(initialName ?? "");
  const [description, setDescription] = useState("");
  const [cameraApiUrl, setCameraApiUrl] = useState<string | null>(null);
  const [cameraApiUrlError, setCameraApiUrlError] = useState<string | null>(null);
  const [localOverride, setLocalOverride] = useState<string>("");
  const [localOverrideError, setLocalOverrideError] = useState<string | null>(null);
  const [localLabels, setLocalLabels] = useState<LocalLabel[]>([]);

  const [createProject, { isLoading: isCreatingProject }] =
    useCreateProjectMutation();
  const [createLabel] = useCreateProjectLabelMutation();

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

    try {
      const project = await createProject({
        name,
        description,
        cameraApiUrl: normalizedUrl,
      }).unwrap();

      const trimmed = localOverride.trim();
      if (user) {
        dispatch(
          setCameraApiOverride({ userId: user.id, projectId: project.id, value: trimmed || null }),
        );
      }

      if (localLabels.length > 0) {
        await Promise.all(
          localLabels.map((label) =>
            createLabel({
              projectId: project.id,
              name: label.name,
              color: label.color,
            }).unwrap(),
          ),
        );
      }

      onClose();
    } catch (error) {
      console.error("Project creation failed:", error);
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
      toast.error(message ?? "Failed to create project");
    }
  };

  const handleAddLocalLabel = (label: LocalLabel) => {
    setLocalLabels((prev) => [...prev, label]);
  };

  const handleRemoveLocalLabel = (labelName: string) => {
    setLocalLabels((prev) => prev.filter((l) => l.name !== labelName));
  };

  const handleUpdateLocalLabelColor = (labelName: string, color: string) => {
    setLocalLabels((prev) =>
      prev.map((l) => (l.name === labelName ? { ...l, color } : l)),
    );
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
          localOverride={localOverride}
          setLocalOverride={handleLocalOverrideChange}
          localOverrideError={localOverrideError}
          onLocalOverrideBlur={handleLocalOverrideBlur}
        />
      ),
    },
    {
      id: "labeling",
      label: "Labeling Setup",
      content: (
        <LabelingSetup
          labels={localLabels}
          onAddLabel={handleAddLocalLabel}
          onRemoveLabel={handleRemoveLocalLabel}
          onUpdateLabelColor={handleUpdateLocalLabelColor}
        />
      ),
    },
  ];

  const buttons = (
    <div className="flex flex-row gap-3">
      <Button
        variant="destructive"
        size="sm"
        onClick={onClose}
        disabled={isCreatingProject}
      >
        Delete
      </Button>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={
          isCreatingProject ||
          !name.trim() ||
          !!cameraApiUrlError ||
          !!localOverrideError
        }
      >
        {isCreatingProject ? "Saving..." : "Save"}
      </Button>
    </div>
  );

  return (
    <Modal
      title="Create Project"
      tabs={tabs}
      closeButton={false}
      buttons={buttons}
      onClose={onClose}
    />
  );
};
