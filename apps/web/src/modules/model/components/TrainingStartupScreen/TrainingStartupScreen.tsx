import { Check, Cpu, Database, Rocket, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export interface TrainingStartupScreenProps {
  modelName?: string;
}

interface Step {
  key: string;
  label: string;
  icon: typeof Cpu;
  estimatedMs: number;
}

const STEPS: Step[] = [
  { key: "provision", label: "Provisioning compute", icon: Cpu, estimatedMs: 25_000 },
  { key: "dataset", label: "Fetching dataset", icon: Database, estimatedMs: 30_000 },
  { key: "model", label: "Preparing model architecture", icon: Sparkles, estimatedMs: 25_000 },
  { key: "launch", label: "Launching first epoch", icon: Rocket, estimatedMs: 40_000 },
];

const TIPS = [
  "Training on a cloud GPU usually takes the longest to start — the worker has to spin up from cold.",
  "The first epoch is often the slowest. Later epochs reuse cached dataset tensors.",
  "Augmentations run on the fly during training — no preprocessing wait afterwards.",
  "You can safely close this tab. Training continues on our servers and results sync when you return.",
  "More annotations usually beat more epochs — quality data is the best hyperparameter.",
  "Loss going up for a step or two is normal. Watch the trend across epochs, not each point.",
  "A balanced label distribution prevents the model from learning to always predict the majority class.",
  "If validation loss diverges from training loss, the model is likely overfitting.",
  "Lowering the learning rate late in training often squeezes out a few extra accuracy points.",
  "Double-check your dataset split — test images must never appear in training.",
  "A good detection model usually needs at least 100–200 annotated examples per label.",
  "Blurry or mislabeled images hurt more than missing ones. Clean the dataset before adding more.",
  "Consistent lighting in annotated photos helps the model generalize to the shop floor faster.",
  "Include a few 'negative' images — scenes where no defect exists — to reduce false positives.",
  "Aspect ratio matters: keep annotated bounding boxes tight to the object for cleaner learning.",
  "RVC4 outputs are optimized for Luxonis OAK4 devices and ship with INT8 quantization.",
  "ONNX is the portable format. It's what the edge device will actually run at inference time.",
  "Duplicate a previous model to iterate on hyperparameters without re-entering every setting.",
  "Smaller batch sizes use less GPU memory but train more slowly.",
  "Early stopping is your friend — more epochs don't always mean a better model.",
  "Annotation speed tip: keyboard shortcuts in the labeling tool can cut your labeling time in half.",
  "Class imbalance? Try augmenting only the minority class instead of the whole dataset.",
  "The model learns from what you show it — if it never sees a defect type, it will never detect it.",
  "A training run that finishes in seconds usually means something went wrong. Real training takes minutes.",
  "Confusion matrices reveal which labels the model mixes up — often more useful than raw accuracy.",
  "Segmentation masks take longer to train than bounding boxes but capture shape information.",
  "Grayscale augmentation can make the model more robust to camera and lighting variations.",
  "The learning rate is the single most important hyperparameter. Everything else is secondary.",
  "Freeze the backbone for the first few epochs if you're fine-tuning a pretrained model.",
  "Resolution tradeoff: higher input size = better accuracy but slower inference on-device.",
];

const useElapsed = () => {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  return now - start;
};

const useRotatingTip = () => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % TIPS.length), 6_000);
    return () => clearInterval(id);
  }, []);
  return TIPS[index];
};

export const TrainingStartupScreen = ({ modelName }: TrainingStartupScreenProps) => {
  const elapsed = useElapsed();
  const tip = useRotatingTip();

  let remaining = elapsed;
  let activeIndex = STEPS.length - 1;
  for (let i = 0; i < STEPS.length; i++) {
    if (remaining < STEPS[i].estimatedMs) {
      activeIndex = i;
      break;
    }
    remaining -= STEPS[i].estimatedMs;
  }

  const activeStep = STEPS[activeIndex];
  const stepProgress = Math.min(100, (remaining / activeStep.estimatedMs) * 100);

  const seconds = Math.floor(elapsed / 1000);
  const elapsedLabel =
    seconds < 60
      ? `${seconds}s`
      : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-8 overflow-hidden p-10">
      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" />
          <span
            className="absolute inset-2 animate-ping rounded-full bg-emerald-500/30"
            style={{ animationDelay: "0.4s" }}
          />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
            <Rocket className="size-7" />
          </span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">
          {modelName ? `Spinning up "${modelName}"` : "Spinning up training"}
        </h3>
        <p className="max-w-md text-sm text-gray-500">
          The first few minutes are the cloud GPU waking up. Logs will stream
          here the moment training begins.
        </p>
      </div>

      <div className="relative z-10 flex w-full max-w-xl flex-col gap-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors ${
                isActive
                  ? "border-emerald-300 bg-white shadow-sm"
                  : isDone
                    ? "border-emerald-100 bg-emerald-50/60"
                    : "border-gray-200 bg-white/50"
              }`}
            >
              <div
                className={`flex size-9 items-center justify-center rounded-full ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isActive
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {isDone ? (
                  <Check className="size-4" />
                ) : (
                  <Icon
                    className={`size-4 ${isActive ? "animate-pulse" : ""}`}
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <span
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-gray-900"
                      : isDone
                        ? "text-emerald-700"
                        : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
                {isActive && (
                  <div className="h-1 w-full overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-linear"
                      style={{ width: `${stepProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center gap-1 text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
          Did you know?
        </span>
        <p
          key={tip}
          className="animate-in fade-in text-sm text-gray-600 duration-700"
        >
          {tip}
        </p>
      </div>

      <div className="relative z-10 text-xs text-gray-400">
        Elapsed {elapsedLabel} · safe to leave this page
      </div>
    </div>
  );
};
