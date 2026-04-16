import { NextRequest, NextResponse } from "next/server";
import { Concept } from "@/lib/types";

// Enkel TSV-basert Anki-eksport (kompatibel med Anki import)
export async function POST(req: NextRequest) {
  const { concepts }: { concepts: Concept[] } = await req.json();

  const lines = concepts.map((c) =>
    `${c.flashcard_front}\t${c.flashcard_back}`
  );

  const tsv = lines.join("\n");

  return new NextResponse(tsv, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="laerbar-flashcards.txt"',
    },
  });
}
