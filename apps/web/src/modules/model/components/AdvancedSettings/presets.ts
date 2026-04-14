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
    description: "Smaller batch size for quick iteration",
    config: {
      trainer: {
        batch_size: 4,
      },
    },
  },
  {
    id: "high-accuracy",
    name: "High Accuracy",
    description: "Larger batch size and lower learning rate for better convergence",
    config: {
      trainer: {
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
    description: "Smaller batch size for constrained environments",
    config: {
      trainer: {
        batch_size: 2,
      },
    },
  },
];
