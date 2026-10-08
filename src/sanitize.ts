export const escapeRegex = (raw: string): string =>
  raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const sanitizeD2Id = (raw: string): string =>
  raw.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^([0-9])/, "_$1");

export const sanitizeFileName = (name: string): string =>
  (() => {
    const clean = name.replace(/[^a-zA-Z0-9_.-]/g, "_").replace(/^_+|_+$/g, "");
    return clean.length > 0 ? clean : "diagram";
  })();
