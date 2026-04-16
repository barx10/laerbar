import { Course } from "./types";

export function generateHtml(course: Course): string {
  const mastered = course.concepts.filter((c) => c.mastered).length;

  const conceptsHtml = course.concepts
    .map(
      (c, i) => `
    <div class="concept-card ${c.mastered ? "mastered" : ""}">
      <div class="concept-header">
        <span class="concept-num">${c.mastered ? "✓" : i + 1}</span>
        <strong>${c.title}</strong>
        ${c.mastered ? '<span class="badge">Mestret</span>' : ""}
      </div>
      <div class="qa">
        <div class="question">❓ ${c.question}</div>
        <div class="answer">${c.answer}</div>
      </div>
      <div class="flashcard">
        <div class="fc-label">Flashcard</div>
        <div class="fc-front">${c.flashcard_front}</div>
        <div class="fc-back">${c.flashcard_back}</div>
      </div>
    </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${course.title} — Lærbar</title>
<style>
  :root { --cream:#f5f0e8; --dg:#1a2e20; --mg:#2d4a35; --gold:#c9a84c; --lg:#3d6b4a; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--cream); font-family: system-ui, sans-serif; color: #1a1a1a; min-height: 100vh; }
  header { background: var(--dg); color: var(--cream); padding: 24px 32px; border-bottom: 3px solid var(--gold); }
  header h1 { font-size: 1.5rem; margin-bottom: 4px; }
  header p { font-size: .85rem; opacity: .75; }
  main { max-width: 720px; margin: 0 auto; padding: 32px 20px; }
  .meta { font-size: .85rem; color: #666; margin-bottom: 24px; }
  .concept-card { background: white; border-radius: 6px; border: 1px solid rgba(0,0,0,.08); padding: 20px; margin-bottom: 14px; }
  .concept-card.mastered { border-color: rgba(61,107,74,.3); background: #f0faf3; }
  .concept-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .concept-num { width: 24px; height: 24px; border-radius: 50%; background: rgba(0,0,0,.08); display: flex; align-items: center; justify-content: center; font-size: .75rem; font-weight: 600; flex-shrink: 0; }
  .mastered .concept-num { background: var(--lg); color: white; }
  .badge { margin-left: auto; font-size: .7rem; background: var(--lg); color: white; padding: 2px 8px; border-radius: 10px; }
  .qa { margin-bottom: 12px; }
  .question { font-size: .88rem; font-weight: 500; color: var(--dg); margin-bottom: 6px; }
  .answer { font-size: .86rem; color: #333; line-height: 1.65; padding: 10px 14px; background: #fafaf8; border-radius: 4px; border-left: 3px solid var(--gold); }
  .flashcard { margin-top: 12px; padding: 12px; background: rgba(201,168,76,.06); border-radius: 4px; }
  .fc-label { font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--gold); margin-bottom: 6px; }
  .fc-front { font-size: .86rem; font-weight: 500; margin-bottom: 4px; }
  .fc-back { font-size: .84rem; color: #555; }
</style>
</head>
<body>
<header>
  <h1>${course.title}</h1>
  <p>Generert av Lærbar · ${new Date(course.created_at).toLocaleDateString("nb-NO")} · ${mastered} av ${course.concepts.length} konsepter mestret</p>
</header>
<main>
  <p class="meta">${course.concepts.length} kjernekonsepter</p>
  ${conceptsHtml}
</main>
</body>
</html>`;
}
