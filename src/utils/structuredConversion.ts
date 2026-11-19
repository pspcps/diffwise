import { parseJsonWithRecovery } from "./jsonRecovery";
import YAML from "yaml";
import formatXml from "xml-formatter";
import { parseXml, type JsonValue } from "./jsonXml";
export type { JsonValue } from "./jsonXml";
export const compareKeys = (a: string, b: string) =>
  a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }) ||
  a.localeCompare(b, "en");
const record = (v: unknown): v is Record<string, JsonValue> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
export function sortJsonKeys(value: JsonValue): JsonValue {
  const seen = new WeakSet<object>();
  const visit = (v: JsonValue, depth: number): JsonValue => {
    if (depth > 500) throw Error("Data is too deeply nested to sort.");
    if (typeof v === "number" && !Number.isFinite(v))
      throw Error("JSON cannot represent non-finite numbers.");
    if (v !== null && typeof v === "object") {
      if (seen.has(v))
        throw Error("Cyclic YAML aliases cannot be converted to JSON.");
      seen.add(v);
      const result = Array.isArray(v)
        ? v.map((item) => visit(item, depth + 1))
        : Object.fromEntries(
            Object.keys(v)
              .sort(compareKeys)
              .map((key) => [key, visit(v[key], depth + 1)]),
          );
      seen.delete(v);
      return result;
    }
    return v;
  };
  return visit(value, 0);
}
export function jsonCompatibleValue(value: unknown): JsonValue {
  const json = JSON.stringify(value, (_key, v) => {
    if (typeof v === "number" && !Number.isFinite(v))
      throw Error("JSON cannot represent non-finite numbers.");
    return v;
  });
  if (json === undefined) throw Error("Input has no JSON value.");
  return JSON.parse(json) as JsonValue;
}

const own = (o: Record<string, JsonValue>, k: string, v: JsonValue) =>
  Object.defineProperty(o, k, {
    value: v,
    enumerable: true,
    configurable: true,
    writable: true,
  });
const mixedCase = (s: string) => s !== s.toUpperCase() && s !== s.toLowerCase();
function parentKey(
  o: Record<string, JsonValue>,
  key: string,
  merge: boolean,
): string {
  if (!merge) return key;
  const existing = Object.keys(o).find(
    (k) => k.toLowerCase() === key.toLowerCase(),
  );
  if (!existing) return key;
  // Prefer Secret over SECRET regardless of line/sort order. Never change leaf casing.
  if (mixedCase(key) && !mixedCase(existing)) {
    own(o, key, o[existing]);
    delete o[existing];
    return key;
  }
  return existing;
}
function mergeObjects(
  target: Record<string, JsonValue>,
  source: Record<string, JsonValue>,
  mergeParents: boolean,
) {
  for (const [original, value] of Object.entries(source)) {
    const key = record(value)
      ? parentKey(target, original, mergeParents)
      : original;
    if (Object.hasOwn(target, key) && record(target[key]) && record(value))
      mergeObjects(
        target[key] as Record<string, JsonValue>,
        value,
        mergeParents,
      );
    else own(target, key, value);
  }
  return target;
}
export interface EnvOptions {
  nestDoubleUnderscore: boolean;
  nestDot: boolean;
  autoParseTypes: boolean;
  mergeParentKeys?: boolean;
}
function assignment(line: string) {
  const eq = line.indexOf("="),
    colon = line.indexOf(":");
  const at = eq < 0 ? colon : colon < 0 ? eq : Math.min(eq, colon);
  return {
    key: (at < 0 ? line : line.slice(0, at)).trim(),
    text: at < 0 ? "" : line.slice(at + 1).trim(),
  };
}
export function parseEnvToNestedJson(
  raw: string,
  options: EnvOptions,
): Record<string, JsonValue> {
  const result: Record<string, JsonValue> = {};
  for (const [idx, rawLine] of raw.split(/\r?\n/).entries()) {
    const line = rawLine.trim().replace(/^export\s+/, "");
    if (!line || line.startsWith("#") || line.startsWith("//")) continue;
    const { key, text } = assignment(line);
    if (!key) continue;
    let value: JsonValue = text;
    const quoted = text.startsWith('"') || text.startsWith("'");
    if (quoted) {
      if (text.length < 2 || !text.endsWith(text[0]))
        throw Error(`Line ${idx + 1}: close the quoted value.`);
      value = text.slice(1, -1);
      if (text[0] === '"')
        value = value.replace(
          /\\([\\"nrt])/g,
          (_match, character: string) =>
            ({ n: "\n", r: "\r", t: "\t", '"': '"', "\\": "\\" })[character] ||
            character,
        );
    } else if (options.autoParseTypes && text.trim()) {
      try {
        const parsed: unknown = JSON.parse(text);
        if (
          parsed === null ||
          ["string", "number", "boolean", "object"].includes(typeof parsed)
        )
          value = parsed as JsonValue;
      } catch {
        if (/^(true|false|null)$/i.test(text))
          value = JSON.parse(text.toLowerCase()) as JsonValue;
      }
    }
    const separator =
      options.nestDoubleUnderscore && options.nestDot
        ? /__|\./
        : options.nestDoubleUnderscore
          ? /__/
          : options.nestDot
            ? /\./
            : null;
    const segments = (separator ? key.split(separator) : [key]).map((s) =>
      s.trim(),
    );
    if (segments.some((s) => !s))
      throw Error(`Line ${idx + 1}: empty key path segment.`);
    let node = result;
    for (const seg of segments.slice(0, -1)) {
      const name = parentKey(node, seg, options.mergeParentKeys !== false);
      if (Object.hasOwn(node, name) && !record(node[name]))
        throw Error(
          `Line ${idx + 1}: "${name}" is both a value and a parent object. Rename one key.`,
        );
      if (!Object.hasOwn(node, name)) own(node, name, {});
      node = node[name] as Record<string, JsonValue>;
    }
    const last = record(value)
      ? parentKey(node, segments.at(-1)!, options.mergeParentKeys !== false)
      : segments.at(-1)!;
    if (Object.hasOwn(node, last) && record(node[last]) && record(value))
      mergeObjects(
        node[last] as Record<string, JsonValue>,
        value,
        options.mergeParentKeys !== false,
      );
    else if (Object.hasOwn(node, last) && record(node[last]) !== record(value))
      throw Error(
        `Line ${idx + 1}: "${last}" is both a value and an object. Rename one key.`,
      );
    else own(node, last, value);
  }
  return result;
}
export function sortEnvLines(text: string) {
  const entries: { key: string; lines: string[] }[] = [];
  let pending: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) {
      pending.push(line);
      continue;
    }
    entries.push({
      key: assignment(trimmed.replace(/^export\s+/, "")).key,
      lines: [...pending, line],
    });
    pending = [];
  }
  return [
    ...entries
      .sort((a, b) =>
        a.key.replaceAll("__", ".").toLowerCase() ===
        b.key.replaceAll("__", ".").toLowerCase()
          ? 0
          : compareKeys(a.key, b.key),
      )
      .flatMap((e) => e.lines),
    ...pending,
  ].join("\n");
}
export function jsonToEnvString(
  obj: JsonValue,
  prefix = "",
  nestDoubleUnderscore = true,
): string {
  if (!record(obj)) throw Error("ENV conversion requires a JSON object.");
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix
      ? `${prefix}${nestDoubleUnderscore ? "__" : "."}${key}`
      : key;
    if (record(value))
      lines.push(jsonToEnvString(value, path, nestDoubleUnderscore));
    else if (typeof value === "string") {
      const quote =
        value === "" ||
        /[\s#"'\\]/.test(value) ||
        /^(?:true|false|null|-?\d)/i.test(value) ||
        value.startsWith("{") ||
        value.startsWith("[");
      lines.push(`${path}=${quote ? JSON.stringify(value) : value}`);
    } else lines.push(`${path}=${JSON.stringify(value)}`);
  }
  return lines.filter(Boolean).join("\n");
}
export function parseStructuredInput(
  text: string,
  allowYamlFlow = false,
  repairJson = false,
): {
  value: JsonValue;
  format: "json" | "xml" | "yaml";
  repaired?: boolean;
} {
  try {
    return { value: JSON.parse(text) as JsonValue, format: "json" };
  } catch (error) {
    if (
      !allowYamlFlow &&
      (text.trimStart().startsWith("{") || text.trimStart().startsWith("["))
    ) {
      if (repairJson) return { ...parseJsonWithRecovery(text), format: "json" };
      throw error;
    }
  }
  if (text.trimStart().startsWith("<")) {
    const parsed = parseXml(text);
    if (parsed.error || parsed.value === undefined)
      throw Error(parsed.error || "Invalid XML");
    return { value: parsed.value, format: "xml" };
  }
  const value: unknown = YAML.parse(text, { maxAliasCount: 100 });
  if (!allowYamlFlow && !record(value) && !Array.isArray(value))
    throw Error("Paste valid JSON, XML, or a YAML object/array.");
  return { value: jsonCompatibleValue(value), format: "yaml" };
}
export function sortedYamlSource(text: string) {
  const document = YAML.parseDocument(text);
  if (document.errors.length) throw Error(document.errors[0].message);
  const visit = (node: unknown) => {
    if (YAML.isMap(node)) {
      node.items.sort((a, b) => compareKeys(String(a.key), String(b.key)));
      node.items.forEach((p) => visit(p.value));
    } else if (YAML.isSeq(node)) node.items.forEach(visit);
  };
  visit(document.contents);
  return document.toString();
}
export function sortedXmlSource(text: string) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror"))
    throw Error(doc.querySelector("parsererror")!.textContent || "Invalid XML");
  const visit = (el: Element) => {
    [...el.children].forEach(visit);
    // Reordering mixed text/element content changes its meaning: leave it untouched.
    if (
      [...el.childNodes].some(
        (n) => (n.nodeType === 3 || n.nodeType === 4) && n.textContent?.trim(),
      )
    )
      return;
    const children = [...el.children].sort((a, b) =>
      compareKeys(a.tagName, b.tagName),
    );
    children.forEach((child) => el.appendChild(child));
  };
  visit(doc.documentElement);
  const declaration = text.match(/^\s*(<\?xml[^?]*\?>)/)?.[1];
  const serialized = new XMLSerializer().serializeToString(doc);
  return formatXml(
    (declaration && !serialized.startsWith("<?xml") ? declaration + "\n" : "") +
      serialized,
    { indentation: "  ", collapseContent: true },
  );
}
