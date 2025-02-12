import * as tf from "@tensorflow/tfjs";
import { useAPI } from "../providers/ApiProvider";
import { useCallback, useEffect, useState } from "react";

export const loadBackbone = async modelName => {
  const model = await tf.loadGraphModel(
    `http://localhost:8081/static/models/${modelName}/tfjs/model.json`
  );

  tf.tidy(() =>
    model.predict(tf.zeros(model.inputs[0].shape.map(s => (s === -1 ? 1 : s))))
  );

  return model;
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

export const useLoadDataset = ({ backbone, project, setStatus }) => {
  const [dataset, setDataset] = useState(null);
  const [numClasses, setNumClasses] = useState(null);
  const api = useAPI();

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
    setStatus?.("loading task data");
    const { tasks } = await api.callApi("tasks", {
      params: { project: project.id, fields: "all" }
    });
    const labelMap = {};
    const dataFeatures = [];
    const dataLabels = [];

    project.parsed_label_config.choice.labels.forEach(
      (label, i) => (labelMap[label] = i)
    );
    setNumClasses(Object.keys(labelMap).length);

    for (const task of tasks) {
      setStatus?.(`loading task ${task.id}`);
      if (!task.annotations[0].result[0]) continue;

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
    setStatus?.("ready");
    return { data: tf.stack(dataFeatures), labels: encodedLabels };
  }, [backbone, project, api, getImgFeatures]);

  useEffect(() => {
    loadDataset().then(setDataset);
  }, [loadDataset]);

  return { dataset, numClasses };
};
