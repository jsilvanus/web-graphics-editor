import { expect, test, type Page } from "@playwright/test";

/** Collects uncaught page errors and console errors, ignoring GPU driver noise from software WebGL. */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/GL Driver Message|GroupMarkerNotSet|swiftshader/i.test(text)) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

const documentJson = async (page: Page) =>
  JSON.parse((await page.locator("details pre").textContent()) ?? "{}");

test("2D editor loads and edits a layer", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/?editor=2d");

  const artboard = page.locator(".ge-artboard");
  await expect(artboard).toBeVisible();
  await expect(artboard.getByText("Hello graphics editor")).toBeVisible();

  // Add a rectangle, then drag the title layer and undo the drag.
  await page.locator(".ge-toolbar button", { hasText: "Rectangle" }).first().click();
  expect((await documentJson(page)).layers).toHaveLength(2);

  const box = (await artboard.boundingBox())!;
  const scale = box.width / 1920;
  const start = { x: box.x + 400 * scale, y: box.y + 340 * scale };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 50, start.y + 25, { steps: 6 });
  await page.mouse.up();
  const moved = (await documentJson(page)).layers.find((layer: { id: string }) => layer.id === "title");
  expect(moved.x).toBeGreaterThan(160);

  await page.getByRole("button", { name: /Undo/ }).first().click();
  const undone = (await documentJson(page)).layers.find((layer: { id: string }) => layer.id === "title");
  expect(undone.x).toBe(160);

  expect(errors).toEqual([]);
});

test("3D workspace loads, selects and extrudes", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/?editor=3d");

  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "box", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // Select the sphere from the scene list, then back to the box and extrude one of its faces.
  await page.getByRole("button", { name: "sphere", exact: true }).click();
  await expect(page.getByRole("button", { name: "sphere", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "box", exact: true }).click();

  const world = async () => JSON.parse((await page.locator("details pre").textContent()) ?? "{}");
  const boxMesh = async () => (await world()).meshes.find((mesh: { id: string }) => mesh.id === "box");
  const before = (await boxMesh()).geometry.vertices.length;

  await page.getByRole("button", { name: "Faces", exact: true }).click();
  const canvas = (await page.locator("canvas").boundingBox())!;
  // The box sits in the middle of the default editor view.
  await page.mouse.click(canvas.x + canvas.width * 0.54, canvas.y + canvas.height * 0.48);
  await page.getByRole("button", { name: "Extrude", exact: true }).click();
  expect((await boxMesh()).geometry.vertices.length).toBeGreaterThan(before);

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect((await boxMesh()).geometry.vertices.length).toBe(before);

  expect(errors).toEqual([]);
});
