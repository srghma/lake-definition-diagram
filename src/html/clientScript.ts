export const getViewerClientScript = (
  initialWidth: number,
  initialHeight: number,
  isServerBacked: boolean
): string => `
(() => {
  const viewport = document.getElementById("viewport");
  const canvas = document.getElementById("canvas");
  const hud = document.getElementById("hud");
  const searchInput = document.getElementById("search");
  const layoutSelect = document.getElementById("layout-select");
  const themeSelect = document.getElementById("theme-select");
  const loadingOverlay = document.getElementById("loading-overlay");
  const btnPlayground = document.getElementById("btn-playground");

  let currentWidth = ${initialWidth};
  let currentHeight = ${initialHeight};
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  const updateTransform = () => {
    canvas.style.transform = \`translate(\${panX}px, \${panY}px) scale(\${scale})\`;
  };

  const fitToScreen = () => {
    const vw = viewport.clientWidth || window.innerWidth;
    const vh = viewport.clientHeight || window.innerHeight;
    const padding = 60;

    const scaleX = (vw - padding * 2) / currentWidth;
    const scaleY = (vh - padding * 2) / currentHeight;
    scale = Math.min(scaleX, scaleY, 1);

    panX = (vw - currentWidth * scale) / 2;
    panY = (vh - currentHeight * scale) / 2;

    updateTransform();
  };

  fitToScreen();

  // Pan & Zoom handlers
  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.min(Math.max(0.04, scale * factor), 8);
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

  window.addEventListener("resize", fitToScreen);

  document.getElementById("btn-zoom-in").onclick = () => {
    scale = Math.min(scale * 1.25, 8);
    updateTransform();
  };
  document.getElementById("btn-zoom-out").onclick = () => {
    scale = Math.max(scale * 0.8, 0.04);
    updateTransform();
  };
  document.getElementById("btn-reset").onclick = fitToScreen;

  // Graph Interactivity
  let resetHighlights = () => {};

  const initInteractiveGraph = () => {
    const svg = canvas.querySelector("svg");
    if (!svg) return;

    const nodes = new Map();
    const edges = [];

    const allGroups = Array.from(svg.querySelectorAll("g"));
    for (const g of allGroups) {
      const classAttr = g.getAttribute("class") || "";
      for (const token of classAttr.split(/\\s+/)) {
        if (!token) continue;
        try {
          const decoded = atob(token);
          const edgeMatch = decoded.match(/^\\((.*?)\\s*(?:->|-&gt;)\\s*(.*?)\\)\\[\\d+\\]$/);
          if (edgeMatch) {
            const sourceId = edgeMatch[1].trim();
            const targetId = edgeMatch[2].trim();
            const textEl = g.querySelector("text");
            const rawLabel = textEl ? textEl.textContent.trim() : "";
            edges.push({ el: g, sourceId, targetId, rawLabel });
            g.style.cursor = "pointer";
          } else if (!decoded.includes(" ") && !decoded.includes("(") && !decoded.includes("<") && /^[\\x20-\\x7E]+$/.test(decoded)) {
            nodes.set(decoded, g);
            g.style.cursor = "pointer";
          }
        } catch (_) {}
      }
    }

    const allElements = [...edges.map(e => e.el), ...Array.from(nodes.values())];

    resetHighlights = () => {
      for (const el of allElements) {
        el.classList.remove("is-dimmed", "is-highlighted-edge", "is-highlighted-node");
      }
      hud.innerHTML = "Hover over any node or arrow to inspect inheritance relationships.";
    };

    for (const edge of edges) {
      edge.el.addEventListener("mouseenter", () => {
        for (const el of allElements) el.classList.add("is-dimmed");

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

    for (const [nodeId, nodeEl] of nodes.entries()) {
      nodeEl.addEventListener("mouseenter", () => {
        for (const el of allElements) el.classList.add("is-dimmed");

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

    searchInput.oninput = (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        resetHighlights();
        return;
      }

      for (const [nodeId, nodeEl] of nodes.entries()) {
        if (nodeId.toLowerCase().includes(q)) {
          nodeEl.classList.remove("is-dimmed");
          nodeEl.classList.add("is-highlighted-node");
        } else {
          nodeEl.classList.add("is-dimmed");
          nodeEl.classList.remove("is-highlighted-node");
        }
      }
    };
  };

  initInteractiveGraph();

  // Dynamic Layout & Theme Switching
  const isServer = ${isServerBacked};

  const applyNewSvg = (svgHtml, width, height) => {
    currentWidth = width;
    currentHeight = height;
    canvas.style.width = \`\${width}px\`;
    canvas.style.height = \`\${height}px\`;
    canvas.innerHTML = svgHtml;

    initInteractiveGraph();
    fitToScreen();
  };

  const handleLayoutOrThemeChange = async () => {
    const layout = layoutSelect.value;
    const theme = themeSelect ? themeSelect.value : "0";

    if (isServer) {
      if (loadingOverlay) loadingOverlay.style.display = "block";
      try {
        const res = await fetch(\`/api/render?layout=\${layout}&theme=\${theme}\`);
        const data = await res.json();
        if (data.ok) {
          applyNewSvg(data.svg, data.width, data.height);
        }
      } catch (err) {
        console.error("Failed to load layout/theme:", err);
      } finally {
        if (loadingOverlay) loadingOverlay.style.display = "none";
      }
    } else {
      // Offline fallback: swap bundled template
      const tpl = document.getElementById(\`layout-tpl-\${layout}\`);
      if (tpl) {
        const w = parseFloat(tpl.dataset.width);
        const h = parseFloat(tpl.dataset.height);
        applyNewSvg(tpl.innerHTML, w, h);
      }
    }
  };

  layoutSelect.onchange = handleLayoutOrThemeChange;
  if (themeSelect) themeSelect.onchange = handleLayoutOrThemeChange;

  // D2 Playground (Tala) Button
  if (btnPlayground) {
    btnPlayground.onclick = async () => {
      if (isServer) {
        try {
          await fetch("/api/play", { method: "POST" });
        } catch (_) {}
      } else {
        window.open("https://play.d2lang.com", "_blank");
      }
    };
  }
})();
`;
