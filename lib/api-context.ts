import { NextRequest } from "next/server";
import { DEFAULT_GEMINI_MODEL } from "./ai";
import { normalizeThinkingLevel, type ThinkingLevel } from "./thinking";

export type RequestLang = "no" | "en";

export type RequestContext = {
  apiKey: string;
  modelId: string;
  lang: RequestLang;
  thinking: ThinkingLevel;
};

export function getRequestContext(req: NextRequest): RequestContext | null {
  const apiKey = req.headers.get("X-API-Key");
  if (!apiKey) return null;
  const modelId = req.headers.get("X-Model") ?? DEFAULT_GEMINI_MODEL;
  const lang: RequestLang = req.headers.get("X-Language") === "en" ? "en" : "no";
  const thinking = normalizeThinkingLevel(req.headers.get("X-Thinking"));
  return { apiKey, modelId, lang, thinking };
}
