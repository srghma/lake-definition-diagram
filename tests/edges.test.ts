import { describe, expect, it } from "bun:test";
import { extractEntityFromSource } from "../src/parser.ts";
import { renderD2Edges } from "../src/d2/edges.ts";

describe("extends arrows with Markdown keywords and colorized styles", () => {
  it("generates Markdown blocks and distinct styles for notation vs name", () => {
    const known = new Map([
      ["→*", "MonoidHom"],
      ["→+", "AddMonoidHom"],
      ["→ₙ+*", "NonUnitalRingHom"],
      ["→*₀", "MonoidWithZeroHom"],
    ]);

    const ringHomSource = `
structure RingHom (α : Type*) (β : Type*) [NonAssocSemiring α] extends
  α →* β, α →+ β
    `;

    const ringHom = extractEntityFromSource("RingHom", ringHomSource, "Defs.lean", known)!;

    const graph = new Map([
      ["RingHom", ringHom],
      ["MonoidHom", { ...ringHom, id: "MonoidHom", name: "MonoidHom" }],
      ["AddMonoidHom", { ...ringHom, id: "AddMonoidHom", name: "AddMonoidHom" }],
      ["NonAssocSemiring", { ...ringHom, id: "NonAssocSemiring", name: "NonAssocSemiring" }],
    ]);

    const rendered = renderD2Edges(graph).join("\n");

    // Extends by notation (Ocean blue #0284c7)
    expect(rendered).toContain("MonoidHom -> RingHom: {");
    expect(rendered).toContain("**extends** `→*`");
    expect(rendered).toContain('stroke: "#0284c7"');

    // Requires typeclass (Purple #9333ea, dashed)
    expect(rendered).toContain("NonAssocSemiring -> RingHom: {");
    expect(rendered).toContain("**requires** `[NonAssocSemiring]`");
    expect(rendered).toContain('stroke: "#9333ea"');
    expect(rendered).toContain("stroke-dash: 4");
  });
});
