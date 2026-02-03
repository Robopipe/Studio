import { useParams } from "react-router";
import { useGetModelQuery } from "../services";

export const useActiveModel = () => {
  const { projectId = "", modelId = "" } = useParams();
  const model = useGetModelQuery(
    { projectId: parseInt(projectId), modelId: parseInt(modelId) },
    { skip: !isNaN(parseInt(projectId)) || isNaN(parseInt(modelId)) },
  );

  return model;
};
