export interface HyperparamsPreset {
  id: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
}

export const HYPERPARAMS_PRESETS: HyperparamsPreset[] = [
  {
    id: "fast-training",
    name: "Fast Training",
    description: "Reduced epochs and smaller batch size for quick iteration",
    config: {
      trainer: {
        batch_size: 4,
        epochs: 5,
        validation_interval: 2,
      },
    },
  },
  {
    id: "high-accuracy",
    name: "High Accuracy",
    description:
      "More epochs and lower learning rate for better convergence",
    config: {
      trainer: {
        epochs: 100,
        batch_size: 16,
        optimizer: {
          name: "Adam",
          params: { lr: 0.0005 },
        },
      },
    },
  },
  {
    id: "low-memory",
    name: "Low Memory",
    description:
      "Smaller batch size and fewer workers for constrained environments",
    config: {
      trainer: {
        batch_size: 2,
        n_workers: 2,
      },
    },
  },
];
