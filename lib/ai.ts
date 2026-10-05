import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export const GEMINI_FAST_OPTS = {
  google: {
    thinkingConfig: { thinkingLevel: "low" },
  },
} as const;

export function createGeminiModel(apiKey: string, modelId: string) {
  return createGoogleGenerativeAI({ apiKey })(modelId);
}
