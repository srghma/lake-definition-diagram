export interface SizedSvg {
  readonly svg: string;
  readonly width: number;
  readonly height: number;
}

export const parseSvgDimensions = (
  svgContent: string
): { readonly width: number; readonly height: number } =>
  (() => {
    // 1. Check width and height attributes
    const wMatch = svgContent.match(/\bwidth="([\d.]+)"/);
    const hMatch = svgContent.match(/\bheight="([\d.]+)"/);
    if (wMatch && hMatch) {
      return { width: parseFloat(wMatch[1]), height: parseFloat(hMatch[1]) };
    }

    // 2. Fallback to viewBox="minX minY width height"
    const vbMatch = svgContent.match(
      /\bviewBox="[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)"/
    );
    if (vbMatch) {
      return { width: parseFloat(vbMatch[1]), height: parseFloat(vbMatch[2]) };
    }

    return { width: 3200, height: 1800 };
  })();

export const prepareSvg = (rawSvg: string): SizedSvg =>
  (() => {
    const cleanSvg = rawSvg.replace(/^<\?xml[^>]*\?>\s*/i, "").trim();
    const { width, height } = parseSvgDimensions(cleanSvg);

    const sizedSvg = cleanSvg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
      const hasW = /\bwidth=/.test(attrs);
      const hasH = /\bheight=/.test(attrs);
      if (hasW && hasH) return match;
      const extra = `${!hasW ? ` width="${width}"` : ""}${!hasH ? ` height="${height}"` : ""}`;
      return `<svg${attrs}${extra}>`;
    });

    return { svg: sizedSvg, width, height };
  })();
