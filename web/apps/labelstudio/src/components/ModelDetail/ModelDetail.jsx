import { useCallback, useEffect, useState } from "react";
import { Block, Elem } from "../../utils/bem";
import { Input, Select } from "../Form";
import "./ModelDetail.scss";
import {
  buildClassificationModel,
  loadBackbone,
  loadImage,
  useLoadDataset
} from "../../utils/tf";
import { useProject } from "../../providers/ProjectProvider";
import { useAPI } from "../../providers/ApiProvider";
import * as tf from "@tensorflow/tfjs";

const TASK_TYPE_MAP = {
  Choices: "Object classification",
  RectangleLabels: "Object detection"
};

export const ModelDetail = ({ model, disabled, taskType, onSave }) => {
  const api = useAPI();
  const { project } = useProject();
  const [backbone, setBackbone] = useState(null);
  const [baseModels, setBaseModels] = useState([]);
  const [baseModel, setBaseModel] = useState(model?.base_model);
  const [backboneStatus, setBackboneStatus] = useState("loading");
  const [datasetStatus, setDatasetStatus] = useState("loading");
  const [nnModel, setNnModel] = useState(null);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [trained, setTrained] = useState(false);
  const [modelName, setModelName] = useState(model?.name);

  const { dataset, numClasses } = useLoadDataset({
    backbone,
    project,
    setStatus: setDatasetStatus
  });

  const trainModel = useCallback(async () => {
    setTrainingLogs([]);
    await nnModel.fit(dataset.data, dataset.labels, {
      epochs: 10,
      callbacks: {
        onEpochEnd: (epoch, logs) =>
          setTrainingLogs(prev => [{ ...logs, epoch }, ...prev])
      }
    });
    setTrained(true);
  }, [nnModel, dataset]);

  const saveModel = useCallback(async () => {
    const modelResponse = await api.callApi("createNnModel", {
      body: { name: modelName, base_model: baseModel },
      params: { pk: project.id }
    });
    console.log(modelResponse);
    const uploadResponse = await nnModel.save(
      tf.io.http(
        `http://localhost:8081/api/nn-models/${modelResponse.id}/upload?base_model=${baseModel}`
      )
    );
    console.log(uploadResponse);
    onSave?.(modelResponse);
  }, [modelName, nnModel, baseModel, onSave]);

  const predict = useCallback(
    async file => {
      const url = URL.createObjectURL(file);
      const imgEl = document.getElementById("prediction-image");
      imgEl.src = url;
      const img = await loadImage(url, backbone.inputs[0].shape.slice(1, 3));
      const features = tf.tidy(() => backbone.predict(img));
      const prediction = nnModel.predict(features);
      const cls = prediction.argMax(1).dataSync()[0];
      const predictionTextEl = document.getElementById("prediction-text");
      predictionTextEl.innerText = `Predicted class: ${cls}, confidence: ${
        prediction.dataSync()[cls]
      }`;
    },
    [nnModel]
  );

  useEffect(() => {
    api.callApi("baseModels").then(setBaseModels);
  }, []);

  useEffect(() => {
    if (disabled || !baseModel) return;
    setBackboneStatus("loading");

    loadBackbone(baseModel)
      .then(setBackbone)
      .then(() => setBackboneStatus("ready"));
  }, [disabled, baseModel]);

  useEffect(() => {
    if (!numClasses) return;

    setNnModel(buildClassificationModel(numClasses));
  }, [numClasses]);

  useEffect(() => {
    setBaseModel(model?.base_model);
  }, [model]);

  useEffect(() => console.log(modelName), [modelName]);

  if (!model) return null;

  return (
    <Block name="model-detail">
      <Elem name="inputs">
        <Elem tag="h2">Model detail</Elem>
        {taskType && <Elem>Task type: {TASK_TYPE_MAP[taskType]}</Elem>}
        <Input
          label="Name"
          disabled={disabled}
          placeholder={model.name}
          onChange={e => setModelName(e.target.value)}
        />
        <Select
          label="Base model"
          options={baseModels}
          disabled={disabled}
          onChange={e => setBaseModel(e.target.value)}
          value={model.base_model}
        />
        <Elem name="backbone-status">
          Backbone model status: {backboneStatus}
        </Elem>
        <Elem name="dataset-status">Dataset status: {datasetStatus}</Elem>
        {numClasses && <Elem>Number of classes: {numClasses}</Elem>}
        <Elem name="actions">
          <Elem
            tag="button"
            name="train"
            onClick={trainModel}
            disabled={disabled || !numClasses || !dataset || trained}
          >
            Train
          </Elem>
          {/* <Elem tag="button" disabled={disabled || !trained}>
            Reset
          </Elem> */}
          <Elem
            tag="button"
            disabled={disabled || !trained}
            onClick={saveModel}
          >
            Save
          </Elem>
          {/* <Elem
            tag="label"
            name="predict"
            className={disabled || !trained ? " disabled" : ""}
          >
            Predict
            <input
              type="file"
              style={{ display: "none" }}
              disabled={disabled || !trained}
              onChange={e => predict(e.target.files[0])}
            />
          </Elem> */}
        </Elem>
        <Elem name="logs">
          <h2>Logs:</h2>
          <pre>{JSON.stringify(trainingLogs, null, 2)}</pre>
        </Elem>
      </Elem>
      {/* <Elem>
        <img id="prediction-image" width="250" height="250" />
        <p id="prediction-text"></p>
      </Elem> */}
    </Block>
  );
};
