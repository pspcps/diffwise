export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function isObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function xmlName(value: string) {
  const safe = [...value].map((character, index) => {
    const valid = index === 0 ? /[A-Za-z_]/.test(character) : /[A-Za-z0-9_.-]/.test(character);
    return valid ? character : `_x${character.codePointAt(0)?.toString(16).toUpperCase()}_`;
  }).join('');
  return safe || 'item';
}

function jsonToXmlNode(value: JsonValue, name: string, depth: number): string {
  const indent = '  '.repeat(depth);
  const tag = xmlName(name);
  if (value === null) return `${indent}<${tag} nil="true" />`;

  if (Array.isArray(value)) {
    if (!value.length) return `${indent}<${tag} __devbench_type="array" />`;
    return `${indent}<${tag} __devbench_type="array">\n${value.map(item => jsonToXmlNode(item, 'item', depth + 1)).join('\n')}\n${indent}</${tag}>`;
  }

  if (isObject(value)) {
    const rawAttributes = value['@attributes'];
    const attributes = isObject(rawAttributes)
      ? Object.entries(rawAttributes).map(([key, item]) => ` ${xmlName(key)}="${escapeXml(item === null ? '' : String(item))}"`).join('')
      : '';
    const text = value['#text'];
    const textContent = typeof text === 'string' || typeof text === 'number' || typeof text === 'boolean'
      ? escapeXml(String(text))
      : '';
    const children = Object.entries(value)
      .filter(([key]) => key !== '@attributes' && key !== '#text')
      .map(([key, item]) => jsonToXmlNode(item, key, depth + 1));
    if (!textContent && !children.length) return `${indent}<${tag}${attributes} />`;
    const contents = [...(textContent ? [`${'  '.repeat(depth + 1)}${textContent}`] : []), ...children].join('\n');
    return `${indent}<${tag}${attributes}>\n${contents}\n${indent}</${tag}>`;
  }

  const type = typeof value;
  const typeAttribute = type === 'string' ? '' : ` __devbench_type="${type}"`;
  return `${indent}<${tag}${typeAttribute}>${escapeXml(String(value))}</${tag}>`;
}

export function jsonToXml(value: JsonValue) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${jsonToXmlNode(value, 'root', 0)}\n`;
}

function decodeXmlName(value: string) {
  return value.replace(/_x([0-9A-Fa-f]+)_/g, (_match, code: string) => {
    const point = Number.parseInt(code, 16);
    return Number.isFinite(point) ? String.fromCodePoint(point) : _match;
  });
}

function elementToJson(element: Element): JsonValue {
  const valueType = element.getAttribute('__devbench_type');
  const attributes = Object.fromEntries([...element.attributes]
    .filter(attribute => attribute.name !== 'nil' && attribute.name !== '__devbench_type')
    .map(attribute => [decodeXmlName(attribute.name), attribute.value]));
  const children = [...element.children];
  const text = [...element.childNodes]
    .filter(node => node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE)
    .map(node => node.nodeValue ?? '')
    .join('');

  if (element.getAttribute('nil') === 'true') return null;
  if (valueType === 'array') return children.map(elementToJson);
  if (valueType === 'number') return Number(text);
  if (valueType === 'boolean') return text === 'true';
  if (!children.length && !Object.keys(attributes).length) return text;

  const result: Record<string, JsonValue> = {};
  if (Object.keys(attributes).length) result['@attributes'] = attributes;
  if (children.length) {
    const grouped = new Map<string, JsonValue[]>();
    for (const child of children) {
      const name = decodeXmlName(child.tagName);
      const values = grouped.get(name) ?? [];
      values.push(elementToJson(child));
      grouped.set(name, values);
    }
    for (const [name, values] of grouped) result[name] = values.length === 1 ? values[0] : values;
  }
  if (text.trim()) result['#text'] = text.trim();
  return result;
}

export function parseXml(source: string): { value?: JsonValue; error?: string } {
  try {
    const document = new DOMParser().parseFromString(source, 'application/xml');
    const parserError = document.querySelector('parsererror');
    if (parserError) return { error: parserError.textContent?.trim() || 'Invalid XML.' };
    const root = document.documentElement;
    if (!root) return { error: 'XML document has no root element.' };
    return { value: root.tagName === 'root' ? elementToJson(root) : { [decodeXmlName(root.tagName)]: elementToJson(root) } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Invalid XML.' };
  }
}

export function validateXml(source: string) {
  return parseXml(source).error ?? null;
}