"use client";

import { useEffect, useRef, useState } from "react";
import { exportBackup, importBackup, getCourses } from "@/lib/storage";
import { useLanguage } from "@/lib/language-context";

const MODELS = [
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash (anbefalt)" },
  { id: "gemini-3.7-flash", label: "Gemini 3.7 Flash" },
  { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [backupMsg, setBackupMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (open) {
      setApiKey(localStorage.getItem("laerbar_google_key") ?? "");
      const stored = localStorage.getItem("laerbar_model") ?? MODELS[0].id;
      const valid = MODELS.find((m) => m.id === stored) ? stored : MODELS[0].id;
      if (valid !== stored) localStorage.setItem("laerbar_model", valid);
      setModel(valid);
    }
  }, [open]);

  function save() {
    if (apiKey.trim()) {
      localStorage.setItem("laerbar_google_key", apiKey.trim());
    } else {
      localStorage.removeItem("laerbar_google_key");
    }
    localStorage.setItem("laerbar_model", model);
    onClose();
  }

  function clearKey() {
    setApiKey("");
    localStorage.removeItem("laerbar_google_key");
  }

  function downloadBackup() {
    try {
      const json = exportBackup();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `laerbar-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const count = getCourses().length;
      setBackupMsg({ kind: "ok", text: t.settingsBackupOk(count) });
    } catch {
      setBackupMsg({ kind: "err", text: t.settingsBackupError });
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const result = importBackup(text, "merge");
      setBackupMsg({
        kind: "ok",
        text:
          result.imported === 0 && result.skipped > 0 && result.invalid === 0
            ? t.settingsNoneNew(result.skipped)
            : t.settingsImportOk(result.imported, result.skipped, result.invalid),
      });
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setBackupMsg({
        kind: "err",
        text: err instanceof Error ? err.message : t.settingsImportError,
      });
    }
  }

  if (!open) return null;

  const keyStatus = apiKey.trim()
    ? { label: t.settingsKeySet(apiKey.slice(0, 6)), ok: true }
    : { label: t.settingsKeyMissing, ok: false };

  return (
    <div
      className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3.5 text-muted-foreground hover:text-foreground text-xl leading-none"
        >
          &times;
        </button>

        <h2 className="font-heading text-xl text-dg mb-1.5">{t.settingsTitle}</h2>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          {t.settingsDesc}
        </p>

        <div className="mb-5">
          <h3 className="font-heading text-base text-dg mb-2">{t.settingsGeminiSection}</h3>

          <div
            className={`text-xs mb-2.5 px-2.5 py-1.5 rounded ${
              keyStatus.ok
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {keyStatus.label}
          </div>

          <label className="text-xs font-semibold text-dg block mb-1">{t.settingsKeyLabel}</label>
          <div className="flex gap-2 mb-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="flex-1 px-3 py-2 border border-black/15 rounded text-sm focus:outline-none focus:border-gold transition-colors"
            />
            <button
              onClick={clearKey}
              className="border border-black/15 rounded w-10 text-muted-foreground hover:border-red-400 hover:text-red-600 transition-all"
              title={t.settingsRemoveKey}
            >
              &times;
            </button>
          </div>

          <label className="text-xs font-semibold text-dg block mb-2">{t.settingsModelLabel}</label>
          <div className="flex flex-col gap-1.5">
            {MODELS.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-2 text-sm px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                  !apiKey.trim() ? "opacity-40 cursor-not-allowed" : "hover:bg-black/3"
                }`}
              >
                <input
                  type="radio"
                  name="model"
                  value={m.id}
                  checked={model === m.id}
                  onChange={() => setModel(m.id)}
                  disabled={!apiKey.trim()}
                  className="accent-lg"
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2.5 mt-2">
          <button
            onClick={save}
            className="bg-dg text-cream px-6 py-2.5 rounded text-sm font-semibold hover:bg-mg transition-colors"
          >
            {t.settingsSave}
          </button>
          <button
            onClick={onClose}
            className="border border-black/15 px-6 py-2.5 rounded text-sm text-muted-foreground hover:border-gold hover:text-dg transition-all"
          >
            {t.settingsCancel}
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-black/8">
          <h3 className="font-heading text-base text-dg mb-1">{t.settingsBackupTitle}</h3>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            {t.settingsBackupDesc}
          </p>
          <div className="flex gap-2">
            <button
              onClick={downloadBackup}
              className="flex-1 border border-black/15 px-4 py-2 rounded text-xs font-medium text-dg hover:border-gold hover:text-dg transition-all"
            >
              {t.settingsDownloadBackup}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 border border-black/15 px-4 py-2 rounded text-xs font-medium text-dg hover:border-gold hover:text-dg transition-all"
            >
              {t.settingsImportBackup}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
          {backupMsg && (
            <div
              className={`text-xs mt-2.5 px-2.5 py-1.5 rounded ${
                backupMsg.kind === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {backupMsg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
