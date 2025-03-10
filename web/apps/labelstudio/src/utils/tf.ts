import * as tf from "@tensorflow/tfjs";

export const loadBackbone = async (modelName: string) => {
  const model = await tf.loadGraphModel(
    `${window.APP_SETTINGS.hostname}/static/models/${modelName}/tfjs/model.json`
  );

  tf.tidy(() => {
    model.predict(
      tf.zeros(model.inputs[0].shape!.map(s => (s === -1 ? 1 : s)))
    );
  });

  return model;
};

export const getBackboneOutputShape = (backbone: tf.GraphModel) => {
  const output = Object.values((backbone.modelSignature as any).outputs)[0] as {
    tensorShape: { dim: { size: string }[] };
  };

  return output.tensorShape.dim.map(d => parseInt(d.size)).slice(1);
};

export const getBackboneFeatureMaps = (backbone: tf.GraphModel) => {
  const featureMapNames = Object.keys(
    (backbone.modelSignature as any).outputs
  ).filter(name => name.startsWith("FM"));
  const featureMaps = featureMapNames.map(
    name => (backbone.modelSignature as any).outputs[name]
  );

  return featureMaps.map(f => ({
    ...f,
    shape: f.tensorShape.dim.map((d: any) => parseInt(d.size)).slice(1)
  }));
};

export const loadImage = async (
  url: string,
  resize?: [number, number]
): Promise<tf.Tensor3D> => {
  return new Promise(resolve => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      let tensor = tf.browser.fromPixels(img);

      if (resize) tensor = tensor.resizeBilinear(resize);

      tensor = tensor.div(255.0).expandDims();

      resolve(tensor);
    };
  });
};

export const buildClassificationModel = (
  numClasses: number,
  inputShape?: number[]
) => {
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

export const getImgFeatures = async (
  backbone: tf.GraphModel,
  imgUrl: string
) => {
  const img = await loadImage(
    imgUrl,
    backbone.inputs[0].shape?.slice(1, 3) as [number, number] | undefined
  );
  const features = tf.tidy(() => backbone.predict(img));

  img.dispose();

  return Array.isArray(features) ? features : ([features] as tf.Tensor[]);
};
