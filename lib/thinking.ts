export const THINKING_LEVELS = ["low", "medium", "high"] as const;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];
export const DEFAULT_THINKING_LEVEL: ThinkingLevel = "low";

export function normalizeThinkingLevel(value: string | null | undefined): ThinkingLevel {
  return THINKING_LEVELS.find((l) => l === value) ?? DEFAULT_THINKING_LEVEL;
}

export function getStoredThinkingLevel(): ThinkingLevel {
  return normalizeThinkingLevel(localStorage.getItem("laerbar_thinking"));
}
