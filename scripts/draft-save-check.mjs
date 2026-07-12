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

const MARKER = "DRAFT SAVE TEST " + Date.now();

await page.goto(`${baseUrl}/lists`, { waitUntil: "load" });
await page.waitForURL(/\/lists\/[^/]+\?edit=true/, { timeout: 15000 });
const id = page.url().match(/lists\/([^/?]+)/)[1];
console.log("Created draft list id:", id);

const titleInput = page.getByPlaceholder(/title/i).first();
await titleInput.fill(MARKER);

await page.getByRole("button", { name: /^Publish$/i }).click();
await page.waitForSelector("text=Review & Share", { timeout: 10000 });
await page.screenshot({ path: "design_screenshots/draft-save-01-review.png" });

await page.getByRole("button", { name: /Save Draft/i }).click();
await page.waitForURL((url) => url.pathname === "/profile", { timeout: 10000 });
await page.waitForLoadState("load");
await page.screenshot({ path: "design_screenshots/draft-save-02-profile.png" });

const profileHtml = await page.content();
console.log("Marker title visible on /profile:", profileHtml.includes(MARKER));

const response = await page.goto(`${baseUrl}/lists/${id}?edit=true`, {
  waitUntil: "load",
});
console.log("Direct revisit status:", response.status());
await page.screenshot({ path: "design_screenshots/draft-save-03-revisit.png" });

await browser.close();
