export const VIEWER_CSS = `
:root {
  --bg: #0f172a;
  --panel-bg: rgba(30, 41, 59, 0.88);
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

#canvas > svg {
  display: block;
}

/* Transitions */
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

/* Highlighted edge */
.is-highlighted-edge {
  opacity: 1 !important;
  filter: drop-shadow(0 0 6px currentColor) !important;
}
.is-highlighted-edge path.connection {
  stroke-width: 4.5px !important;
}

/* Highlighted node */
.is-highlighted-node {
  opacity: 1 !important;
  filter: drop-shadow(0 0 10px var(--accent)) drop-shadow(0 0 2px #fff) !important;
}

/* Toolbar */
#toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 10px;
  align-items: center;
  background: var(--panel-bg);
  backdrop-filter: blur(10px);
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  z-index: 10;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  font-weight: 600;
}

.select-input, #search {
  background: #0f172a;
  border: 1px solid var(--border);
  color: var(--text);
  padding: 5px 8px;
  border-radius: 8px;
  font-size: 12px;
  outline: none;
}
.select-input:focus, #search:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
}

#search {
  width: 170px;
}

.btn {
  background: #1e293b;
  border: 1px solid var(--border);
  color: var(--text);
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.btn:hover {
  background: #334155;
  border-color: var(--accent);
}
.btn-accent {
  background: #0369a1;
  border-color: #0284c7;
}
.btn-accent:hover {
  background: #0284c7;
}

#hud {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: var(--panel-bg);
  backdrop-filter: blur(10px);
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-muted);
  z-index: 10;
  max-width: 560px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  pointer-events: none;
}
#hud strong { color: var(--text); }
#hud code {
  background: rgba(0,0,0,0.3);
  padding: 2px 5px;
  border-radius: 4px;
  font-family: monospace;
  color: var(--accent);
}

#loading-overlay {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(6px);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--accent);
  border: 1px solid var(--border);
  display: none;
  z-index: 10;
}
`;
