"use client";

import { useEffect, useRef, useState } from "react";
import { exportBackup, importBackup, getCourses } from "@/lib/storage";

const MODELS = [
  { id: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite Preview" },
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash Preview" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
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

  useEffect(() => {
    if (open) {
      setApiKey(localStorage.getItem("laerbar_google_key") ?? "");
      setModel(localStorage.getItem("laerbar_model") ?? MODELS[0].id);
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
      setBackupMsg({ kind: "ok", text: `${count} kurs lastet ned.` });
    } catch {
      setBackupMsg({ kind: "err", text: "Kunne ikke lage backup." });
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
          result.imported === 0 && result.skipped > 0
            ? `Ingen nye kurs (${result.skipped} fantes allerede).`
            : `Importerte ${result.imported} kurs. Hoppet over ${result.skipped} duplikater.`,
      });
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setBackupMsg({
        kind: "err",
        text: err instanceof Error ? err.message : "Ugyldig backup-fil.",
      });
    }
  }

  if (!open) return null;

  const keyStatus = apiKey.trim()
    ? { label: `Nøkkel lagret (${apiKey.slice(0, 6)}...)`, ok: true }
    : { label: "Ingen nøkkel lagret", ok: false };

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

        <h2 className="font-heading text-xl text-dg mb-1.5">Innstillinger</h2>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Legg inn din Google Gemini API-nøkkel. Nøkkelen lagres kun lokalt i nettleseren din.
        </p>

        <div className="mb-5">
          <h3 className="font-heading text-base text-dg mb-2">Google Gemini</h3>

          <div
            className={`text-xs mb-2.5 px-2.5 py-1.5 rounded ${
              keyStatus.ok
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {keyStatus.label}
          </div>

          <label className="text-xs font-semibold text-dg block mb-1">API-nøkkel</label>
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
              title="Fjern nøkkel"
            >
              &times;
            </button>
          </div>

          <label className="text-xs font-semibold text-dg block mb-2">Modell</label>
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
            Lagre
          </button>
          <button
            onClick={onClose}
            className="border border-black/15 px-6 py-2.5 rounded text-sm text-muted-foreground hover:border-gold hover:text-dg transition-all"
          >
            Avbryt
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-black/8">
          <h3 className="font-heading text-base text-dg mb-1">Sikkerhetskopi</h3>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Alle kurs lagres kun i nettleseren din. Last ned en backup jevnlig — hvis du tømmer nettleser-data uten backup, mister du alt.
          </p>
          <div className="flex gap-2">
            <button
              onClick={downloadBackup}
              className="flex-1 border border-black/15 px-4 py-2 rounded text-xs font-medium text-dg hover:border-gold hover:text-dg transition-all"
            >
              ↓ Last ned backup
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 border border-black/15 px-4 py-2 rounded text-xs font-medium text-dg hover:border-gold hover:text-dg transition-all"
            >
              ↑ Importer backup
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
