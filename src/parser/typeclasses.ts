export const extractTypeclasses = (headerPart: string): readonly string[] =>
  (() => {
    const tcRegex = /\[([A-Za-z0-9_.]+)\s+[^\]]+\]/g;
    const tcs: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = tcRegex.exec(headerPart)) !== null) {
      tcs.push(m[1]);
    }
    return Object.freeze([...new Set(tcs)]);
  })();
