import { execFileSync } from "node:child_process";
import { prepareSvg } from "../html/dimensions.ts";
import type { LayoutEntry } from "../html/template.ts";

export const isD2Available = (): boolean =>
  (() => {
    try {
      execFileSync("d2", ["--version"], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  })();

export const compileLayoutSvg = (
  d2Path: string,
  layout: string
): LayoutEntry | null =>
  (() => {
    try {
      const rawSvg = execFileSync(
        "d2",
        ["-l", layout, "--no-xml-tag", d2Path, "-"],
        { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }
      );

      const { svg, width, height } = prepareSvg(rawSvg);

      const label =
        layout === "dagre"
          ? "Dagre (Bundled)"
          : layout === "elk"
            ? "ELK (Layered)"
            : layout;

      return {
        name: layout,
        label,
        svg,
        width,
        height,
      };
    } catch {
      return null;
    }
  })();
