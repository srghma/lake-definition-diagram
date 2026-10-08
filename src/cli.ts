#!/usr/bin/env bun
import * as fs from "node:fs";
import { execFileSync } from "node:child_process";
import { c } from "./colors.ts";
import { getSearchRoots, collectLeanFiles } from "./scanner.ts";
import { LeanGraphBuilder } from "./graph.ts";
import { renderD2 } from "./d2.ts";
import { sanitizeFileName } from "./parser.ts";
import { buildInteractiveHtml } from "./html.ts";

const isD2Available = (): boolean =>
  (() => {
    try {
      execFileSync("d2", ["--version"], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  })();

const openInBrowser = (filePath: string) => {
  try {
    const cmd = process.platform === "darwin" ? "open" : "xdg-open";
    execFileSync(cmd, [filePath], { stdio: "ignore" });
  } catch { }
};

export const runCli = async (args: string[]) => {
  const query = args[0];
  if (!query || args.includes("-h") || args.includes("--help")) {
    console.log(`${c.bold("Usage:")} lake-definition-diagram <symbol-or-notation> [options]

${c.bold("Examples:")}
  ${c.cyan('lake-definition-diagram "→+*" --html')}
  ${c.cyan('lake-definition-diagram "→+*" --html --open')}
  ${c.cyan('lake-definition-diagram "→+*" -r -v')}
  ${c.cyan('lake-definition-diagram RingHom -o RingHom.d2')}

${c.bold("Options:")}
  ${c.dim("-o, --output <file>")}      Output path for .d2, .svg, or .html file
  ${c.dim("-r, --render")}             Compile .d2 to .svg using 'd2' CLI command
  ${c.dim("-i, --html")}               Generate interactive .html viewer with hover-tracing
  ${c.dim("--open")}                   Open the generated .html diagram in the default browser
  ${c.dim("-v, --verbose, --full")}    Include docstrings, origin, and file paths
  ${c.dim("-p, --print")}              Print D2 diagram directly to stdout
  ${c.dim("--no-typeclasses")}         Exclude [C α] constraints from graph
`);
    process.exit(0);
  }

  const cwd = process.cwd();
  const stdoutOnly = args.includes("-p") || args.includes("--print");
  const wantsHtml = args.includes("-i") || args.includes("--html");
  const shouldOpen = args.includes("--open");
  const render = args.includes("-r") || args.includes("--render") || wantsHtml;
  const verbose = args.includes("-v") || args.includes("--verbose") || args.includes("--full");
  const includeTypeclasses = !args.includes("--no-typeclasses");

  if (!stdoutOnly) {
    console.log(c.bold(`🔍 Locating files for: ${c.brightCyan(query)}`));
  }

  const searchRoots = getSearchRoots(cwd);
  const allFiles = searchRoots.flatMap((r) => collectLeanFiles(r));

  const builder = new LeanGraphBuilder(allFiles);
  const target = builder.resolveSymbol(query);

  if (!stdoutOnly && target !== query) {
    console.log(`   🔗 Notation resolved: ${c.yellow(`"${query}"`)} => ${c.bold(c.green(target))}`);
  }

  let outPath: string | null = null;
  const outIdx = args.findIndex((a) => a === "-o" || a === "--output");
  if (outIdx !== -1 && args[outIdx + 1]) {
    outPath = args[outIdx + 1];
  } else if (!stdoutOnly) {
    const baseName = sanitizeFileName(target !== query ? target : query);
    outPath = `${baseName}.d2`;
  }

  const graph = builder.buildGraph(query, { includeTypeclasses });

  if (graph.size === 0) {
    console.error(c.red(`❌ Could not locate definition for "${query}" (target: "${target}").`));
    process.exit(1);
  }

  if (!stdoutOnly) {
    console.log(c.green(`✓ Found hierarchy with ${c.bold(graph.size)} entities:`));
    for (const [name, entity] of graph) {
      console.log(`   ├─ [${c.magenta(entity.origin)}] ${c.bold(name)} (${c.dim(entity.kind)})`);
    }
  }

  const d2Output = renderD2(query, target, graph, { verbose, baseDir: cwd });

  if (stdoutOnly) {
    console.log(d2Output);
    return;
  }

  if (outPath) {
    fs.writeFileSync(outPath, d2Output, "utf-8");
    console.log(`\n📄 ${c.bold("D2 diagram written to:")} ${c.brightGreen(outPath)}`);

    if (render) {
      if (!isD2Available()) {
        console.warn(c.yellow(`\n⚠️ 'd2' CLI command not found in PATH.`));
        return;
      }

      const svgPath = outPath.replace(/\.d2$/, ".svg");
      console.log(`🎨 Compiling SVG via d2...`);
      execFileSync("d2", [outPath, svgPath], { stdio: "inherit" });
      console.log(`🎉 Rendered SVG: ${c.bold(c.green(svgPath))}`);

      if (wantsHtml) {
        const svgContent = fs.readFileSync(svgPath, "utf-8");
        const htmlContent = buildInteractiveHtml(svgContent, {
          rootSymbol: query,
          resolvedTarget: target,
        });
        const htmlPath = outPath.replace(/\.d2$/, ".html");
        fs.writeFileSync(htmlPath, htmlContent, "utf-8");
        console.log(`🌐 Interactive HTML generated: ${c.bold(c.brightCyan(htmlPath))}`);

        if (shouldOpen) {
          openInBrowser(htmlPath);
        }
      }
    }
  }
};
