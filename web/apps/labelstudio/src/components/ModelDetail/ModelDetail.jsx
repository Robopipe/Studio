import { useCallback, useEffect, useState } from "react";
import { Block, Elem } from "../../utils/bem";
import { Input, Select } from "../Form";
import "./ModelDetail.scss";
import {
  buildClassificationModel,
  loadBackbone,
  loadImage,
  useBackbone,
  useLoadDataset,
  useModel
} from "../../utils/tf";
import { useProject } from "../../providers/ProjectProvider";
import { queryClient, useAPI } from "../../providers/ApiProvider";
import * as tf from "@tensorflow/tfjs";
import { EmptyModelDetail } from "./EmptyModelDetail";
import { Button } from "../Button/Button";
import { ModelStatus } from "./ModelStatus";
import { useMutation } from "@tanstack/react-query";

const TASK_TYPE_MAP = {
  Choices: "Object classification",
  RectangleLabels: "Object detection"
};

export const ModelDetail = props => {
  const { model: propModel, disabled, taskType, onSave } = props;
  const api = useAPI();
  const { project } = useProject();
  const [status, setStatus] = useState({
    statusType: "loading",
    status: "Loading model"
  });
  const [model, setModel] = useState(propModel);
  const [baseModels, setBaseModels] = useState([]);
  const { model: tfModel, trainModel, trained } = useModel({
    baseModel: model?.base_model,
    setStatus,
    disabled
  });

  const saveModelCb = useCallback(async () => {
    setStatus({ statusType: "loading", status: "Saving model" });
    const modelResponse = await api.callApi("createNnModel", {
      body: { name: model.name, base_model: model.base_model },
      params: { pk: project.id }
    });
    const uploadResponse = await tfModel.save(
      tf.io.http(
        `http://localhost:8081/api/nn-models/${modelResponse.id}/upload?base_model=${model.base_model}`
      )
    );
    setStatus({ statusType: "ready", status: "Model ready for deployment" });
    return modelResponse;
  }, [model, tfModel, setStatus]);
  const { mutate: saveModel } = useMutation({
    mutationFn: saveModelCb,
    onSuccess: res => {
      queryClient.invalidateQueries({
        queryKey: ["projects", project.id, "nn-models"]
      });
      onSave?.(res);
    }
  });

  useEffect(() => {
    api.callApi("baseModels").then(setBaseModels);
  }, []);

  useEffect(() => {
    if (disabled)
      setStatus({ statusType: "ready", status: "Model ready for deployment" });
  }, [disabled]);

  if (!model) return <EmptyModelDetail />;

  return (
    <Block name="model-detail">
      <Elem tag="h1" name="heading">
        Model detail
      </Elem>
      <Elem name="container">
        <Elem name="inputs">
          <Elem tag="h2">Settings</Elem>
          <Elem tag="span">
            Task type: {TASK_TYPE_MAP[taskType] ?? "Unknown"}
          </Elem>
          <Input
            label="Name"
            disabled={disabled}
            placeholder={model.name}
            onChange={e =>
              setModel(prev => ({ ...prev, name: e.target.value }))
            }
          />
          <Select
            label="Base model"
            options={baseModels}
            disabled={disabled}
            waiting
            onChange={e =>
              setModel(prev => ({ ...prev, base_model: e.target.value }))
            }
            value={model.base_model}
          />
          <Elem name="actions">
            <Button
              onClick={trainModel}
              disabled={disabled || trained || status.statusType !== "ready"}
            >
              Train
            </Button>
            <Button
              primary
              disabled={disabled || !trained || status.statusType !== "ready"}
              onClick={saveModel}
            >
              Save
            </Button>
            <Button
              look="danger"
              disabled={disabled || !trained || status.statusType !== "ready"}
            >
              Reset
            </Button>
          </Elem>
        </Elem>
        <Elem name="status">
          <Elem tag="h2">Status</Elem>
          <ModelStatus {...status} />
        </Elem>
      </Elem>
      <Elem name="logs">
        <h2>Logs:</h2>
        {/* <pre>{JSON.stringify(trainingLogs, null, 2)}</pre> */}
      </Elem>
    </Block>
  );
};
