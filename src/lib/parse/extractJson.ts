export function extractJsonArray(text: string): unknown[] | null {
  if (!text) return null;
  let s = text.trim();
  // strip code fences
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  // try direct parse
  const tryParse = (candidate: string): unknown[] | null => {
    try {
      const v = JSON.parse(candidate);
      return Array.isArray(v) ? v : null;
    } catch {
      return null;
    }
  };
  const direct = tryParse(s);
  if (direct) return direct;
  // fallback: slice from first '[' to last ']'
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    return tryParse(s.slice(start, end + 1));
  }
  return null;
}
