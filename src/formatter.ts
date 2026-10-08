export interface FormatLeanEntityOptions {
  readonly kind: string;
  readonly name: string;
  readonly params?: string;
  readonly extendsClause?: string;
  readonly fields?: readonly string[];
  readonly notations?: readonly string[];
}

export const splitTopLevelCommas = (str: string): readonly string[] =>
  (() => {
    const items: string[] = [];
    let depth = 0;
    let current = "";

    for (const char of str) {
      if (char === "(" || char === "{" || char === "[" || char === "⟨" || char === "⦃") {
        depth++;
        current += char;
      } else if (char === ")" || char === "}" || char === "]" || char === "⟩" || char === "⦄") {
        depth = Math.max(0, depth - 1);
        current += char;
      } else if (char === "," && depth === 0) {
        if (current.trim().length > 0) items.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    if (current.trim().length > 0) items.push(current.trim());
    return Object.freeze(items);
  })();

export const partitionParams = (
  rawParams?: string
): { readonly headParams: string; readonly typeclasses: readonly string[] } =>
  (() => {
    if (!rawParams || !rawParams.trim()) {
      return { headParams: "", typeclasses: [] };
    }

    const trimmed = rawParams.trim();
    const tcRegex = /\[[^\]]+\]/g;
    const typeclasses = Array.from(trimmed.matchAll(tcRegex), (m) =>
      m[0].replace(/\s+/g, " ").trim()
    );
    const headParams = trimmed.replace(tcRegex, "").replace(/\s+/g, " ").trim();

    return {
      headParams,
      typeclasses: Object.freeze(typeclasses),
    };
  })();

export const formatLeanEntity = (entity: FormatLeanEntityOptions): string =>
  (() => {
    const { headParams, typeclasses } = partitionParams(entity.params);
    const headLine =
      headParams.length > 0
        ? `${entity.kind} ${entity.name} ${headParams}`
        : `${entity.kind} ${entity.name}`;

    const extendsItems = entity.extendsClause
      ? splitTopLevelCommas(entity.extendsClause)
      : [];
    const hasExtends = extendsItems.length > 0;
    const hasFields = Boolean(entity.fields && entity.fields.length > 0);

    const lines: string[] = [headLine];

    // Format typeclasses in params
    if (typeclasses.length > 0) {
      if (!hasExtends && hasFields) {
        for (let i = 0; i < typeclasses.length - 1; i++) {
          lines.push(`  ${typeclasses[i]}`);
        }
        lines.push(`  ${typeclasses[typeclasses.length - 1]} where`);
      } else {
        for (const tc of typeclasses) {
          lines.push(`  ${tc}`);
        }
      }
    } else if (!hasExtends && hasFields) {
      lines[0] = `${headLine} where`;
    }

    // Format extends clause
    if (hasExtends) {
      const singleLineExtends = `  extends ${extendsItems.join(", ")}`;
      const shouldWrap = extendsItems.length > 1 && singleLineExtends.length > 50;

      if (shouldWrap) {
        const [first, ...rest] = extendsItems;
        lines.push(`  extends ${first},`);
        for (let i = 0; i < rest.length; i++) {
          const isLast = i === rest.length - 1;
          const suffix = isLast ? (hasFields ? " where" : "") : ",";
          lines.push(`    ${rest[i]}${suffix}`);
        }
      } else {
        lines.push(`${singleLineExtends}${hasFields ? " where" : ""}`);
      }
    }

    // Format fields
    if (hasFields) {
      for (const field of entity.fields!) {
        lines.push(`  ${field}`);
      }
    }

    // Format notations at column 0
    if (entity.notations && entity.notations.length > 0) {
      for (const notation of entity.notations) {
        lines.push(notation.trim());
      }
    }

    return lines.join("\n");
  })();
