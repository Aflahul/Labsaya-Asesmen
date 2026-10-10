import { test, expect } from "vitest";
import { runPython } from "../../src/shared/python.js";
test("print records a snapshot rather than a mutable list reference", () => {
  const r = runPython("a = [1,2]\nprint(a)\na.pop(0)\nprint(a)");
  expect(r.ok).toBe(true);
  expect(r.outputs).toEqual([[1, 2], [2]]);
});
test("rejects non-finite numbers and unsafe or unsupported instructions", () => {
  expect(runPython("a = " + "9".repeat(310) + "\nprint(a)").ok).toBe(false);
  for (const code of [
    "import os",
    '__import__("os")',
    "while True: pass",
    "print(1/0)",
    "a = [1]\nprint(a[4])",
  ])
    expect(runPython(code).ok).toBe(false);
});
test("flat-list teaching subset rejects nested, aliased and cyclic list graphs", () => {
  for (const code of [
    "a = [0]\na = [a,a]\nprint(1)",
    "a = [0]\na.append(a)\nprint(1)",
    "a = [0]\na[0] = a\nprint(1)",
    "a = [[1,2],[3,4]]\nprint(1)",
  ])
    expect(runPython(code).ok).toBe(false);
});
