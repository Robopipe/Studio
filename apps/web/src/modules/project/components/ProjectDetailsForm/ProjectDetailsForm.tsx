import { useAuth } from "@/core/auth/hooks";
import { ProjectTypeEnum } from "@repo/schema";
import { Heading, Select, TextArea, TextInput } from "@repo/ui";
import styles from "./ProjectDetailsForm.module.scss";

interface ProjectDetailsFormProps {
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  cameraApiUrl: string | null;
  setCameraApiUrl: (val: string) => void;
  projectType: ProjectTypeEnum;
  setProjectType?: (val: ProjectTypeEnum) => void;
}

export const ProjectDetailsForm = ({
  name,
  setName,
  description,
  setDescription,
  cameraApiUrl,
  setCameraApiUrl,
  projectType,
  setProjectType,
}: ProjectDetailsFormProps) => {
  const { user } = useAuth();

  return (
    <div className={styles.formSection}>
      <Heading variant="h5" weight="600">
        Projects Details
      </Heading>

      <div className={styles.formFields}>
        <TextInput
          label="Project name"
          boldLabel={true}
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <TextArea
          label="Project description"
          boldLabel={true}
          placeholder="Project description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Select<ProjectTypeEnum>
          items={Object.entries(ProjectTypeEnum).map(([key]) => ({
            label: key.charAt(0) + key.slice(1).toLowerCase(),
            value: key,
          }))}
          placeholder="Select project type"
          value={projectType}
          onValueChange={(val) => setProjectType?.(val as ProjectTypeEnum)}
          disabled={!setProjectType}
        />

        <TextInput
          label="Camera API URL"
          boldLabel={true}
          placeholder={`${user?.cameraApiUrl} (inherited from account settings)`}
          value={cameraApiUrl ?? ""}
          onChange={(e) => setCameraApiUrl(e.target.value)}
        />
      </div>
    </div>
  );
};
