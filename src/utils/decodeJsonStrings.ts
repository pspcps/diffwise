import type { JsonValue } from "./jsonXml";

/** Decode only complete JSON objects/arrays, never arbitrary escapes or scalar strings. */
export function decodeJsonStrings(value: JsonValue): {
  value: JsonValue;
  decoded: number;
} {
  let decoded = 0;
  let budget = 2_000_000;
  const visit = (input: JsonValue, depth: number): JsonValue => {
    if (depth > 500) throw Error("Data is too deeply nested to decode.");
    let current = input;
    if (typeof input === "string") {
      let candidate: JsonValue = input;
      for (
        let layer = 0;
        layer < 10 && typeof candidate === "string";
        layer++
      ) {
        const text = candidate.trim();
        if (!text || !["{", "[", '"'].includes(text[0]) || text.length > budget)
          break;
        budget -= text.length;
        try {
          candidate = JSON.parse(text) as JsonValue;
        } catch {
          break;
        }
      }
      if (candidate !== null && typeof candidate === "object") {
        current = candidate;
        decoded++;
      }
    }
    if (Array.isArray(current))
      return current.map((item) => visit(item, depth + 1));
    if (current !== null && typeof current === "object") {
      return Object.fromEntries(
        Object.entries(current).map(([key, child]) => [
          key,
          visit(child, depth + 1),
        ]),
      );
    }
    return current;
  };
  return { value: visit(value, 0), decoded };
}
