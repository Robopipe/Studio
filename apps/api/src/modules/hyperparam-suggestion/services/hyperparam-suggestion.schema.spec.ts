// Sanity checks for the shared registry/schema in @repo/schema — placed here
// because packages/schema has no jest setup of its own.
import {
  getGeminiSuggestionSchema,
  HYPERPARAM_SUGGESTION_REGISTRY,
  ModelBackendEnum,
} from "@repo/schema";
import z from "zod";

const entry = HYPERPARAM_SUGGESTION_REGISTRY[ModelBackendEnum.ULTRALYTICS]!;

describe("hyperparam suggestion registry", () => {
  it("has an ULTRALYTICS entry with described params", () => {
    expect(entry).toBeDefined();
    for (const [name, def] of Object.entries(entry.params)) {
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(10);
      if (def.input === "enum") {
        expect(def.options?.length ?? 0).toBeGreaterThan(0);
      }
      expect(name).toMatch(/^[a-z0-9_]+$/);
    }
  });

  it("excludes server-owned and form-owned keys", () => {
    expect(entry.params.batch).toBeUndefined();
    expect(entry.params.epochs).toBeUndefined();
    expect(entry.params.device).toBeUndefined();
  });

  it("validates values through paramsSchema", () => {
    expect(
      entry.paramsSchema.safeParse({ model_variant: "yolo11m", imgsz: 640 })
        .success,
    ).toBe(true);
    expect(entry.paramsSchema.safeParse({ imgsz: 99999 }).success).toBe(false);
    expect(
      entry.paramsSchema.safeParse({ model_variant: "resnet50" }).success,
    ).toBe(false);
  });
});

describe("getGeminiSuggestionSchema", () => {
  const schema = getGeminiSuggestionSchema(ModelBackendEnum.ULTRALYTICS);

  it("derives a closed JSON schema (no open records)", () => {
    const json = JSON.stringify(z.toJSONSchema(schema));
    expect(json).not.toContain('"additionalProperties":true');
    expect(json).toContain('"model_variant"');
    expect(json).toContain('"warnings"');
    expect(json).toContain('"split"');
    expect(json).toContain("MUST sum to exactly 100");
  });

  it("round-trips a sample reply", () => {
    const sample = {
      epochs: { value: 120, reasoning: "r" },
      split: { train: 70, validation: 20, test: 10, reasoning: "r" },
      params: {
        model_variant: { value: "yolo11s", reasoning: "r" },
        mosaic: { value: 0.5, reasoning: "r" },
        cos_lr: { value: true, reasoning: "r" },
      },
      warnings: [
        { severity: "critical", message: "m", affectedLabels: ["a"] },
        { severity: "info", message: "m", affectedLabels: null },
      ],
      summary: "s",
    };
    expect(schema.safeParse(sample).success).toBe(true);
  });

  it("enforces the split sum and bounds at parse time", () => {
    const base = {
      epochs: { value: 120, reasoning: "r" },
      params: {},
      warnings: [],
      summary: "s",
    };
    const withSplit = (split: Record<string, unknown>) =>
      schema.safeParse({ ...base, split: { reasoning: "r", ...split } });

    expect(withSplit({ train: 60, validation: 30, test: 20 }).success).toBe(
      false,
    );
    expect(withSplit({ train: 80, validation: 30, test: -10 }).success).toBe(
      false,
    );
    expect(withSplit({ train: 85, validation: 15, test: 0 }).success).toBe(
      true,
    );
  });

  it("rejects unknown backends", () => {
    expect(() => getGeminiSuggestionSchema(ModelBackendEnum.LUXONIS)).toThrow();
  });
});
