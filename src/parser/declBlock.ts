import { escapeRegex } from "../sanitize.ts";

export interface DeclBlock {
  readonly kind: "class" | "structure";
  readonly name: string;
  readonly doc?: string;
  readonly line: number;
  readonly rawBlock: string;
}

export const extractDeclBlock = (name: string, content: string): DeclBlock | null =>
  (() => {
    const escaped = escapeRegex(name);
    const declRegex = new RegExp(
      `(?:^[ \\t]*\\/--((?:(?!\\-\\/)[\\s\\S])*?)\\-\\/(?:[ \\t]*\\r?\\n|\\s*))?` +
      `(?:^[ \\t]*@[^\\n]+\\s*)*` +
      `^[ \\t]*(class|structure)\\s+(${escaped})(?![.\\w'])`,
      "m"
    );

    const match = declRegex.exec(content);
    if (!match) return null;

    const doc = match[1]?.trim();
    const kind = match[2] as "class" | "structure";
    const declKeyMatch = match[0].match(new RegExp(`(?:class|structure)\\s+${escaped}`));
    const declOffset = match.index + (declKeyMatch?.index ?? 0);
    const line = content.slice(0, declOffset).split("\n").length;

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

    return {
      kind,
      name,
      doc,
      line,
      rawBlock: blockLines.join("\n"),
    };
  })();
