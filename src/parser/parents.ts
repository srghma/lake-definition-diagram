import type { LeanParentRef } from "../types.ts";
import { splitTopLevelCommas } from "../formatter.ts";

export const resolveParentRefs = (
  extendsClause: string | undefined,
  knownNotations: ReadonlyMap<string, string>
): readonly LeanParentRef[] =>
  (() => {
    if (!extendsClause) return [];

    const sortedNotations = Array.from(knownNotations.entries()).sort(
      (a, b) => b[0].length - a[0].length
    );

    const refs: LeanParentRef[] = [];
    const seen = new Set<string>();

    for (const rawPart of splitTopLevelCommas(extendsClause)) {
      const part = rawPart.trim().replace(/[()]/g, "");
      const tokens = part.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) continue;

      let matched = false;

      // 1. Exact token match in notation map
      for (const tok of tokens) {
        if (knownNotations.has(tok)) {
          const target = knownNotations.get(tok)!;
          if (!seen.has(target)) {
            seen.add(target);
            refs.push({ target, label: tok, isNotation: true });
          }
          matched = true;
          break;
        }
      }
      if (matched) continue;

      // 2. Substring match across notations
      for (const [sym, target] of sortedNotations) {
        if (part.includes(sym)) {
          if (!seen.has(target)) {
            seen.add(target);
            refs.push({ target, label: sym, isNotation: true });
          }
          matched = true;
          break;
        }
      }
      if (matched) continue;

      // 3. Match by name
      const base = tokens[0]?.replace(/\.\{[^}]+\}/, "");
      if (base && base !== "where" && !seen.has(base)) {
        seen.add(base);
        refs.push({ target: base, label: base, isNotation: false });
      }
    }

    return Object.freeze(refs);
  })();
