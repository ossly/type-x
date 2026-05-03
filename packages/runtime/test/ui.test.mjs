import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
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

test("createCommandUi.task does not put stdin into raw mode", () => {
  const output = createBufferedInteractiveOutput();
  const ui = createCommandUi({ input: process.stdin, output });
  const isTtyDescriptor = Object.getOwnPropertyDescriptor(
    process.stdin,
    "isTTY",
  );
  const setRawModeDescriptor = Object.getOwnPropertyDescriptor(
    process.stdin,
    "setRawMode",
  );
  const rawModes = [];

  output.cursorTo = () => true;
  output.clearLine = () => true;
  output.moveCursor = () => true;

  Object.defineProperty(process.stdin, "isTTY", {
    configurable: true,
    value: true,
  });
  Object.defineProperty(process.stdin, "setRawMode", {
    configurable: true,
    value: (enabled) => {
      rawModes.push(enabled);
      return process.stdin;
    },
  });

  try {
    const task = ui.task("Installing package");
    task.done("Installed package");

    assert.deepEqual(rawModes, []);
  } finally {
    restoreProperty(process.stdin, "isTTY", isTtyDescriptor);
    restoreProperty(process.stdin, "setRawMode", setRawModeDescriptor);
  }
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

const restoreProperty = (object, propertyName, descriptor) => {
  if (descriptor) {
    Object.defineProperty(object, propertyName, descriptor);
    return;
  }

  delete object[propertyName];
};
