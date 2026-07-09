import { chromium } from "playwright";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const url = process.argv[2];
const outPath = process.argv[3];

if (!url || !outPath) {
  console.error("Usage: node scripts/screenshot.mjs <url> <outPath>");
  process.exit(1);
}

const statePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  ".auth/state.json",
);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 412, height: 915 },
  storageState: existsSync(statePath) ? statePath : undefined,
});
await page.goto(url, { waitUntil: "networkidle" });
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(`Saved screenshot to ${outPath}`);
