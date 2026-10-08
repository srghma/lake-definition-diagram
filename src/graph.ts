import * as fs from "node:fs";
import type { LeanEntity, GraphBuildOptions } from "./types.ts";
import { parseNotations, extractEntityFromSource, formatLeanEntity } from "./parser.ts";

export class LeanGraphBuilder {
  private notationMap = new Map<string, string>();
  private targetToNotations = new Map<string, string[]>();
  private fileCache = new Map<string, string>();

  constructor(private readonly files: readonly string[]) {
    // Scan and cache notations initially
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, "utf-8");
        this.fileCache.set(file, content);
        for (const not of parseNotations(content, file)) {
          if (!this.notationMap.has(not.symbol)) {
            this.notationMap.set(not.symbol, not.target);
          }
          const list = this.targetToNotations.get(not.target) ?? [];
          if (!list.includes(not.raw)) {
            list.push(not.raw);
          }
          this.targetToNotations.set(not.target, list);
        }
      } catch { }
    }
  }

  public resolveSymbol(symbol: string): string {
    const trimmed = symbol.trim();
    return this.notationMap.get(trimmed) ?? trimmed;
  }

  public getNotationsFor(target: string): readonly string[] {
    return this.targetToNotations.get(target) ?? [];
  }

  public findEntity(name: string): LeanEntity | null {
    // Prefer non-test files first, and prioritize canonical Defs.lean files
    const sortedFiles = [...this.files].sort((a, b) => {
      const aIsTest = a.includes("Test") ? 1 : 0;
      const bIsTest = b.includes("Test") ? 1 : 0;
      if (aIsTest !== bIsTest) return aIsTest - bIsTest;

      const aIsDefs = a.includes("Defs.lean") ? 0 : 1;
      const bIsDefs = b.includes("Defs.lean") ? 0 : 1;
      return aIsDefs - bIsDefs;
    });

    for (const file of sortedFiles) {
      const content = this.fileCache.get(file);
      if (!content || !content.includes(name)) continue;

      const entity = extractEntityFromSource(name, content, file, this.notationMap);
      if (entity) {
        const notations = this.targetToNotations.get(entity.name) ?? [];
        const body = formatLeanEntity({
          kind: entity.kind,
          name: entity.name,
          params: entity.params,
          extendsClause: entity.extendsClause,
          fields: entity.fields,
          notations,
        });

        return {
          ...entity,
          notations,
          body,
        };
      }
    }

    return null;
  }

  public buildGraph(
    rootSymbol: string,
    options: GraphBuildOptions = {}
  ): ReadonlyMap<string, LeanEntity> {
    const targetName = this.resolveSymbol(rootSymbol);
    const graph = new Map<string, LeanEntity>();
    const visited = new Set<string>();
    const queue: Array<{ name: string; depth: number }> = [{ name: targetName, depth: 0 }];
    const maxDepth = options.maxDepth ?? 10;
    const includeTypeclasses = options.includeTypeclasses ?? true;

    while (queue.length > 0) {
      const { name, depth } = queue.shift()!;
      if (visited.has(name) || depth > maxDepth) continue;
      visited.add(name);

      const entity = this.findEntity(name);
      if (!entity) continue;

      graph.set(entity.name, entity);

      // Enqueue parents
      for (const parent of entity.parents) {
        if (!visited.has(parent)) {
          queue.push({ name: parent, depth: depth + 1 });
        }
      }

      // Enqueue typeclasses
      if (includeTypeclasses) {
        for (const tc of entity.typeclasses) {
          if (!visited.has(tc)) {
            queue.push({ name: tc, depth: depth + 1 });
          }
        }
      }
    }

    return graph;
  }
}
