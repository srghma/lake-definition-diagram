#!/usr/bin/env bun
import * as fs from "node:fs";
import { c } from "./colors.ts";
import { getSearchRoots, collectLeanFiles } from "./scanner.ts";
import { LeanGraphBuilder } from "./graph.ts";
import { renderD2 } from "./d2.ts";
import { sanitizeFileName } from "./parser.ts";
import { buildInteractiveHtml, serveInteractiveHtml, openBrowser } from "./html.ts";
import { parseCliArgs, printHelp } from "./cli/options.ts";
import { isD2Available, compileLayoutSvg } from "./cli/compiler.ts";

export const runCli = async (rawArgs: string[]) => {
  const options = parseCliArgs(rawArgs);
  const { query, stdoutOnly, render, wantsHtml, shouldOpen, verbose, includeTypeclasses } = options;

  if (!query || rawArgs.includes("-h") || rawArgs.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  const cwd = process.cwd();

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

  const baseName = sanitizeFileName(target !== query ? target : query);
  const outPath = options.outPath ?? (!stdoutOnly ? `${baseName}.d2` : null);

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

      console.log(`🎨 Compiling layouts (Dagre & ELK)...`);
      const dagreEntry = compileLayoutSvg(outPath, "dagre");
      const elkEntry = compileLayoutSvg(outPath, "elk");

      const layouts = [dagreEntry, elkEntry].filter(Boolean) as any[];

      if (layouts.length === 0) {
        console.error(c.red(`❌ Failed to compile diagrams via d2.`));
        return;
      }

      // Save default SVG
      const svgPath = outPath.replace(/\.d2$/, ".svg");
      fs.writeFileSync(svgPath, layouts[0].svg, "utf-8");
      console.log(`🎉 Rendered SVG (${c.bold(layouts[0].name)}): ${c.bold(c.green(svgPath))}`);

      if (wantsHtml) {
        // Build standalone HTML bundle
        const staticHtml = buildInteractiveHtml({
          rootSymbol: query,
          resolvedTarget: target,
          layouts,
          isServerBacked: false,
        });

        const htmlPath = outPath.replace(/\.d2$/, ".html");
        fs.writeFileSync(htmlPath, staticHtml, "utf-8");
        console.log(`🌐 Interactive HTML saved: ${c.bold(c.brightCyan(htmlPath))}`);

        if (shouldOpen) {
          const srv = serveInteractiveHtml({
            d2Path: outPath,
            getInitialHtml: () =>
              buildInteractiveHtml({
                rootSymbol: query,
                resolvedTarget: target,
                layouts,
                isServerBacked: true,
              }),
          });

          console.log(`🚀 Serving live diagram at: ${c.bold(c.brightGreen(srv.url))}`);
          console.log(c.dim(`   (Press Ctrl+C to stop server)`));
          openBrowser(srv.url);

          // Keep server running
          await new Promise(() => { });
        }
      }
    }
  }
};
