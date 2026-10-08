import { describe, expect, it } from "bun:test";
import { parseNotations, extractEntityFromSource, sanitizeD2Id, sanitizeFileName } from "../src/parser.ts";

describe("Lean parser unit tests", () => {
  it("sanitizes D2 identifiers and filenames", () => {
    expect(sanitizeD2Id("RingHom")).toBe("RingHom");
    expect(sanitizeD2Id("→+*")).toBe("___");
    expect(sanitizeD2Id("123abc")).toBe("_123abc");
    expect(sanitizeFileName("RingHom")).toBe("RingHom");
    expect(sanitizeFileName("→+*")).toBe("diagram");
  });

  it("parses infix notations and ignores local variable aliases", () => {
    const snippet = `
      /-- notation doc --/
      infixr:25 " →+* " => RingHom
      infixl:65 " + " => HAdd.hAdd
      notation "n" => finrank
      notation "α" => K.gen
    `;
    const notations = parseNotations(snippet, "test.lean");
    expect(notations.length).toBe(2);
    expect(notations[0].symbol).toBe("→+*");
    expect(notations[0].target).toBe("RingHom");
    expect(notations[1].symbol).toBe("+");
  });

  it("extracts structure with parents and typeclasses accurately", () => {
    const snippet = `
/-- docstring for RingHom -/
structure RingHom (α : Type*) (β : Type*) [NonAssocSemiring α] [NonAssocSemiring β] extends
  α →* β, α →+ β, α →ₙ+* β, α →*₀ β
where
  toFun := id
    `;
    const known = new Map([
      ["→*", "MonoidHom"],
      ["→+", "AddMonoidHom"],
      ["→ₙ+*", "NonUnitalRingHom"],
      ["→*₀", "MonoidWithZeroHom"],
    ]);

    const entity = extractEntityFromSource("RingHom", snippet, "/path/to/Defs.lean", known);
    expect(entity).not.toBeNull();
    expect(entity?.kind).toBe("structure");
    expect(entity?.doc).toBe("docstring for RingHom");
    expect(entity?.typeclasses).toEqual(["NonAssocSemiring"]);
    expect(entity?.parents).toEqual([
      "MonoidHom",
      "AddMonoidHom",
      "NonUnitalRingHom",
      "MonoidWithZeroHom",
    ]);
  });

  it("does not match sub-identifiers like RingHom.Flat when searching for RingHom", () => {
    const snippet = `
class RingHom.Flat {R : Type u} {S : Type v} [CommRing R] [CommRing S] (f : R →+* S) : Prop where
    `;
    const entity = extractEntityFromSource("RingHom", snippet, "Algebraize.lean", new Map());
    expect(entity).toBeNull();
  });
});
