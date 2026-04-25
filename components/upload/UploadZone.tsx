"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/lib/language-context";

interface Props {
  onFile: (file: File) => void;
}

export default function UploadZone({ onFile }: Props) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [chosen, setChosen] = useState<string>("");

  function handleFile(file: File) {
    if (!file.name.endsWith(".pdf")) return;
    if (file.size > 20 * 1024 * 1024) return;
    setChosen(file.name);
    onFile(file);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={`border-2 border-dashed rounded-md px-5 py-9 cursor-pointer transition-all text-center mb-5 ${
          dragOver
            ? "border-gold bg-gold/5"
            : "border-black/18 hover:border-gold hover:bg-gold/3"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <div className="text-4xl mb-2.5 opacity-50">📄</div>
        <div className="text-sm text-muted-foreground leading-relaxed">
          {t.uploadInstruction}
          <br />
          <span className="text-xs opacity-70">{t.uploadSubtext}</span>
        </div>
      </div>

      {chosen && (
        <div className="text-sm text-lg font-medium mb-3.5">{chosen}</div>
      )}
    </div>
  );
}
