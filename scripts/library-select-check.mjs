import { chromium } from "playwright";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const statePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  ".auth/state.json",
);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 412, height: 915 },
  storageState: existsSync(statePath) ? statePath : undefined,
});

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

await page.goto(`${baseUrl}/profile?tab=library`, { waitUntil: "networkidle" });
await page.screenshot({ path: "design_screenshots/library-no-text.png" });

await page.getByRole("button", { name: "Select" }).click();
await page.screenshot({ path: "design_screenshots/library-select-mode-empty.png" });

const covers = page.locator("main >> text=Library").locator("..");
// Click the first two grid cells directly
const cells = page.locator("div.grid > div");
await cells.nth(0).click();
await cells.nth(2).click();
await page.screenshot({ path: "design_screenshots/library-select-mode-two-selected.png" });

const deleteButton = page.getByRole("button", { name: /Delete/ });
console.log("Delete button text:", await deleteButton.textContent());
console.log("Delete button disabled:", await deleteButton.isDisabled());

// Deselect one to confirm toggle works
await cells.nth(0).click();
console.log("Delete button text after deselect:", await deleteButton.textContent());

await page.getByRole("button", { name: "Cancel" }).click();
await page.screenshot({ path: "design_screenshots/library-after-cancel.png" });

console.log("Console errors:", JSON.stringify(consoleErrors));
await browser.close();
