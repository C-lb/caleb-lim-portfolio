// Short-form text derivation for the site-wide "(Short form)" toggle.
// Deterministic at build time: the condensed variant is the first one or two
// sentences of the field, which in this content style carry the thesis. Both
// variants ship in the HTML; a root data-shortform attribute picks which one
// shows (see Base.astro).
export function shortForm(text: string, maxSentences = 2, targetChars = 90): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  const sentences = flat.match(/[^.!?]+[.!?]+(?:\s|$)/g)?.map((s) => s.trim()) ?? [flat];
  const out: string[] = [];
  for (const s of sentences) {
    out.push(s);
    if (out.length >= maxSentences) break;
    if (out.join(' ').length >= targetChars) break;
  }
  return out.join(' ');
}
