import { describe, expect, it } from "bun:test";
import { LeanGraphBuilder } from "../src/graph.ts";

describe("LeanGraphBuilder end-to-end integration test", () => {
  it("resolves →+* and crawls the Mathlib hierarchy", () => {
    // Mathlib from Nix store
    const mathlibDefs =
      "/nix/store/7j12m3zfgv4ymrd5jmd8gs8hkfa1sh58-mathlib/Mathlib/Algebra/Ring/Hom/Defs.lean";
    const mathlibRing =
      "/nix/store/7j12m3zfgv4ymrd5jmd8gs8hkfa1sh58-mathlib/Mathlib/Algebra/Ring/Defs.lean";

    const files = [mathlibDefs, mathlibRing];
    const builder = new LeanGraphBuilder(files);

    expect(builder.resolveSymbol("→+*")).toBe("RingHom");

    const graph = builder.buildGraph("→+*", { maxDepth: 2 });
    expect(graph.has("RingHom")).toBe(true);

    const ringHom = graph.get("RingHom");
    expect(ringHom?.typeclasses).toContain("NonAssocSemiring");
  });
});
