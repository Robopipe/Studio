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

export const loadImage = async (
  url: string,
  resize?: [number, number]
): Promise<tf.Tensor3D> => {
  return new Promise(resolve => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      let tensor = tf.browser.fromPixels(img);

      if (resize) {
        console.log("resizing image", resize);
        tensor = tensor.resizeBilinear(resize);
      }

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

export const buildDetectionModel = (
  numClasses: number,
  inputShape: number[]
) => {
  const inputs = tf.input({ shape: inputShape });
  const reshape = tf.layers
    .reshape({ targetShape: [1, 1, 1024] })
    .apply(inputs) as tf.SymbolicTensor;
  const upsample = tf.layers
    .conv2dTranspose({
      filters: 256,
      kernelSize: 3,
      strides: 2,
      activation: "relu",
      padding: "same"
    })
    .apply(reshape) as tf.SymbolicTensor;
  const conv1 = tf.layers
    .conv2d({
      filters: 128,
      kernelSize: 3,
      activation: "relu",
      padding: "same"
    })
    .apply(upsample) as tf.SymbolicTensor;
  const conv2 = tf.layers
    .conv2d({
      filters: 64,
      kernelSize: 3,
      activation: "relu",
      padding: "same"
    })
    .apply(conv1) as tf.SymbolicTensor;
  const bboxOutput = tf.layers
    .conv2d({
      filters: 4,
      kernelSize: 3,
      activation: "relu"
    })
    .apply(conv2) as tf.SymbolicTensor;
  const classOutput = tf.layers
    .conv2d({
      filters: numClasses,
      kernelSize: 3,
      activation: "softmax"
    })
    .apply(conv2) as tf.SymbolicTensor;
  const model = tf.model({ inputs, outputs: [bboxOutput, classOutput] });

  model.compile({
    optimizer: "adam",
    loss: [
      "meanSquaredError",
      numClasses === 2 ? "binaryCrossentropy" : "categoricalCrossentropy"
    ],
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
  const features = tf.tidy(() => backbone.predict(img) as tf.Tensor);

  img.dispose();

  return features.squeeze();
};
