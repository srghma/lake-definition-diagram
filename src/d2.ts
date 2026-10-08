import type { LeanEntity } from "./types.ts";
import { D2_THEME_CLASSES } from "./d2/theme.ts";
import { renderD2Nodes } from "./d2/nodes.ts";
import { renderD2Edges } from "./d2/edges.ts";

export interface D2RenderOptions {
  readonly verbose?: boolean;
  readonly baseDir?: string;
}

export const renderD2 = (
  rootSymbol: string,
  resolvedTarget: string,
  graph: ReadonlyMap<string, LeanEntity>,
  options: D2RenderOptions = {}
): string =>
  (() => {
    const verbose = options.verbose ?? false;
    const baseDir = options.baseDir ?? process.cwd();

    const header = [
      `direction: down\n`,
      `# Lake Definition Hierarchy: "${rootSymbol}" (${resolvedTarget})`,
      `${D2_THEME_CLASSES}\n`,
    ];

    const nodes = renderD2Nodes(graph, { verbose, baseDir });
    const edges = renderD2Edges(graph);

    return [...header, ...nodes, ...edges].join("\n");
  })();
