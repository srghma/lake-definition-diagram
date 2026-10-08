export interface HtmlViewerOptions {
  readonly rootSymbol: string;
  readonly resolvedTarget: string;
}

export const buildInteractiveHtml = (
  svgContent: string,
  options: HtmlViewerOptions
): string =>
  (() => {
    const { rootSymbol, resolvedTarget } = options;
    const title = `Hierarchy: "${rootSymbol}" (${resolvedTarget})`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --bg: #0f172a;
      --panel-bg: rgba(30, 41, 59, 0.85);
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-purple: #c084fc;
    }

    * { box-sizing: border-box; }
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--bg);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--text);
      user-select: none;
    }

    #viewport {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      cursor: grab;
      position: relative;
    }
    #viewport.dragging {
      cursor: grabbing;
    }

    #canvas {
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: 0 0;
      transition: transform 0.05s ease-out;
    }

    /* SVG interactivity transitions */
    svg g {
      transition: opacity 0.2s ease, filter 0.2s ease;
    }
    svg path, svg polygon {
      transition: stroke-width 0.2s ease, filter 0.2s ease, opacity 0.2s ease;
    }

    /* Dimmed state */
    .is-dimmed {
      opacity: 0.12 !important;
    }

    /* Active highlighted edge */
    .is-highlighted-edge {
      opacity: 1 !important;
      filter: drop-shadow(0 0 6px currentColor) !important;
    }
    .is-highlighted-edge path.connection {
      stroke-width: 4.5px !important;
    }

    /* Active highlighted node */
    .is-highlighted-node {
      opacity: 1 !important;
      filter: drop-shadow(0 0 10px var(--accent)) drop-shadow(0 0 2px #fff) !important;
    }

    /* Top Controls Bar */
    #toolbar {
      position: absolute;
      top: 16px;
      left: 16px;
      display: flex;
      gap: 12px;
      align-items: center;
      background: var(--panel-bg);
      backdrop-filter: blur(8px);
      padding: 8px 14px;
      border-radius: 12px;
      border: 1px solid var(--border);
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      z-index: 10;
    }

    #search {
      background: #0f172a;
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      width: 190px;
      outline: none;
    }
    #search:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }

    .btn {
      background: #1e293b;
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .btn:hover {
      background: #334155;
      border-color: var(--accent);
    }

    /* Bottom Info HUD */
    #hud {
      position: absolute;
      bottom: 16px;
      left: 16px;
      background: var(--panel-bg);
      backdrop-filter: blur(8px);
      padding: 10px 16px;
      border-radius: 12px;
      border: 1px solid var(--border);
      font-size: 13px;
      color: var(--text-muted);
      z-index: 10;
      max-width: 480px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      pointer-events: none;
    }
    #hud strong {
      color: var(--text);
    }
    #hud code {
      background: rgba(0,0,0,0.3);
      padding: 2px 5px;
      border-radius: 4px;
      font-family: monospace;
      color: var(--accent);
    }
  </style>
</head>
<body>
  <div id="toolbar">
    <input type="text" id="search" placeholder="Search entity... (e.g. RingHom)">
    <button class="btn" id="btn-zoom-in" title="Zoom in">+</button>
    <button class="btn" id="btn-zoom-out" title="Zoom out">−</button>
    <button class="btn" id="btn-reset" title="Reset View">Reset</button>
  </div>

  <div id="hud">Hover over any node or arrow to inspect inheritance relationships.</div>

  <div id="viewport">
    <div id="canvas">
      ${svgContent}
    </div>
  </div>

  <script>
    (() => {
      const viewport = document.getElementById("viewport");
      const canvas = document.getElementById("canvas");
      const hud = document.getElementById("hud");
      const searchInput = document.getElementById("search");
      const svg = canvas.querySelector("svg");

      if (!svg) return;

      // 1. Pan and Zoom state
      let scale = 1;
      let panX = 40;
      let panY = 40;
      let isDragging = false;
      let startX = 0;
      let startY = 0;

      const updateTransform = () => {
        canvas.style.transform = \`translate(\${panX}px, \${panY}px) scale(\${scale})\`;
      };
      updateTransform();

      viewport.addEventListener("wheel", (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.12 : 0.89;
        const newScale = Math.min(Math.max(0.08, scale * factor), 6);
        const rect = viewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        panX = mouseX - (mouseX - panX) * (newScale / scale);
        panY = mouseY - (mouseY - panY) * (newScale / scale);
        scale = newScale;
        updateTransform();
      }, { passive: false });

      viewport.addEventListener("mousedown", (e) => {
        if (e.target.closest("#toolbar")) return;
        isDragging = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        viewport.classList.add("dragging");
      });

      window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        updateTransform();
      });

      window.addEventListener("mouseup", () => {
        isDragging = false;
        viewport.classList.remove("dragging");
      });

      document.getElementById("btn-zoom-in").onclick = () => {
        scale = Math.min(scale * 1.25, 6);
        updateTransform();
      };
      document.getElementById("btn-zoom-out").onclick = () => {
        scale = Math.max(scale * 0.8, 0.08);
        updateTransform();
      };
      document.getElementById("btn-reset").onclick = () => {
        scale = 1;
        panX = 40;
        panY = 40;
        updateTransform();
      };

      // 2. Discover Nodes and Edges via D2 Base64 classes
      const nodes = new Map(); // id -> element
      const edges = [];       // { el, sourceId, targetId, rawLabel }

      const allGroups = Array.from(svg.querySelectorAll("g"));
      for (const g of allGroups) {
        const classAttr = g.getAttribute("class") || "";
        for (const token of classAttr.split(/\\s+/)) {
          if (!token) continue;
          try {
            const decoded = atob(token);
            // Edge group format: (source -> target)[idx]
            const edgeMatch = decoded.match(/^\\((.*?)\\s*(?:->|-&gt;)\\s*(.*?)\\)\\[\\d+\\]$/);
            if (edgeMatch) {
              const sourceId = edgeMatch[1].trim();
              const targetId = edgeMatch[2].trim();
              const textEl = g.querySelector("text");
              const rawLabel = textEl ? textEl.textContent.trim() : "";
              edges.push({ el: g, sourceId, targetId, rawLabel });
              g.style.cursor = "pointer";
            } else if (!decoded.includes(" ") && !decoded.includes("(") && !decoded.includes("<")) {
              // Node group
              nodes.set(decoded, g);
              g.style.cursor = "pointer";
            }
          } catch (_) {}
        }
      }

      const allInteractiveElements = [...edges.map(e => e.el), ...Array.from(nodes.values())];

      const resetHighlights = () => {
        for (const el of allInteractiveElements) {
          el.classList.remove("is-dimmed", "is-highlighted-edge", "is-highlighted-node");
        }
        hud.innerHTML = "Hover over any node or arrow to inspect inheritance relationships.";
      };

      // 3. Edge hover interactions
      for (const edge of edges) {
        edge.el.addEventListener("mouseenter", () => {
          for (const el of allInteractiveElements) {
            el.classList.add("is-dimmed");
          }

          edge.el.classList.remove("is-dimmed");
          edge.el.classList.add("is-highlighted-edge");

          const srcNode = nodes.get(edge.sourceId);
          const tgtNode = nodes.get(edge.targetId);

          if (srcNode) {
            srcNode.classList.remove("is-dimmed");
            srcNode.classList.add("is-highlighted-node");
          }
          if (tgtNode) {
            tgtNode.classList.remove("is-dimmed");
            tgtNode.classList.add("is-highlighted-node");
          }

          hud.innerHTML = \`Relationship: <code>\${edge.sourceId}</code> ➔ <code>\${edge.targetId}</code> &nbsp;|&nbsp; <strong>\${edge.rawLabel || "extends"}</strong>\`;
        });

        edge.el.addEventListener("mouseleave", resetHighlights);
      }

      // 4. Node hover interactions
      for (const [nodeId, nodeEl] of nodes.entries()) {
        nodeEl.addEventListener("mouseenter", () => {
          for (const el of allInteractiveElements) {
            el.classList.add("is-dimmed");
          }

          nodeEl.classList.remove("is-dimmed");
          nodeEl.classList.add("is-highlighted-node");

          const connectedEdges = edges.filter(e => e.sourceId === nodeId || e.targetId === nodeId);
          const connectedNodeIds = new Set();

          for (const edge of connectedEdges) {
            edge.el.classList.remove("is-dimmed");
            edge.el.classList.add("is-highlighted-edge");
            connectedNodeIds.add(edge.sourceId);
            connectedNodeIds.add(edge.targetId);
          }

          for (const cId of connectedNodeIds) {
            const cNode = nodes.get(cId);
            if (cNode) {
              cNode.classList.remove("is-dimmed");
              cNode.classList.add("is-highlighted-node");
            }
          }

          const outgoing = edges.filter(e => e.targetId === nodeId).length;
          const incoming = edges.filter(e => e.sourceId === nodeId).length;
          hud.innerHTML = \`Selected: <code>\${nodeId}</code> &nbsp;|&nbsp; Extends / Requires: <strong>\${outgoing}</strong> ancestors &nbsp;|&nbsp; Extended by: <strong>\${incoming}</strong> descendants\`;
        });

        nodeEl.addEventListener("mouseleave", resetHighlights);
      }

      // 5. Quick Search
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
          resetHighlights();
          return;
        }

        for (const [nodeId, nodeEl] of nodes.entries()) {
          if (nodeId.toLowerCase().includes(query)) {
            nodeEl.classList.remove("is-dimmed");
            nodeEl.classList.add("is-highlighted-node");
          } else {
            nodeEl.classList.add("is-dimmed");
            nodeEl.classList.remove("is-highlighted-node");
          }
        }
      });
    })();
  </script>
</body>
</html>`;
  })();
