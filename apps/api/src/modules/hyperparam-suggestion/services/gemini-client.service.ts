import { GoogleGenAI } from "@google/genai";
import { Injectable, Logger } from "@nestjs/common";
import { AppConfig } from "../../../core/configuration/app.config";
import type { PromptPart } from "./prompt-builder";

export interface GenerateStructuredInput {
  systemInstruction: string;
  parts: PromptPart[];
  /** JSON Schema the response is constrained to (Gemini structured output) */
  responseJsonSchema: Record<string, unknown>;
}

/**
 * Thin wrapper around @google/genai — the only file importing the SDK.
 * Talks to Gemini through Vertex AI with ADC (Cloud Run service account in
 * deploys, `gcloud auth application-default login` locally), so the feature
 * is enabled purely by gcpProject being configured.
 */
@Injectable()
export class GeminiClientService {
  private readonly logger = new Logger(GeminiClientService.name);
  private readonly ai: GoogleGenAI | null;
  private readonly model: string;

  constructor(config: AppConfig) {
    this.model = config.geminiModel;
    this.ai = config.gcpProject
      ? new GoogleGenAI({
          vertexai: true,
          project: config.gcpProject,
          location: config.geminiLocation,
        })
      : null;
  }

  public isEnabled(): boolean {
    return this.ai !== null;
  }

  /**
   * Single structured-output generation. Returns the raw response text —
   * parsing/validation stays with the caller so it can build a corrective
   * retry prompt.
   */
  public async generateStructured(input: GenerateStructuredInput): Promise<string> {
    if (!this.ai) {
      throw new Error("Gemini client is not configured (GCP_PROJECT missing)");
    }
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts: input.parts }],
      config: {
        systemInstruction: input.systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: input.responseJsonSchema,
        temperature: 0.2,
        httpOptions: { timeout: 60_000 },
      },
    });
    const text = response.text;
    if (!text) {
      this.logger.warn("Gemini returned an empty response");
      return "";
    }
    return text;
  }
}
