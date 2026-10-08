export type LeanOrigin = "Mathlib" | "Batteries" | "Core" | "Local";

export interface LeanParentRef {
  readonly target: string;
  readonly label: string;
  readonly isNotation: boolean;
}

export interface LeanEntity {
  readonly id: string;
  readonly name: string;
  readonly kind: "class" | "structure" | "def";
  readonly signature: string;
  readonly body: string;
  readonly doc?: string;
  readonly filePath: string;
  readonly line: number;
  readonly origin: LeanOrigin;
  readonly parents: readonly string[];
  readonly parentRefs: readonly LeanParentRef[];
  readonly typeclasses: readonly string[];
  readonly fields?: readonly string[];
  readonly notations?: readonly string[];
  readonly params?: string;
  readonly extendsClause?: string;
}

export interface LeanNotation {
  readonly symbol: string;
  readonly target: string;
  readonly raw: string;
  readonly filePath: string;
  readonly line: number;
}

export interface KnowledgeIndex {
  readonly files: readonly string[];
  readonly notations: ReadonlyMap<string, LeanNotation>;
  readonly entities: ReadonlyMap<string, LeanEntity>;
}

export interface GraphBuildOptions {
  readonly maxDepth?: number;
  readonly includeTypeclasses?: boolean;
}
