export function activePortfolioSection(
  sections: readonly { id: string; top: number }[],
  activationTop: number,
  atEnd = false,
): string | undefined {
  if (atEnd) return sections.at(-1)?.id;
  let active = sections[0]?.id;
  for (const section of sections) {
    if (section.top > activationTop) break;
    active = section.id;
  }
  return active;
}
