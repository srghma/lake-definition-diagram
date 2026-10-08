import { execFileSync, spawn } from "node:child_process";
import { prepareSvg } from "./dimensions.ts";

export interface ServerOptions {
  readonly d2Path: string;
  readonly getInitialHtml: () => string;
}

export const openBrowser = (url: string) => {
  try {
    const cmd = process.platform === "darwin" ? "open" : "xdg-open";
    execFileSync(cmd, [url], { stdio: "ignore" });
  } catch { }
};

export const serveInteractiveHtml = (
  options: ServerOptions
): { readonly port: number; readonly url: string; readonly stop: () => void } =>
  (() => {
    const { d2Path, getInitialHtml } = options;
    const cache = new Map<string, { svg: string; width: number; height: number }>();

    const server = Bun.serve({
      port: 0,
      async fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/") {
          return new Response(getInitialHtml(), {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-cache",
            },
          });
        }

        if (url.pathname === "/api/render") {
          const layout = url.searchParams.get("layout") || "dagre";
          const theme = url.searchParams.get("theme") || "0";
          const cacheKey = `${layout}_${theme}`;

          if (cache.has(cacheKey)) {
            return Response.json({ ok: true, ...cache.get(cacheKey)! });
          }

          try {
            const rawSvg = execFileSync(
              "d2",
              ["-l", layout, "-t", theme, "--no-xml-tag", d2Path, "-"],
              { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }
            );

            const result = prepareSvg(rawSvg);
            cache.set(cacheKey, result);
            return Response.json({ ok: true, ...result });
          } catch (err: any) {
            return Response.json(
              { ok: false, error: err.message },
              { status: 500 }
            );
          }
        }

        if (url.pathname === "/api/play") {
          try {
            spawn("d2", ["play", d2Path], { stdio: "ignore", detached: true });
            return Response.json({ ok: true });
          } catch (err: any) {
            return Response.json(
              { ok: false, error: err.message },
              { status: 500 }
            );
          }
        }

        return new Response("Not Found", { status: 404 });
      },
    });

    return {
      port: server.port,
      url: server.url.href,
      stop: () => server.stop(),
    };
  })();
