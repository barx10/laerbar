import { Course } from "./types";

export function generateHtml(course: Course): string {
  const mastered = course.concepts.filter((c) => c.mastered).length;
  const total = course.concepts.length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const date = new Date(course.created_at).toLocaleDateString("nb-NO");

  function conceptHtml(c: Course["concepts"][number], i: number) {
    const srsLabel = c.mastered && c.srs
      ? `<span class="srs-date">Neste repetisjon: ${new Date(c.srs.next_review).toLocaleDateString("nb-NO")}</span>`
      : "";

    const hintHtml = c.hint
      ? `<span class="hint-toggle">💡 Vis hint</span>
         <div class="hint-text">${c.hint}</div>`
      : "";

    return `
    <div class="concept-card ${c.mastered ? "mastered" : ""}">
      <div class="concept-header">
        <span class="concept-num">${c.mastered ? "✓" : i + 1}</span>
        <strong>${c.title}</strong>
        ${c.mastered ? '<span class="badge">Mestret</span>' : ""}
        ${srsLabel}
      </div>
      <div class="qa">
        <div class="question">❓ ${c.question}</div>
        <div class="answer">${c.answer}</div>
        ${hintHtml}
      </div>
      <div class="fc-section">
        <div class="fc-label">Flashcard — klikk for å snu</div>
        <div class="flashcard">
          <div class="fc-face fc-front">
            <span>${c.flashcard_front}</span>
            <span class="fc-tap-hint">Trykk for svar →</span>
          </div>
          <div class="fc-face fc-back">
            <span>${c.flashcard_back}</span>
          </div>
        </div>
      </div>
    </div>`;
  }

  const masteredConcepts = course.concepts.filter((c) => c.mastered);
  const unmasteredConcepts = course.concepts.filter((c) => !c.mastered);

  const unmasteredHtml = unmasteredConcepts.length > 0
    ? `<div class="section-label">Ikke mestret ennå (${unmasteredConcepts.length})</div>
       ${unmasteredConcepts.map((c, i) => conceptHtml(c, course.concepts.indexOf(c))).join("\n")}`
    : "";

  const masteredHtml = masteredConcepts.length > 0
    ? `<div class="section-label">Mestret (${masteredConcepts.length})</div>
       ${masteredConcepts.map((c) => conceptHtml(c, course.concepts.indexOf(c))).join("\n")}`
    : "";

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

  .progress-wrap { margin-bottom: 28px; }
  .progress-text { font-size: .88rem; color: #555; margin-bottom: 6px; }
  .progress-bar { width: 100%; background: rgba(0,0,0,.08); border-radius: 999px; height: 6px; }
  .progress-fill { height: 6px; border-radius: 999px; background: var(--lg); }

  .section-label { font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--mg); margin: 28px 0 10px; }

  .concept-card { background: white; border-radius: 6px; border: 1px solid rgba(0,0,0,.08); padding: 20px; margin-bottom: 12px; }
  .concept-card.mastered { border-color: rgba(61,107,74,.3); background: #f0faf3; }
  .concept-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .concept-num { width: 24px; height: 24px; border-radius: 50%; background: rgba(0,0,0,.08); display: flex; align-items: center; justify-content: center; font-size: .75rem; font-weight: 600; flex-shrink: 0; }
  .mastered .concept-num { background: var(--lg); color: white; }
  .badge { font-size: .7rem; background: var(--lg); color: white; padding: 2px 8px; border-radius: 10px; }
  .srs-date { margin-left: auto; font-size: .75rem; color: #666; }

  .qa { margin-bottom: 14px; }
  .question { font-size: .88rem; font-weight: 500; color: var(--dg); margin-bottom: 8px; }
  .answer { font-size: .86rem; color: #333; line-height: 1.65; padding: 10px 14px; background: #fafaf8; border-radius: 4px; border-left: 3px solid var(--gold); }

  .hint-toggle { display: inline-block; margin-top: 10px; font-size: .8rem; color: var(--mg); cursor: pointer; border: 1px solid rgba(0,0,0,.12); padding: 3px 10px; border-radius: 20px; user-select: none; }
  .hint-toggle:hover { border-color: var(--gold); color: var(--dg); }
  .hint-text { display: none; margin-top: 8px; font-size: .84rem; color: #555; padding: 8px 12px; background: rgba(201,168,76,.08); border-radius: 4px; border-left: 2px solid var(--gold); font-style: italic; }

  .fc-section { margin-top: 14px; }
  .fc-label { font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--gold); margin-bottom: 8px; }
  .flashcard { cursor: pointer; border-radius: 6px; border: 1px solid rgba(201,168,76,.35); overflow: hidden; min-height: 64px; }
  .fc-face { display: none; padding: 14px 16px; font-size: .88rem; line-height: 1.55; }
  .fc-face.fc-front { display: flex; justify-content: space-between; align-items: center; background: rgba(201,168,76,.07); font-weight: 500; color: var(--dg); gap: 12px; }
  .fc-tap-hint { font-size: .75rem; color: #aaa; white-space: nowrap; flex-shrink: 0; }
  .flashcard.flipped .fc-front { display: none; }
  .flashcard.flipped .fc-back { display: block; background: var(--dg); color: var(--cream); }
</style>
</head>
<body>
<header>
  <h1>${course.title}</h1>
  <p>Generert av Lærbar · ${date} · ${mastered} av ${total} konsepter mestret</p>
</header>
<main>
  <div class="progress-wrap">
    <div class="progress-text">${mastered} av ${total} konsepter mestret (${pct}%)</div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
  </div>
  ${unmasteredHtml}
  ${masteredHtml}
</main>
<script>
  document.querySelectorAll('.hint-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var hint = this.nextElementSibling;
      var visible = hint.style.display === 'block';
      hint.style.display = visible ? 'none' : 'block';
      this.textContent = visible ? '💡 Vis hint' : '▲ Skjul hint';
    });
  });
  document.querySelectorAll('.flashcard').forEach(function(card) {
    card.addEventListener('click', function() {
      this.classList.toggle('flipped');
    });
  });
</script>
</body>
</html>`;
}
