import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

export const GEMINI_FAST_OPTS = {
  google: {
    thinkingConfig: { thinkingLevel: "minimal" },
  },
} as const;

export function createGeminiModel(apiKey: string, modelId: string) {
  return createGoogleGenerativeAI({ apiKey })(modelId);
}
