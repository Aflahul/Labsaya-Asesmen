import { test, expect } from "vitest";
import { createActiveTimer } from "../../src/client/timer.js";
test("paused time and offline gap never count", () => {
  let now = 0;
  const t = createActiveTimer({ now: () => now });
  t.start();
  now = 500;
  t.pause();
  now = 50000;
  expect(t.readMs()).toBe(500);
  t.set(500);
  t.start();
  now = 50200;
  expect(t.readMs()).toBe(700);
});
