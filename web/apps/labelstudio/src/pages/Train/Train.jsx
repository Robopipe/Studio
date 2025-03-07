import { useCallback, useEffect, useMemo, useState } from "react";
import { load } from "@tensorflow-models/mobilenet";
import { absoluteURL } from "../../utils/helpers";
import { useProject } from "../../providers/ProjectProvider";
import { useAPI } from "../../providers/ApiProvider";
import { Block, Elem } from "../../utils/bem";
import "./Train.scss";
import { ModelDetail } from "../../components/ModelDetail/ModelDetail";
import { ModelCard } from "../../components/ModelCard/ModelCard";
import { Button, Spinner } from "../../components";
import { useQuery } from "@tanstack/react-query";
import { Oneof } from "../../components/Oneof/Oneof";
import { useLabelConfig } from "../../utils/label-config";

export const TrainPage = () => {
  const api = useAPI();
  const { project } = useProject();
  const { taskType } = useLabelConfig();
  const { data: fetchedModels, status: modelsStatus } = useQuery({
    queryKey: ["projects", project.id, "nn-models"],
    queryFn: () => api.callApi("nnModels", { params: { pk: project.id } }),
    enabled: !!project?.id,
    networkMode: "offlineFirst"
  });
  const [selectedModel, setSelectedModel] = useState(null);
  const models = useMemo(
    () => [
      ...(selectedModel && !selectedModel.id ? [selectedModel] : []),
      ...(fetchedModels ?? [])
    ],
    [fetchedModels, selectedModel]
  );

  const createNewModel = useCallback(() => {
    const DEFAULT_MODEL = {
      id: null,
      name: "",
      updated_at: new Date().toString(),
      base_model: taskType === "classification" ? "mobilenet_v3" : "yolov8n"
    };

    setSelectedModel(DEFAULT_MODEL);
  }, [setSelectedModel, taskType]);

  const switchModel = useCallback(
    newModel => {
      if (selectedModel !== null && selectedModel.id === null) return;

      setSelectedModel(newModel);
    },
    [selectedModel, setSelectedModel]
  );

  const renderModelCard = useCallback(
    (model, i, arr) => {
      const isDisabled =
        selectedModel !== null &&
        selectedModel.id === null &&
        model.id !== null;
      const badges = [{ text: `v${arr.length - i}` }];

      if (model.id === null)
        badges.push({
          text: "Unsaved",
          mod: { danger: true }
        });

      if (i === 0)
        badges.push({
          text: "Latest",
          mod: { success: true }
        });

      return (
        <ModelCard
          key={model.id ?? "new-model"}
          model={model}
          mod={{
            active: model.id === selectedModel?.id,
            disabled: isDisabled
          }}
          onClick={() => switchModel(model)}
          badges={badges}
        />
      );
    },
    [selectedModel, switchModel]
  );

  useEffect(() => {
    setSelectedModel(null);
  }, [project]);

  return (
    <Block name="train">
      <Block name="list-sidebar">
        <Elem name="title">Versions</Elem>
        <Oneof value={modelsStatus}>
          <Elem name="loading" case="loading">
            <Spinner />
          </Elem>
          <Elem name="model-list" case="success">
            <Button
              disabled={selectedModel !== null && !selectedModel.id}
              onClick={createNewModel}
              className="create-new-btn"
            >
              Create new version
            </Button>
            {models.map(renderModelCard)}
          </Elem>
        </Oneof>
      </Block>
      <Elem name="main">
        <ModelDetail
          key={selectedModel?.id}
          model={selectedModel}
          disabled={selectedModel?.id !== null}
          taskType={taskType}
          onSave={setSelectedModel}
        />
      </Elem>
    </Block>
  );
};

TrainPage.title = "Train";
TrainPage.path = "/train";
TrainPage.exact = true;
