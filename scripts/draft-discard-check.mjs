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
page.on("pageerror", (err) => consoleErrors.push(String(err)));

const MARKER = "DRAFT DISCARD TEST " + Date.now();

// Create a brand-new draft (mirrors NavBar's Create tap).
await page.goto(`${baseUrl}/lists`, { waitUntil: "load" });
await page.waitForURL(/\/lists\/[^/]+\?edit=true/, { timeout: 15000 });
const id = page.url().match(/lists\/([^/?]+)/)[1];
console.log("Created draft list id:", id);
await page.screenshot({ path: "design_screenshots/draft-discard-01-created.png" });

// Give it a distinctive title so we can check it never shows up anywhere after.
const titleInput = page.getByPlaceholder(/title/i).first();
if (await titleInput.count()) {
  await titleInput.fill(MARKER);
} else {
  console.log("Could not find a title input by placeholder — trying textbox role");
  await page.getByRole("textbox").first().fill(MARKER);
}
await page.screenshot({ path: "design_screenshots/draft-discard-02-titled.png" });

// Tap the bottom nav's Profile tab — should discard the draft, not just navigate.
await page.getByRole("link", { name: /Profile/i }).click();
await page.waitForURL((url) => url.pathname === "/profile", { timeout: 10000 });
await page.waitForLoadState("load");
await page.screenshot({ path: "design_screenshots/draft-discard-03-profile.png" });

const profileHtml = await page.content();
const markerOnProfile = profileHtml.includes(MARKER);
console.log("Marker title visible on /profile:", markerOnProfile);

// Directly revisit the list's own URL — if it was really deleted, this 404s.
const response = await page.goto(`${baseUrl}/lists/${id}`, { waitUntil: "load" });
console.log("Direct revisit status:", response.status());
await page.screenshot({ path: "design_screenshots/draft-discard-04-revisit.png" });

console.log("Console errors:", JSON.stringify(consoleErrors));

await browser.close();
