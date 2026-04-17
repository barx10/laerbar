"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import UploadZone from "@/components/upload/UploadZone";
import ParsingAnimation from "@/components/upload/ParsingAnimation";
import { saveCourse } from "@/lib/storage";
import { Course } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!file) return;
    const apiKey = localStorage.getItem("laerbar_google_key") ?? "";
    if (!apiKey) {
      setError("Legg inn API-nøkkel under API-innstillinger først.");
      return;
    }

    setLoading(true);
    setError("");

    const model = localStorage.getItem("laerbar_model") ?? "gemini-2.5-flash-lite";
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "X-API-Key": apiKey, "X-Model": model },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Noe gikk galt. Prøv igjen.");
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
          setError("Nettleseren har ikke plass til flere kurs. Slett et gammelt kurs og prøv igjen.");
        } else {
          setError("Klarte ikke å lagre kurset. Prøv igjen.");
        }
      }
    } catch {
      setError("Noe gikk galt. Sjekk API-nøkkelen og prøv igjen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-5 py-10">
        <div className="bg-white rounded-lg px-10 py-12 max-w-md w-full shadow-sm text-center">
          <h2 className="font-heading text-2xl text-dg mb-2">Ta et læringsløp</h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Last opp en PDF, og AI trekker ut kjernekonseptene du må bevise at du kan.
          </p>

          <UploadZone onFile={setFile} />

          {loading ? (
            <ParsingAnimation label="Analyserer fagstoffet og finner kjernekonsepter…" />
          ) : (
            <button
              onClick={generate}
              disabled={!file}
              className="bg-dg text-cream w-full py-3 rounded text-sm font-semibold hover:bg-mg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start læringsløp
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
