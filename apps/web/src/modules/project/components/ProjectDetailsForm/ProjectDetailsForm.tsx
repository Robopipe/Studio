import { Heading, TextArea, TextInput } from "@repo/ui";
import styles from "./ProjectDetailsForm.module.scss";

interface ProjectDetailsFormProps {
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
}

export const ProjectDetailsForm = ({
  name,
  setName,
  description,
  setDescription,
}: ProjectDetailsFormProps) => {
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
      </div>
    </div>
  );
};