import { describe, expect, it } from "bun:test";
import { formatLeanEntity, partitionParams, splitTopLevelCommas } from "../src/formatter.ts";

describe("formatter unit tests", () => {
  it("splits top-level commas correctly without breaking brackets or universes", () => {
    const res = splitTopLevelCommas(
      "NonUnitalNonAssocSemiring α, MulZeroOneClass α, AddCommMonoidWithOne α"
    );
    expect(res).toEqual([
      "NonUnitalNonAssocSemiring α",
      "MulZeroOneClass α",
      "AddCommMonoidWithOne α",
    ]);

    const withUniverses = splitTopLevelCommas("Category.{u, v} C, Monoid M");
    expect(withUniverses).toEqual(["Category.{u, v} C", "Monoid M"]);
  });

  it("partitions parameters into base head params and instance typeclasses", () => {
    const res = partitionParams(
      "(α : Type*) (β : Type*) [NonAssocSemiring α] [NonAssocSemiring β]"
    );
    expect(res.headParams).toBe("(α : Type*) (β : Type*)");
    expect(res.typeclasses).toEqual([
      "[NonAssocSemiring α]",
      "[NonAssocSemiring β]",
    ]);
  });

  it("formats RingHom with typeclasses on new lines and unindented notation", () => {
    const formatted = formatLeanEntity({
      kind: "structure",
      name: "RingHom",
      params: "(α : Type*) (β : Type*) [NonAssocSemiring α] [NonAssocSemiring β]",
      extendsClause: "α →* β, α →+ β, α →ₙ+* β, α →*₀ β",
      notations: ['infixr:25 " →+* " => RingHom'],
    });

    const expected = [
      "structure RingHom (α : Type*) (β : Type*)",
      "  [NonAssocSemiring α]",
      "  [NonAssocSemiring β]",
      "  extends α →* β, α →+ β, α →ₙ+* β, α →*₀ β",
      'infixr:25 " →+* " => RingHom',
    ].join("\n");

    expect(formatted).toBe(expected);
  });

  it("formats NonAssocSemiring with multi-line extends", () => {
    const formatted = formatLeanEntity({
      kind: "class",
      name: "NonAssocSemiring",
      params: "(α : Type u)",
      extendsClause:
        "NonUnitalNonAssocSemiring α, MulZeroOneClass α, AddCommMonoidWithOne α",
    });

    const expected = [
      "class NonAssocSemiring (α : Type u)",
      "  extends NonUnitalNonAssocSemiring α,",
      "    MulZeroOneClass α,",
      "    AddCommMonoidWithOne α",
    ].join("\n");

    expect(formatted).toBe(expected);
  });
});
