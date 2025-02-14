import * as tf from "@tensorflow/tfjs";
import { useAPI } from "../providers/ApiProvider";
import { useCallback, useEffect, useState } from "react";
import { useProject } from "../providers/ProjectProvider";

export const loadBackbone = async modelName => {
  const model = await tf.loadGraphModel(
    `http://localhost:8081/static/models/${modelName}/tfjs/model.json`
  );

  tf.tidy(() =>
    model.predict(tf.zeros(model.inputs[0].shape.map(s => (s === -1 ? 1 : s))))
  );

  return model;
};

export const getBackboneOutputShape = backbone => {
  const output = Object.values(backbone.modelSignature.outputs)[0];

  return output.tensorShape.dim.map(d => parseInt(d.size)).slice(1);
};

export const loadImage = async (url, shape) => {
  return new Promise(resolve => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      let tensor = tf.browser.fromPixels(img);

      if (shape) {
        tensor = tensor.resizeBilinear(shape);
      }

      tensor = tensor.div(255.0).expandDims();

      resolve(tensor);
    };
  });
};

export const buildClassificationModel = (numClasses, inputShape) => {
  const model = tf.sequential();

  model.add(
    tf.layers.dense({
      inputShape: inputShape ?? [1024],
      units: 128,
      activation: "relu"
    })
  );
  model.add(tf.layers.dense({ units: numClasses, activation: "softmax" }));

  model.compile({
    optimizer: "adam",
    loss: numClasses === 2 ? "binaryCrossentropy" : "categoricalCrossentropy",
    metrics: ["accuracy"]
  });

  return model;
};

export const useBackbone = ({ modelName, disabled, setStatus }) => {
  const [backbone, setBackbone] = useState(null);

  useEffect(() => {
    if (disabled || !modelName) return;
    setStatus?.({ statusType: "loading", status: "Loading base model" });

    loadBackbone(modelName)
      .then(setBackbone)
      .then(() =>
        setStatus?.({ statusType: "ready", status: "Ready for training" })
      );
  }, [modelName, disabled, setStatus]);

  return { backbone };
};

export const useLoadDataset = ({ backbone, setStatus }) => {
  const api = useAPI();
  const { project } = useProject();
  const [dataset, setDataset] = useState(null);

  const getImgFeatures = useCallback(
    async imgUrl => {
      const img = await loadImage(imgUrl, backbone.inputs[0].shape.slice(1, 3));
      const features = tf.tidy(() => backbone.predict(img));
      img.dispose();

      return features.squeeze();
    },
    [backbone]
  );

  const loadDataset = useCallback(async () => {
    if (!backbone || !project) return;

    const { tasks } = await api.callApi("tasks", {
      params: { project: project.id, fields: "all" }
    });
    const labelMap = {};
    const dataFeatures = [];
    const dataLabels = [];

    project.parsed_label_config.choice.labels.forEach(
      (label, i) => (labelMap[label] = i)
    );

    for (const task of tasks) {
      if (!task?.annotations?.[0]?.result?.[0]) continue;

      const features = await getImgFeatures(
        `http://localhost:8081/${task.data.image}`
      );

      dataFeatures.push(features);
      dataLabels.push(labelMap[task.annotations[0].result[0].value.choices[0]]);
    }

    tf.util.shuffleCombo(dataFeatures, dataLabels);
    const encodedLabels = tf.oneHot(
      tf.tensor1d(dataLabels, "int32"),
      Object.keys(labelMap).length
    );

    const loadedDataset = {
      data: tf.stack(dataFeatures),
      labels: encodedLabels
    };
    setDataset(loadedDataset);
    return loadedDataset;
  }, [backbone, project, api, getImgFeatures]);

  return { loadDataset, dataset };
};

export const useTrainModel = ({ backbone, model, setStatus }) => {
  const [trained, setTrained] = useState(false);
  const { loadDataset, dataset } = useLoadDataset({ backbone, setStatus });

  const trainModel = useCallback(
    async epochs => {
      if (trained) return;

      setStatus?.({ statusType: "loading", status: "Training model" });

      const { data, labels } = dataset ?? (await loadDataset());

      if (!model || !data || !labels) return;

      await model.fit(data, labels, {
        epochs: epochs ?? 10
      });

      setTrained(true);
      setStatus?.({ statusType: "ready", status: "Model trained" });
    },
    [model, dataset, loadDataset]
  );

  return { model, trained, trainModel };
};

export const useModel = ({ baseModel, setStatus, disabled }) => {
  const { project } = useProject();
  const { backbone } = useBackbone({
    modelName: baseModel,
    setStatus,
    disabled
  });
  const [model, setModel] = useState(null);
  const { trainModel, trained } = useTrainModel({ backbone, model, setStatus });

  useEffect(() => {
    if (!project || !backbone) return;

    setModel(
      buildClassificationModel(
        project.parsed_label_config.choice.labels.length,
        getBackboneOutputShape(backbone)
      )
    );
  }, [project, backbone]);

  return { model, trainModel, trained };
};
