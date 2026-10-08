import type { LeanEntity } from "./types.ts";
import { resolvePackageOrigin } from "./scanner.ts";
import { sanitizeD2Id } from "./sanitize.ts";
import { formatLeanEntity } from "./formatter.ts";
import { extractDeclBlock } from "./parser/declBlock.ts";
import { extractFields } from "./parser/fields.ts";
import { resolveParentRefs } from "./parser/parents.ts";
import { extractTypeclasses } from "./parser/typeclasses.ts";

export * from "./sanitize.ts";
export * from "./formatter.ts";
export * from "./notation.ts";
export * from "./parser/declBlock.ts";
export * from "./parser/fields.ts";
export * from "./parser/parents.ts";
export * from "./parser/typeclasses.ts";

export const extractEntityFromSource = (
  name: string,
  content: string,
  filePath: string,
  knownNotations: ReadonlyMap<string, string>
): LeanEntity | null =>
  (() => {
    const decl = extractDeclBlock(name, content);
    if (!decl) return null;

    const { kind, doc, line, rawBlock } = decl;

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

    const fields = extractFields(bodyPart);
    const parentRefs = resolveParentRefs(extendsClause, knownNotations);
    const parents = Object.freeze(parentRefs.map((p) => p.target));
    const typeclasses = extractTypeclasses(headerPart);

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
      typeclasses,
      fields,
      params,
      extendsClause,
    };
  })();
