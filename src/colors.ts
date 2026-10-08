export const c = (() => {
  const isColorSupported =
    !("NO_COLOR" in process.env) &&
    process.env.FORCE_COLOR !== "0" &&
    (Boolean(process.stdout?.isTTY) || process.env.FORCE_COLOR === "1");

  const wrap = (code: number, reset = 39) => (s: string | number) =>
    isColorSupported ? `\x1b[${code}m${s}\x1b[${reset}m` : String(s);

  return {
    bold: wrap(1, 22),
    dim: wrap(2, 22),
    italic: wrap(3, 23),
    red: wrap(31),
    green: wrap(32),
    yellow: wrap(33),
    blue: wrap(34),
    magenta: wrap(35),
    cyan: wrap(36),
    gray: wrap(90),
    brightYellow: wrap(93),
    brightGreen: wrap(92),
    brightCyan: wrap(96),
  };
})();
