import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough, Writable } from "node:stream";

import { createCommandUi } from "../dist/src/index.js";

test("createCommandUi rejects in non-interactive mode", async () => {
  const input = new PassThrough();
  const output = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  const ui = createCommandUi({ input, output });

  await assert.rejects(
    () => ui.confirm("Continue"),
    /Interactive UI is not available/,
  );
});

test("createCommandUi.task writes start, update, done, and fail lines", () => {
  const input = createInteractiveInput("");
  const output = createBufferedInteractiveOutput();
  const ui = createCommandUi({ input, output });

  const task = ui.task("Installing package");
  task.update("Resolving dependencies");
  task.done("Installed package");
  task.fail("Install failed");

  assert.equal(typeof output.getText(), "string");
});

const createInteractiveInput = (text) => {
  const input = new PassThrough();
  input.isTTY = true;
  input.end(text);
  return input;
};

const createBufferedInteractiveOutput = () => {
  let text = "";

  const output = new Writable({
    write(chunk, _encoding, callback) {
      text += chunk.toString();
      callback();
    },
  });

  output.isTTY = true;
  output.getText = () => text;

  return output;
};
