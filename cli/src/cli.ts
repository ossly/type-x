#!/usr/bin/env node

const args = process.argv.slice(2);
const message =
  args.length > 0 ? `x hello world: ${args.join(" ")}` : "x hello world";

process.stdout.write(`${message}\n`);
