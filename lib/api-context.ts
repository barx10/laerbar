import { NextRequest } from "next/server";
import { DEFAULT_GEMINI_MODEL } from "./ai";

export type RequestLang = "no" | "en";

export type RequestContext = {
  apiKey: string;
  modelId: string;
  lang: RequestLang;
};

export function getRequestContext(req: NextRequest): RequestContext | null {
  const apiKey = req.headers.get("X-API-Key");
  if (!apiKey) return null;
  const modelId = req.headers.get("X-Model") ?? DEFAULT_GEMINI_MODEL;
  const lang: RequestLang = req.headers.get("X-Language") === "en" ? "en" : "no";
  return { apiKey, modelId, lang };
}
