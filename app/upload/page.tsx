"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import UploadZone from "@/components/upload/UploadZone";
import ParsingAnimation from "@/components/upload/ParsingAnimation";
import { saveCourse } from "@/lib/storage";
import { Course } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";

export default function UploadPage() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function uploadToGemini(f: File, apiKey: string): Promise<string> {
    const boundary = "GeminiUpload" + Math.random().toString(36).slice(2, 10);
    const enc = new TextEncoder();
    const metaBytes = enc.encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify({ file: { displayName: f.name } }) +
      `\r\n`
    );
    const filePrefix = enc.encode(`--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`);
    const fileBytes = new Uint8Array(await f.arrayBuffer());
    const closing = enc.encode(`\r\n--${boundary}--`);
    const body = new Uint8Array(metaBytes.length + filePrefix.length + fileBytes.length + closing.length);
    let off = 0;
    body.set(metaBytes, off); off += metaBytes.length;
    body.set(filePrefix, off); off += filePrefix.length;
    body.set(fileBytes, off); off += fileBytes.length;
    body.set(closing, off);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=multipart&key=${encodeURIComponent(apiKey)}`,
      { method: "POST", headers: { "Content-Type": `multipart/related; boundary=${boundary}` }, body }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? t.uploadApiError);
    }
    const data = await res.json();
    return data.file.uri as string;
  }

  async function generate() {
    if (!file) return;
    const apiKey = localStorage.getItem("laerbar_google_key") ?? "";
    if (!apiKey) {
      setError(t.noApiKeyError);
      return;
    }

    setLoading(true);
    setError("");

    const model = localStorage.getItem("laerbar_model") ?? "gemini-3.6-flash";

    try {
      const fileUri = await uploadToGemini(file, apiKey);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey, "X-Model": model, "X-Language": lang },
        body: JSON.stringify({ fileUri }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? t.uploadGenericError);
        return;
      }

      const data = await res.json();

      const course: Course = {
        id: crypto.randomUUID(),
        title: data.title,
        created_at: new Date().toISOString(),
        source_text: typeof data.source_text === "string" ? data.source_text : "",
        concepts: data.concepts.map((c: Omit<Course["concepts"][0], "id" | "mastered">) => ({
          ...c,
          id: crypto.randomUUID(),
          mastered: false,
        })),
      };

      try {
        saveCourse(course);
        router.push(`/course/${course.id}`);
      } catch (err) {
        const name = err instanceof Error || err instanceof DOMException ? err.name : "";
        if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
          setError(t.uploadQuotaError);
        } else {
          setError(t.uploadSaveError);
        }
      }
    } catch {
      setError(t.uploadApiError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-5 py-10">
        <div className="bg-white rounded-lg px-10 py-12 max-w-md w-full shadow-sm text-center">
          <h2 className="font-heading text-2xl text-dg mb-2">{t.uploadPageTitle}</h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            {t.uploadPageDesc}
          </p>

          <UploadZone onFile={setFile} />

          {loading ? (
            <ParsingAnimation label={t.parsingLabel} />
          ) : (
            <button
              onClick={generate}
              disabled={!file}
              className="bg-dg text-cream w-full py-3 rounded text-sm font-semibold hover:bg-mg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.startLearning}
            </button>
          )}

          {error && (
            <p className="text-red-600 text-sm mt-3">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
