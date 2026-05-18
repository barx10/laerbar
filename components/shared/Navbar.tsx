"use client";

import Image from "next/image";
import { useState } from "react";
import SettingsModal from "./SettingsModal";
import { useLanguage } from "@/lib/language-context";

export default function Navbar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [omOpen, setOmOpen] = useState(false);
  const [hjelpOpen, setHjelpOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  return (
    <>
      <header className="bg-dg text-cream px-6 py-5 flex justify-between items-end border-b-[3px] border-gold">
        <div>
          <h1 className="font-heading text-2xl leading-tight">{t.appName}</h1>
          <div className="text-xs text-gl mt-1 opacity-85">{t.tagline}</div>
        </div>
        <div className="flex gap-2.5 items-center">
          <div className="flex border border-white/30 rounded overflow-hidden text-xs font-medium">
            <button
              onClick={() => setLang("no")}
              className={`px-2.5 py-1.5 transition-all ${
                lang === "no" ? "bg-gold text-dg" : "text-cream/80 hover:text-gold"
              }`}
            >
              NO
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-2.5 py-1.5 transition-all border-l border-white/30 ${
                lang === "en" ? "bg-gold text-dg" : "text-cream/80 hover:text-gold"
              }`}
            >
              EN
            </button>
          </div>
          <button
            onClick={() => setOmOpen(true)}
            className="text-cream/80 border border-white/30 rounded px-4 py-1.5 text-xs font-medium hover:border-gold hover:text-gold transition-all"
          >
            {t.navOm}
          </button>
          <button
            onClick={() => setHjelpOpen(true)}
            className="text-cream/80 border border-white/30 rounded px-4 py-1.5 text-xs font-medium hover:border-gold hover:text-gold transition-all"
          >
            {t.navHjelp}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-cream/80 border border-white/30 rounded px-4 py-1.5 text-xs font-medium hover:border-gold hover:text-gold transition-all"
          >
            {t.navApi}
          </button>
        </div>
      </header>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

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
            <h2 className="font-heading text-xl text-dg mb-3">{t.omTitle}</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-5">{t.omDesc}</p>
            <div className="border-t border-black/8 pt-4 mb-5">
              <p className="text-sm font-semibold text-dg mb-1">{t.omAuthorName}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{t.omAuthorDesc}</p>
            </div>
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
            <h2 className="font-heading text-xl text-dg mb-5">{t.hjelpTitle}</h2>
            <div className="flex flex-col gap-5">
              {lang === "en" ? <HelpStepsEn /> : <HelpStepsNo />}
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

function HelpStepsNo() {
  return (
    <>
      <Step n={1} title="Sett inn API-nøkkel">
        Trykk <strong>API</strong> øverst til høyre. Lim inn din Google Gemini API-nøkkel — den lagres kun lokalt i nettleseren. Nøkkelen får du gratis på{" "}
        <span className="text-dg font-medium">aistudio.google.com</span>.
      </Step>
      <Step n={2} title="Last opp fagstoff">
        Trykk <strong>Nytt kurs</strong> og dra inn en PDF (maks 12 MB). KI trekker ut 5–10 kjernekonsepter og lagrer samtidig teksten så du senere kan spørre AI-en direkte om artikkelen.
      </Step>
      <Step n={3} title="Lær: vurder selv før du sjekker">
        I <strong>Lær</strong>-fanen får du ett åpent spørsmål om gangen. Før du sender svaret, velger du hvor trygg du er:{" "}
        <em>Usikker / Delvis / Trygg</em>. AI-en tar selvvurderingen med i tilbakemeldingen og sier om du traff — det trener deg til å kalibrere hva du faktisk kan.
      </Step>
      <Step n={4} title="Mestret krever to bekreftelser">
        Et konsept regnes som mestret først etter <strong>to</strong> vellykkede gjenkallinger — første i Lær, andre etter minst én dag i Repeter. Én riktig i farten er ikke nok: hukommelsen må prøves med mellomrom.
      </Step>
      <Step n={5} title="Dagens kø på forsiden">
        Når kort forfaller viser forsiden en <strong>Dagens økt</strong>-knapp. Den blander kort på tvers av alle kurs (interleaving) og prioriterer kort du har bommet på før — det gir sterkere læring enn å gå ett kurs om gangen.
      </Step>
      <Step n={6} title="Smart spacing i Repeter">
        Hvert kort har en egen læringskurve. Svarer du <em>Kunne det</em> konsistent, vokser intervallet raskt (3 → 6 → 17 dager …). Svarer du <em>Husket ikke</em>, krymper det ned igjen. Du ser neste intervall på hver knapp før du velger.
      </Step>
      <Step n={7} title="Spør AI-en — to varianter">
        I <strong>Lær</strong>: <em>Usikker? Spør AI-en</em> gir deg hint uten å røpe svaret mens du jobber med et konsept. I <strong>Oversikt</strong>: <em>Spør om kurset</em> svarer på frie spørsmål om selve artikkelen — forfatter, tall, definisjoner — basert på teksten som ble lagret ved opplasting.
      </Step>
      <Step n={8} title="Sikkerhetskopi og offline">
        Alt ligger i nettleseren din, så ta jevnlig <strong>Last ned sikkerhetskopi</strong> under API-menyen. Et helt kurs kan også eksporteres som selvinneholdt HTML fra <strong>Last ned</strong>-fanen — åpnes offline når som helst.
      </Step>
    </>
  );
}

function HelpStepsEn() {
  return (
    <>
      <Step n={1} title="Add your API key">
        Click <strong>API</strong> in the top right. Paste your Google Gemini API key — it is stored locally in your browser only. Get the key for free at{" "}
        <span className="text-dg font-medium">aistudio.google.com</span>.
      </Step>
      <Step n={2} title="Upload study material">
        Click <strong>New course</strong> and drop in a PDF (max 12 MB). The AI extracts 5–10 core concepts and saves the text so you can later chat with the AI directly about the article.
      </Step>
      <Step n={3} title="Learn: rate yourself before checking">
        In the <strong>Learn</strong> tab you get one open question at a time. Before submitting your answer, choose your confidence:{" "}
        <em>Unsure / Partial / Confident</em>. The AI factors this in and tells you whether you were well calibrated.
      </Step>
      <Step n={4} title="Mastered requires two confirmations">
        A concept is only considered mastered after <strong>two</strong> successful recalls — first in Learn, then after at least one day in Review. One quick answer is not enough: memory must be tested with spacing.
      </Step>
      <Step n={5} title="Today's queue on the home screen">
        When cards are due, the home screen shows a <strong>Today&apos;s session</strong> button. It mixes cards across all courses (interleaving) and prioritises cards you have missed before — stronger learning than going course by course.
      </Step>
      <Step n={6} title="Smart spacing in Review">
        Each card has its own learning curve. Answer <em>Got it</em> consistently and the interval grows quickly (3 → 6 → 17 days…). Answer <em>Forgot</em> and it resets. You see the next interval on each button before choosing.
      </Step>
      <Step n={7} title="Ask the AI — two modes">
        In <strong>Learn</strong>: the chat sidebar gives hints without revealing the answer while you work on a concept. In <strong>Overview</strong>: ask free questions about the article itself — author, numbers, definitions — based on the text stored at upload.
      </Step>
      <Step n={8} title="Backup and offline">
        Everything is in your browser, so regularly download a backup from the API menu. A full course can also be exported as a self-contained HTML file from the <strong>Download</strong> tab — open it offline any time.
      </Step>
    </>
  );
}
