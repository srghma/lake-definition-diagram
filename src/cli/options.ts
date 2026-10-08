import { c } from "../colors.ts";

export interface ParsedCliArgs {
  readonly query: string;
  readonly outPath: string | null;
  readonly stdoutOnly: boolean;
  readonly render: boolean;
  readonly wantsHtml: boolean;
  readonly shouldOpen: boolean;
  readonly verbose: boolean;
  readonly includeTypeclasses: boolean;
}

export const printHelp = () => {
  console.log(`${c.bold("Usage:")} lake-definition-diagram <symbol-or-notation> [options]

${c.bold("Examples:")}
  ${c.cyan('lake-definition-diagram "→+*" --html')}
  ${c.cyan('lake-definition-diagram "→+*" --html --open')}
  ${c.cyan('lake-definition-diagram "→+*" -r -v')}
  ${c.cyan('lake-definition-diagram RingHom -o RingHom.d2')}

${c.bold("Options:")}
  ${c.dim("-o, --output <file>")}      Output path for .d2, .svg, or .html file
  ${c.dim("-r, --render")}             Compile .d2 to .svg via d2
  ${c.dim("-i, --html")}               Generate interactive .html viewer with hover-tracing
  ${c.dim("--open")}                   Open interactive HTML viewer via local server
  ${c.dim("-v, --verbose, --full")}    Include docstrings, origin, and file paths
  ${c.dim("-p, --print")}              Print D2 diagram directly to stdout
  ${c.dim("--no-typeclasses")}         Exclude [C α] constraints from graph
`);
};

export const parseCliArgs = (args: readonly string[]): ParsedCliArgs =>
  (() => {
    const query = args[0] ?? "";
    const stdoutOnly = args.includes("-p") || args.includes("--print");
    const wantsHtml = args.includes("-i") || args.includes("--html");
    const shouldOpen = args.includes("--open");
    const render = args.includes("-r") || args.includes("--render") || wantsHtml;
    const verbose = args.includes("-v") || args.includes("--verbose") || args.includes("--full");
    const includeTypeclasses = !args.includes("--no-typeclasses");

    let outPath: string | null = null;
    const outIdx = args.findIndex((a) => a === "-o" || a === "--output");
    if (outIdx !== -1 && args[outIdx + 1]) {
      outPath = args[outIdx + 1];
    }

    return {
      query,
      outPath,
      stdoutOnly,
      render,
      wantsHtml,
      shouldOpen,
      verbose,
      includeTypeclasses,
    };
  })();
