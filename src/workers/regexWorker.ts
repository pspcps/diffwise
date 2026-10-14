interface RegexRequest {
  pattern: string;
  flags: string;
  text: string;
}

interface RegexMatch {
  text: string;
  index: number;
  end: number;
  captures: (string | null)[];
  namedCaptures: Record<string, string | undefined>;
}

self.onmessage = (event: MessageEvent<RegexRequest>) => {
  const { pattern, flags, text } = event.data;
  try {
    const expression = new RegExp(pattern, flags);
    const matches: RegexMatch[] = [];
    let match: RegExpExecArray | null;
    while ((match = expression.exec(text)) !== null) {
      matches.push({
        text: match[0],
        index: match.index,
        end: match.index + match[0].length,
        captures: match.slice(1),
        namedCaptures: match.groups ? { ...match.groups } : {},
      });
      if (!expression.global) break;
      if (match[0].length === 0) {
        expression.lastIndex += expression.unicode ? [...text.slice(expression.lastIndex)][0]?.length ?? 1 : 1;
      }
      if (matches.length >= 1000) break;
    }
    self.postMessage({ matches, capped: matches.length >= 1000 });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Invalid regular expression.' });
  }
};