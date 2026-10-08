import { VIEWER_CSS } from "./styles.ts";
import { getViewerClientScript } from "./clientScript.ts";
import { parseSvgDimensions, prepareSvg } from "./dimensions.ts";

export { parseSvgDimensions, prepareSvg };

export interface LayoutEntry {
  readonly name: string;
  readonly label: string;
  readonly svg: string;
  readonly width: number;
  readonly height: number;
}

export interface HtmlViewerOptions {
  readonly rootSymbol: string;
  readonly resolvedTarget: string;
  readonly layouts: readonly LayoutEntry[];
  readonly isServerBacked?: boolean;
}

export const buildInteractiveHtml = (options: HtmlViewerOptions): string =>
  (() => {
    const { rootSymbol, resolvedTarget, layouts, isServerBacked = false } = options;
    const defaultLayout = layouts[0] ?? {
      name: "dagre",
      label: "Dagre (Bundled)",
      svg: "",
      width: 3200,
      height: 1800,
    };

    const title = `Hierarchy: "${rootSymbol}" (${resolvedTarget})`;
    const clientScript = getViewerClientScript(
      defaultLayout.width,
      defaultLayout.height,
      isServerBacked
    );

    const layoutOptionsHtml = layouts
      .map(
        (l, i) =>
          `<option value="${l.name}" ${i === 0 ? "selected" : ""}>${l.label}</option>`
      )
      .join("\n");

    const templatesHtml = layouts
      .map(
        (l) =>
          `<template id="layout-tpl-${l.name}" data-width="${l.width}" data-height="${l.height}">${l.svg}</template>`
      )
      .join("\n");

    const themeSelectHtml = isServerBacked
      ? `<div class="control-group">
          <span class="control-label">Theme</span>
          <select class="select-input" id="theme-select">
            <optgroup label="Light">
              <option value="0" selected>Neutral Default</option>
              <option value="4">Cool Classics</option>
              <option value="5">Mixed Berry</option>
              <option value="1">Neutral Grey</option>
              <option value="103">Earth Tones</option>
              <option value="300">Terminal</option>
            </optgroup>
            <optgroup label="Dark">
              <option value="200">Dark Mauve</option>
              <option value="201">Dark Flagship</option>
            </optgroup>
          </select>
        </div>`
      : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${VIEWER_CSS}</style>
</head>
<body>
  <div id="toolbar">
    <input type="text" id="search" placeholder="Search entity... (e.g. RingHom)">

    <div class="control-group">
      <span class="control-label">Layout</span>
      <select class="select-input" id="layout-select">
        ${layoutOptionsHtml}
      </select>
    </div>

    ${themeSelectHtml}

    <button class="btn" id="btn-zoom-in" title="Zoom in">+</button>
    <button class="btn" id="btn-zoom-out" title="Zoom out">−</button>
    <button class="btn" id="btn-reset" title="Fit to screen">Fit</button>
    <button class="btn btn-accent" id="btn-playground" title="Open in D2 Playground with Tala">Playground (Tala)</button>
  </div>

  <div id="loading-overlay">Compiling layout/theme...</div>
  <div id="hud">Hover over any node or arrow to inspect inheritance relationships.</div>

  <div id="viewport">
    <div id="canvas" style="width: ${defaultLayout.width}px; height: ${defaultLayout.height}px;">
      ${defaultLayout.svg}
    </div>
  </div>

  ${templatesHtml}

  <script>${clientScript}</script>
</body>
</html>`;
  })();
