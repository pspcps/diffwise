import { jsonrepair } from "jsonrepair";
import type { JsonValue } from "./jsonXml";
export const JSON_REPAIR_WARNING =
  "JSON syntax was repaired automatically. Review inferred values and closing brackets before using the result.";
export function parseJsonWithRecovery(
  text: string,
  enabled = true,
): { value: JsonValue; repaired: boolean } {
  try {
    return { value: JSON.parse(text) as JsonValue, repaired: false };
  } catch (originalError) {
    if (!enabled) throw originalError;
    if (!text.trim()) throw Error("Enter JSON to preview it.");
    if (text.length > 2000000)
      throw Error(
        "Automatic JSON repair supports up to 2 MB. Fix or split this input first.",
      );
    try {
      return {
        value: JSON.parse(jsonrepair(text)) as JsonValue,
        repaired: true,
      };
    } catch {
      throw Error(
        "Unable to repair this JSON. Check missing values, quotes and brackets. Your input has been kept.",
      );
    }
  }
}
