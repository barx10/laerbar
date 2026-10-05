import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { ThinkingLevel } from "./thinking";

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export function geminiThinkingOpts(level: ThinkingLevel) {
  return { google: { thinkingConfig: { thinkingLevel: level } } };
}

export function createGeminiModel(apiKey: string, modelId: string) {
  return createGoogleGenerativeAI({ apiKey })(modelId);
}
