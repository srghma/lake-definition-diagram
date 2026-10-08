import type { LeanEntity } from "../types.ts";

export const renderD2Edges = (
  graph: ReadonlyMap<string, LeanEntity>
): readonly string[] =>
  (() => {
    const edges: string[] = [
      `# ==========================================`,
      `# Inheritance & Typeclasses`,
      `# ==========================================`,
    ];

    for (const [_, entity] of graph) {
      if (entity.parentRefs && entity.parentRefs.length > 0) {
        for (const ref of entity.parentRefs) {
          const parentEntity = graph.get(ref.target);
          if (parentEntity) {
            const escapedLabel = ref.label.replace(/"/g, '\\"');
            const strokeColor = ref.isNotation ? "#0284c7" : "#2563eb";
            const fontColor = ref.isNotation ? "#0369a1" : "#1d4ed8";

            edges.push(`${parentEntity.id} -> ${entity.id}: {
  label: |md
**extends** \`${escapedLabel}\`
|
  style: {
    stroke: "${strokeColor}"
    stroke-width: 2
    font-color: "${fontColor}"
  }
}`);
          }
        }
      } else {
        for (const parent of entity.parents) {
          const parentEntity = graph.get(parent);
          if (parentEntity) {
            edges.push(`${parentEntity.id} -> ${entity.id}: {
  label: |md
**extends** \`${parentEntity.name}\`
|
  style: {
    stroke: "#2563eb"
    stroke-width: 2
    font-color: "#1d4ed8"
  }
}`);
          }
        }
      }

      for (const tc of entity.typeclasses) {
        const tcEntity = graph.get(tc);
        if (tcEntity) {
          edges.push(`${tcEntity.id} -> ${entity.id}: {
  label: |md
**requires** \`[${tc}]\`
|
  style: {
    stroke: "#9333ea"
    stroke-dash: 4
    stroke-width: 2
    font-color: "#7e22ce"
  }
}`);
        }
      }
    }

    return Object.freeze(edges);
  })();
