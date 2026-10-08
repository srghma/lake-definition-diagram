#!/usr/bin/env bun
import { runCli } from "./src/cli.ts";

runCli(process.argv.slice(2)).catch((err) => {
  console.error(err);
  process.exit(1);
});
