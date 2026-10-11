import { test, expect } from "@playwright/test";
import { register, enterMission } from "./helpers.js";
import { MISSIONS } from "../../src/shared/missions.js";
test("world map labels do not overlap and details belong to the selected island", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".hero-foot")).toHaveCount(0);
  await register(page);
  await enterMission(page, MISSIONS[0]);
  await expect(page.locator(".nara-bubble .nara-live")).toHaveCount(0);
  const bubble = await page.locator(".nara-bubble").boundingBox(),
    nara = await page.locator("#nara-toast > .nara-live").boundingBox();
  expect(nara.y).toBeGreaterThan(bubble.y + bubble.height);
  await page.getByRole("button", { name: "Peta", exact: true }).click();
  await expect(page.locator(".mission-dock")).toHaveCount(0);
  await expect(page.locator(".island-entry")).toHaveCount(0);
  for (const width of [1920, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    const boxes = await page.locator(".island-label").evaluateAll((es) =>
      es.map((e) => {
        const r = e.getBoundingClientRect();
        return { l: r.left, r: r.right, t: r.top, b: r.bottom };
      }),
    );
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++)
        expect(
          boxes[i].r <= boxes[j].l ||
            boxes[j].r <= boxes[i].l ||
            boxes[i].b <= boxes[j].t ||
            boxes[j].b <= boxes[i].t,
        ).toBe(true);
    await page.locator('.island-art[data-island="1"]').click();
    await expect(page.locator(".island-entry")).toHaveCount(1);
    await expect(page.locator(".island-entry [data-mission]")).toHaveCount(3);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/map-menu-${width}.png`,
      fullPage: true,
    });
    await page.locator("[data-close-island]").click();
    await expect(page.locator(".island-entry")).toHaveCount(0);
  }
});
