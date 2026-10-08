import * as path from "node:path";
import type { LeanEntity } from "../types.ts";

export interface RenderNodesOptions {
  readonly verbose: boolean;
  readonly baseDir: string;
}

export const renderD2Node = (
  entity: LeanEntity,
  options: RenderNodesOptions
): string =>
  (() => {
    // Select specific kind+origin class (e.g. structure_mathlib or class_mathlib)
    const d2Class = `${entity.kind}_${entity.origin.toLowerCase()}`;
    const relPath = path.relative(options.baseDir, entity.filePath);
    const escapedBody = entity.body.replace(/`/g, "\\`");
    const tooltipLine = entity.doc
      ? `tooltip: "${entity.doc.replace(/\n/g, " ").replace(/"/g, '\\"')}"`
      : "";

    if (options.verbose) {
      const docBlock = entity.doc
        ? `\n> *${entity.doc.replace(/\n/g, " ").replace(/"/g, '\\"')}*\n***`
        : "";

      return `${entity.id}: {
  class: ${d2Class}
  link: "vscode://file/${entity.filePath}:${entity.line}"
  ${tooltipLine}
  label: |md
    ### ${entity.kind} ${entity.name}
    **[${entity.origin}]** \`${relPath}:${entity.line}\`${docBlock}
    \`\`\`haskell
${escapedBody}
    \`\`\`
  |
}\n`;
    }

    return `${entity.id}: {
  class: ${d2Class}
  link: "vscode://file/${entity.filePath}:${entity.line}"
  ${tooltipLine}
  label: |haskell
${entity.body}
  |
}\n`;
  })();

export const renderD2Nodes = (
  graph: ReadonlyMap<string, LeanEntity>,
  options: RenderNodesOptions
): readonly string[] =>
  (() => {
    const nodes: string[] = [];
    for (const [_, entity] of graph) {
      nodes.push(renderD2Node(entity, options));
    }
    return Object.freeze(nodes);
  })();
