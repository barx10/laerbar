"use client";

import Image from "next/image";
import { useState } from "react";
import SettingsModal from "./SettingsModal";

export default function Navbar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [omOpen, setOmOpen] = useState(false);
  const [hjelpOpen, setHjelpOpen] = useState(false);

  return (
    <>
      <header className="bg-dg text-cream px-6 py-5 flex justify-between items-end border-b-[3px] border-gold">
        <div>
          <h1 className="font-heading text-2xl leading-tight">Lærbar</h1>
          <div className="text-xs text-gl mt-1 opacity-85">Bevis at du kan det</div>
        </div>
        <div className="flex gap-2.5 items-center">
          <button
            onClick={() => setOmOpen(true)}
            className="text-cream/80 border border-white/30 rounded px-4 py-1.5 text-xs font-medium hover:border-gold hover:text-gold transition-all"
          >
            Om
          </button>
          <button
            onClick={() => setHjelpOpen(true)}
            className="text-cream/80 border border-white/30 rounded px-4 py-1.5 text-xs font-medium hover:border-gold hover:text-gold transition-all"
          >
            Hjelp
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-cream/80 border border-white/30 rounded px-4 py-1.5 text-xs font-medium hover:border-gold hover:text-gold transition-all"
          >
            API
          </button>
        </div>
      </header>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Om-modal */}
      {omOpen && (
        <div
          className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-5"
          onClick={(e) => e.target === e.currentTarget && setOmOpen(false)}
        >
          <div className="bg-white rounded-lg p-8 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setOmOpen(false)}
              className="absolute top-3 right-3.5 text-muted-foreground hover:text-foreground text-xl leading-none"
            >
              &times;
            </button>
            <div className="mb-5">
              <Image
                src="/laererliv-logo.png"
                alt="Lærerliv"
                width={160}
                height={60}
                className="object-contain"
              />
            </div>
            <h2 className="font-heading text-xl text-dg mb-4">Om Lærerliv</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-5">
              Lærbar er laget av <strong>Kenneth Bareksten</strong> under Lærerliv — et prosjekt for bedre læringsverktøy.
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="https://www.laererliv.no"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dg hover:text-gold transition-colors underline underline-offset-2"
              >
                www.laererliv.no
              </a>
              <a
                href="mailto:kenneth@laererliv.no"
                className="text-dg hover:text-gold transition-colors underline underline-offset-2"
              >
                kenneth@laererliv.no
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Hjelp-modal */}
      {hjelpOpen && (
        <div
          className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-5"
          onClick={(e) => e.target === e.currentTarget && setHjelpOpen(false)}
        >
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setHjelpOpen(false)}
              className="absolute top-3 right-3.5 text-muted-foreground hover:text-foreground text-xl leading-none"
            >
              &times;
            </button>
            <h2 className="font-heading text-xl text-dg mb-5">Slik bruker du Lærbar</h2>
            <div className="flex flex-col gap-5">
              <Step n={1} title="Sett inn API-nøkkel">
                Trykk <strong>API</strong> øverst til høyre. Lim inn din Google Gemini API-nøkkel — den lagres kun lokalt i nettleseren.
                Nøkkelen får du gratis på <span className="text-dg font-medium">aistudio.google.com</span>.
              </Step>
              <Step n={2} title="Last opp fagstoff">
                Trykk <strong>Nytt kurs</strong>, dra inn en PDF (maks 20 MB). AI analyserer og finner 5–10 kjernekonsepter.
              </Step>
              <Step n={3} title="Bevis at du kan det">
                I <strong>Lær</strong>-fanen stiller AI deg ett åpent spørsmål om gangen. Skriv svaret med egne ord. AI gir deg umiddelbar tilbakemelding.
              </Step>
              <Step n={4} title="Bruk hjelpemidlene">
                Sliter du? Trykk <strong>Usikker? Spør AI-en</strong> for en hint-samtale. Flashcards-fanen lar deg repetere det du ikke har mestret ennå.
              </Step>
              <Step n={5} title="Ta vare på kurset">
                Last ned kurset som en selvinneholdt HTML-fil fra <strong>Last ned</strong>-fanen — åpnes offline når som helst.
              </Step>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-6 h-6 rounded-full bg-dg text-cream flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
        {n}
      </span>
      <div>
        <p className="font-heading text-sm text-dg mb-1">{title}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
