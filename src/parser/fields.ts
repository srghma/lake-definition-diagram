export const extractFields = (bodyPart: string): readonly string[] =>
  (() => {
    if (!bodyPart) return [];
    const fields: string[] = [];
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

    return Object.freeze(fields);
  })();
