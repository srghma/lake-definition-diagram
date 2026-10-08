import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import type { LeanOrigin } from "./types.ts";

const IGNORED_DIRS = new Set([
  "MathlibTest",
  "Counterexamples",
  "test",
  "tests",
  ".git",
  "build",
  "dist",
  "node_modules",
]);

export const resolvePackageOrigin = (filePath: string): LeanOrigin =>
  filePath.includes("mathlib")
    ? "Mathlib"
    : filePath.includes("batteries")
      ? "Batteries"
      : filePath.includes("/lib/lean") || filePath.includes("/src/lean")
        ? "Core"
        : "Local";

export const getSearchRoots = (workspaceDir: string): readonly string[] =>
  (() => {
    const roots: string[] = [workspaceDir];

    // 1. Check local .lake/packages
    const lakePackages = path.join(workspaceDir, ".lake", "packages");
    if (fs.existsSync(lakePackages)) {
      for (const entry of fs.readdirSync(lakePackages)) {
        roots.push(path.join(lakePackages, entry));
      }
    }

    // 2. Discover Lean toolchain prefix if available
    try {
      const leanPrefix = execFileSync("lean", ["--print-prefix"], {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      const leanSrc = path.join(leanPrefix, "src", "lean");
      if (fs.existsSync(leanSrc)) roots.push(leanSrc);
    } catch { }

    return Object.freeze(roots);
  })();

export const collectLeanFiles = (dir: string, depth = 0): readonly string[] => {
  if (depth > 12) return [];

  const visit = (currentDir: string): string[] => {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      return entries.flatMap((entry) => {
        if (IGNORED_DIRS.has(entry.name)) return [];
        if (entry.name.startsWith(".") && entry.name !== ".lake") return [];

        const fullPath = path.join(currentDir, entry.name);

        if (entry.isSymbolicLink()) {
          try {
            const realPath = fs.realpathSync(fullPath);
            const stat = fs.statSync(realPath);
            return stat.isDirectory()
              ? (collectLeanFiles(realPath, depth + 1) as string[])
              : realPath.endsWith(".lean")
                ? [realPath]
                : [];
          } catch {
            return [];
          }
        }

        if (entry.isDirectory()) {
          return collectLeanFiles(fullPath, depth + 1) as string[];
        }

        return entry.isFile() && entry.name.endsWith(".lean") ? [fullPath] : [];
      });
    } catch {
      return [];
    }
  };

  return visit(dir);
};
