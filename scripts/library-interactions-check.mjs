import { chromium } from "playwright";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = process.argv[2] ?? "http://localhost:3001";
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
page.on("pageerror", (err) => consoleErrors.push(String(err)));

await page.goto(`${baseUrl}/profile?tab=library`, { waitUntil: "networkidle" });

await page.getByRole("button", { name: "Filter" }).click();
await page.screenshot({ path: "design_screenshots/library-filter-open.png" });
await page.keyboard.press("Escape");

await page.getByRole("button", { name: "Sort" }).click();
await page.screenshot({ path: "design_screenshots/library-sort-open.png" });
await page.getByRole("menuitem", { name: /Title/ }).click();
await page.waitForURL((url) => url.searchParams.get("sort") === "title");
await page.screenshot({ path: "design_screenshots/library-sort-title.png" });

await page.locator('[aria-label="Book options"]').first().click();
await page.screenshot({ path: "design_screenshots/library-kebab-open.png" });

console.log("Console errors:", JSON.stringify(consoleErrors));
console.log("Final URL:", page.url());

await browser.close();
