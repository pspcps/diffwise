import xmlFormat from 'xml-formatter';
import YAML from 'yaml';

/**
 * Recursively sorts all object keys in alphabetical order (natural sort).
 * Handles deeply nested objects, arrays of objects, and mixed values.
 */
export function sortJsonKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortJsonKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
    for (const key of keys) {
      sorted[key] = sortJsonKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

/**
 * Detects whether the input text is JSON, XML/HTML, YAML, or plain text.
 */
export function detectFormat(text: string): 'json' | 'xml' | 'yaml' | 'text' {
  const trimmed = text.trim();
  if (!trimmed) return 'text';

  // 1. Check for JSON
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // not valid JSON, check others
    }
  }

  // 2. Check for XML / HTML
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    // Quick heuristic: has opening and closing tags or XML declaration
    if (/<[a-zA-Z0-9_:-]+(\s+[^>]*)?>[\s\S]*<\/[a-zA-Z0-9_:-]+>/.test(trimmed) || trimmed.startsWith('<?xml')) {
      return 'xml';
    }
  }

  // 3. Check for YAML
  // Must have key: value patterns and not be plain sentences
  if (/^[a-zA-Z0-9_"\s-]+:\s*.+$/m.test(trimmed)) {
    try {
      const parsed = YAML.parse(trimmed);
      if (parsed !== null && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return 'yaml';
      }
    } catch {
      // ignore
    }
  }

  return 'text';
}

/**
 * Formats JSON string with optional recursive key sorting and configurable indentation.
 */
export function formatJson(
  text: string,
  sortKeys: boolean = true,
  indent: number = 2
): { success: boolean; result: string; error?: string } {
  try {
    const parsed = JSON.parse(text);
    const dataToSerialize = sortKeys ? sortJsonKeys(parsed) : parsed;
    const formatted = JSON.stringify(dataToSerialize, null, indent);
    return { success: true, result: formatted };
  } catch (err: unknown) {
    return {
      success: false,
      result: text,
      error: err instanceof Error ? err.message : 'Invalid JSON syntax',
    };
  }
}

/**
 * Fallback regex-based HTML/XML beautifier for lenient HTML markup.
 */
function fallbackBeautifyHtml(html: string): string {
  let formatted = '';
  let indent = 0;
  const tab = '  ';

  // Clean existing whitespace between tags
  const sanitized = html.replace(/>\s+</g, '><').trim();

  // Split tags
  const tokens = sanitized.split(/(<[^>]+>)/g).filter(Boolean);

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('</')) {
      // Closing tag
      indent = Math.max(0, indent - 1);
      formatted += `${tab.repeat(indent)}${trimmed}\n`;
    } else if (
      trimmed.startsWith('<') &&
      !trimmed.endsWith('/>') &&
      !trimmed.startsWith('<!') &&
      !trimmed.startsWith('<?') &&
      !/^<(img|input|br|hr|meta|link|base|area|col|embed|param|source|track|wbr)/i.test(trimmed)
    ) {
      // Opening tag (non-void, non-self-closing)
      formatted += `${tab.repeat(indent)}${trimmed}\n`;
      indent++;
    } else if (trimmed.startsWith('<')) {
      // Self closing or void tag
      formatted += `${tab.repeat(indent)}${trimmed}\n`;
    } else {
      // Text node
      formatted += `${tab.repeat(indent)}${trimmed}\n`;
    }
  }

  return formatted.trim();
}

/**
 * Formats XML or HTML markup with clean indentation and line separation.
 */
export function formatXmlOrHtml(
  text: string,
  indentation: string = '  '
): { success: boolean; result: string; error?: string } {
  const trimmed = text.trim();
  if (!trimmed) return { success: true, result: '' };

  // Try standard xml-formatter first
  try {
    const formatted = xmlFormat(trimmed, {
      indentation,
      collapseContent: true,
      lineSeparator: '\n',
      whiteSpaceAtEndOfSelfclosingTag: true,
    });
    return { success: true, result: formatted };
  } catch {
    // If strict XML parser fails (e.g. unclosed HTML void tags), use resilient HTML beautifier
    try {
      const fallback = fallbackBeautifyHtml(trimmed);
      return { success: true, result: fallback };
    } catch (err: unknown) {
      return {
        success: false,
        result: text,
        error: err instanceof Error ? err.message : 'Invalid XML/HTML markup',
      };
    }
  }
}

/**
 * Formats YAML string with standard 2-space indentation and optional key sorting.
 */
export function formatYaml(
  text: string,
  sortKeys: boolean = true
): { success: boolean; result: string; error?: string } {
  try {
    const parsed = YAML.parse(text);
    if (parsed === null || typeof parsed !== 'object') {
      return {
        success: false,
        result: text,
        error: 'Input does not parse into a valid YAML object or array',
      };
    }
    const dataToSerialize = sortKeys ? sortJsonKeys(parsed) : parsed;
    const formatted = YAML.stringify(dataToSerialize, { indent: 2 });
    return { success: true, result: formatted.trim() };
  } catch (err: unknown) {
    return {
      success: false,
      result: text,
      error: err instanceof Error ? err.message : 'Invalid YAML syntax',
    };
  }
}

/**
 * Normalizes whitespace: converts CRLF/CR to LF, trims trailing whitespace on every line.
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

export type SupportedFormat = 'auto' | 'json' | 'xml' | 'yaml' | 'normalize';

/**
 * Formats content according to requested format or auto-detection.
 */
export function formatContent(
  text: string,
  targetType: SupportedFormat = 'auto',
  sortKeys: boolean = true
): { success: boolean; result: string; detectedType: string; error?: string } {
  if (!text || !text.trim()) {
    return { success: true, result: text, detectedType: 'text' };
  }

  let effectiveType: 'json' | 'xml' | 'yaml' | 'normalize' | 'text' = 'normalize';

  if (targetType === 'auto') {
    const detected = detectFormat(text);
    if (detected === 'json') effectiveType = 'json';
    else if (detected === 'xml') effectiveType = 'xml';
    else if (detected === 'yaml') effectiveType = 'yaml';
    else effectiveType = 'normalize';
  } else {
    effectiveType = targetType;
  }

  if (effectiveType === 'json') {
    const res = formatJson(text, sortKeys);
    return {
      success: res.success,
      result: res.result,
      detectedType: 'JSON' + (sortKeys && res.success ? ' (A-Z)' : ''),
      error: res.error,
    };
  }

  if (effectiveType === 'xml') {
    const res = formatXmlOrHtml(text);
    return {
      success: res.success,
      result: res.result,
      detectedType: 'XML/HTML',
      error: res.error,
    };
  }

  if (effectiveType === 'yaml') {
    const res = formatYaml(text, sortKeys);
    return {
      success: res.success,
      result: res.result,
      detectedType: 'YAML' + (sortKeys && res.success ? ' (A-Z)' : ''),
      error: res.error,
    };
  }

  // Normalize plain text whitespace
  const normalized = normalizeWhitespace(text);
  return {
    success: true,
    result: normalized,
    detectedType: 'Normalized Text',
  };
}
