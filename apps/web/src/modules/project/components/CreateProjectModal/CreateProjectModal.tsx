import { useState } from "react";
import { Button } from '@repo/ui';
import { Modal, ModalTab } from '../Modal';
import { ProjectDetailsForm } from '../ProjectDetailsForm';
import { useCreateProjectMutation } from "../../services/projectApi";

export const CreateProjectModal = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  const [createProject, { isLoading }] = useCreateProjectMutation();

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await createProject({
        name,
        description,
        // type: ProjectTypeEnum.SEGMENTATION,
        // @ts-ignore
        type: "SEGMENTATION",
      }).unwrap();
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
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
        />
      ) 
    },
    { 
      id: "labeling", 
      label: "Labeling Setup", 
      content: <div>Labeling logic here...</div> 
    },
  ];

  const buttons = (
    <>
      <Button variant="danger" size="md" onClick={onClose} disabled={isLoading}>
        Delete
      </Button>
      <Button 
        variant="filled" 
        size="md" 
        onClick={handleSave} 
        disabled={isLoading}
      >
        {isLoading ? "Saving..." : "Save"}
      </Button>
    </>
  );

  return (
    <Modal 
      title="Create Project" 
      tabs={tabs} 
      buttons={buttons} 
      closeButton={false}
      onClose={onClose} 
    />
  );
};