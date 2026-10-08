import type { LeanNotation } from "./types.ts";

export const parseNotations = (
  fileContent: string,
  filePath: string
): readonly LeanNotation[] =>
  (() => {
    const notationRegex =
      /(?:infix[lr]?|postfix|prefix|notation)\s*(?::\d+)?\s*["']([^"']+)["']\s*=>\s*([A-Za-z0-9_.]+)/g;
    const results: LeanNotation[] = [];

    let match: RegExpExecArray | null;
    while ((match = notationRegex.exec(fileContent)) !== null) {
      const symbol = match[1].trim();
      const target = match[2].trim();

      // Reject letter/digit variable shortcuts (e.g., "α" => K.gen, "n" => finrank)
      if (/^[\p{L}\p{N}_']+$/u.test(symbol)) continue;

      const line = fileContent.slice(0, match.index).split("\n").length;
      results.push({
        symbol,
        target,
        raw: match[0],
        filePath,
        line,
      });
    }

    return Object.freeze(results);
  })();
