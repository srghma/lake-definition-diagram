import type { LeanEntity, LeanParentRef } from "./types.ts";
import { resolvePackageOrigin } from "./scanner.ts";
import { escapeRegex, sanitizeD2Id } from "./sanitize.ts";
import { formatLeanEntity, splitTopLevelCommas } from "./formatter.ts";

export * from "./sanitize.ts";
export * from "./formatter.ts";
export * from "./notation.ts";

export const extractEntityFromSource = (
  name: string,
  content: string,
  filePath: string,
  knownNotations: ReadonlyMap<string, string>
): LeanEntity | null =>
  (() => {
    const escapedName = escapeRegex(name);

    // 1. Match declaration start
    const declRegex = new RegExp(
      `(?:^[ \\t]*\\/--((?:(?!\\-\\/)[\\s\\S])*?)\\-\\/(?:[ \\t]*\\r?\\n|\\s*))?` +
      `(?:^[ \\t]*@[^\\n]+\\s*)*` +
      `^[ \\t]*(class|structure)\\s+(${escapedName})(?![.\\w'])`,
      "m"
    );

    const match = declRegex.exec(content);
    if (!match) return null;

    const doc = match[1]?.trim();
    const kind = match[2] as "class" | "structure";
    const declKeyMatch = match[0].match(new RegExp(`(?:class|structure)\\s+${escapedName}`));
    const declOffset = match.index + (declKeyMatch?.index ?? 0);
    const line = content.slice(0, declOffset).split("\n").length;

    // Collect all lines of declaration block (until first unindented non-empty line)
    const restLines = content.slice(declOffset).split("\n");
    const blockLines = [restLines[0]];
    for (let i = 1; i < restLines.length; i++) {
      const l = restLines[i];
      if (l.length > 0 && !/^\s/.test(l)) break;
      blockLines.push(l);
    }
    while (blockLines.length > 0 && blockLines[blockLines.length - 1].trim() === "") {
      blockLines.pop();
    }
    const rawBlock = blockLines.join("\n");

    // Decompose where
    const whereMatch = rawBlock.match(/\bwhere\b/);
    const headerPart = whereMatch ? rawBlock.slice(0, whereMatch.index).trim() : rawBlock.trim();
    const bodyPart = whereMatch ? rawBlock.slice(whereMatch.index + 5) : "";

    // Decompose extends
    const extMatch = headerPart.match(/\bextends\b([\s\S]*)$/);
    const headPart = extMatch
      ? headerPart.slice(0, extMatch.index).replace(/\s+/g, " ").trim()
      : headerPart.replace(/\s+/g, " ").trim();
    const extendsClause = extMatch ? extMatch[1].replace(/\s+/g, " ").trim() : undefined;
    const params = headPart.slice(kind.length + name.length + 1).trim();

    // Extract all fields after 'where'
    const fields: string[] = [];
    if (bodyPart) {
      const lines = bodyPart.split("\n");
      let inDocComment = false;
      for (const rawLine of lines) {
        const trimmed = rawLine.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith("/--") || trimmed.startsWith("/-")) {
          if (!trimmed.includes("-/")) inDocComment = true;
          continue;
        }
        if (inDocComment) {
          if (trimmed.includes("-/")) inDocComment = false;
          continue;
        }
        if (
          trimmed.startsWith("--") ||
          trimmed.startsWith("@[") ||
          trimmed.startsWith("attribute")
        )
          continue;
        fields.push(trimmed);
      }
    }

    // Sort notations by descending length
    const sortedNotations = Array.from(knownNotations.entries()).sort(
      (a, b) => b[0].length - a[0].length
    );

    // Resolve parent references preserving notation vs name
    const parentRefs: readonly LeanParentRef[] = (() => {
      if (!extendsClause) return [];

      const refs: LeanParentRef[] = [];
      const seen = new Set<string>();

      for (const rawPart of splitTopLevelCommas(extendsClause)) {
        const part = rawPart.trim().replace(/[()]/g, "");
        const tokens = part.split(/\s+/).filter(Boolean);
        if (tokens.length === 0) continue;

        let matched = false;

        // 1. Direct token match in notation map (e.g., "→*")
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

        // 2. Substring match across known notations
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

    const parents = Object.freeze(parentRefs.map((p) => p.target));

    // Typeclasses in signature
    const typeclasses: string[] = (() => {
      const tcRegex = /\[([A-Za-z0-9_.]+)\s+[^\]]+\]/g;
      const tcs: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = tcRegex.exec(headerPart)) !== null) {
        tcs.push(m[1]);
      }
      return [...new Set(tcs)];
    })();

    const body = formatLeanEntity({
      kind,
      name,
      params,
      extendsClause,
      fields,
    });

    return {
      id: sanitizeD2Id(name),
      name,
      kind,
      signature: headerPart.trim(),
      body,
      doc,
      filePath,
      line,
      origin: resolvePackageOrigin(filePath),
      parents,
      parentRefs,
      typeclasses: Object.freeze(typeclasses),
      fields: Object.freeze(fields),
      params,
      extendsClause,
    };
  })();
