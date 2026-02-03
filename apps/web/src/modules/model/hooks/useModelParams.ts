import { useParams } from "react-router";

export const useModelParams = () => {
  const { projectId, modelId } = useParams();

  const parsedProjectId = Number(projectId);
  const parsedModelId = Number(modelId);
  if (isNaN(parsedProjectId) || isNaN(parsedModelId)) {
    throw new Error("Invalid projectId or modelId in URL parameters");
  }

  return {
    projectId: parsedProjectId,
    modelId: parsedModelId,
  };
};
