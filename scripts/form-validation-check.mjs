import { chromium } from "playwright";

const baseUrl = "http://localhost:3000";
const browser = await chromium.launch();
const context = await browser.newContext({
  storageState: "scripts/.auth/state.json",
  viewport: { width: 412, height: 900 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("dialog", async (d) => {
  errors.push(`UNEXPECTED DIALOG (possible XSS via alert): ${d.message()}`);
  await d.dismiss();
});

async function waitForDraftUrl(page, maxMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (/\/lists\/[^/]+/.test(new URL(page.url()).pathname)) return page.url();
    await page.waitForTimeout(500);
  }
  throw new Error("timed out waiting for /lists to redirect to a draft");
}

// Set up: create a fresh draft list to test title/description on.
await page.goto(`${baseUrl}/lists`, { waitUntil: "load", timeout: 30000 });
await waitForDraftUrl(page);
const listId = page.url().match(/lists\/([^/?]+)/)[1];
console.log("test list id:", listId);

// --- 1. Empty title submit -> should fall back to default, not crash ---
await page.locator('input[name="title"]').fill("");
const publishBtn = page.getByRole("button", { name: /publish/i }).first();
await publishBtn.click();
await page.waitForTimeout(1000);
const saveDraftBtn = page.getByRole("button", { name: /save draft/i }).first();
if (await saveDraftBtn.count()) {
  await saveDraftBtn.click();
  await page.waitForTimeout(1500);
}
await page.goto(`${baseUrl}/lists/${listId}?edit=true`, { waitUntil: "load", timeout: 30000 });
await page.waitForTimeout(1500);
const titleAfterEmpty = await page.locator('input[name="title"]').inputValue();
console.log("title after empty submit:", JSON.stringify(titleAfterEmpty));

// --- 2. Overlong title (bypass client maxlength) ---
const longTitle = "A".repeat(500);
await page.evaluate(() => {
  document.querySelector('input[name="title"]')?.removeAttribute("maxlength");
});
await page.locator('input[name="title"]').fill(longTitle);
const publishBtn2 = page.getByRole("button", { name: /publish/i }).first();
await publishBtn2.click();
await page.waitForTimeout(1000);
const saveDraftBtn2 = page.getByRole("button", { name: /save draft/i }).first();
if (await saveDraftBtn2.count()) {
  await saveDraftBtn2.click();
  await page.waitForTimeout(1500);
}
await page.goto(`${baseUrl}/lists/${listId}?edit=true`, { waitUntil: "load", timeout: 30000 });
await page.waitForTimeout(1500);
const titleAfterLong = await page.locator('input[name="title"]').inputValue();
console.log("title length stored after 500-char submit:", titleAfterLong.length);

// --- 3. XSS payload in title + description ---
const xssPayload = `<img src=x onerror="window.__xssFired=true">`;
await page.evaluate(() => {
  document.querySelector('input[name="title"]')?.removeAttribute("maxlength");
});
await page.locator('input[name="title"]').fill(xssPayload);
const descInput = page.locator('textarea[name="description"]').first();
if (await descInput.count()) {
  await descInput.fill(xssPayload);
}
const publishBtn3 = page.getByRole("button", { name: /publish/i }).first();
await publishBtn3.click();
await page.waitForTimeout(1000);
const saveDraftBtn3 = page.getByRole("button", { name: /save draft/i }).first();
if (await saveDraftBtn3.count()) {
  await saveDraftBtn3.click();
  await page.waitForTimeout(1500);
}

// View the list as rendered (not the edit form) to check real DOM rendering
await page.goto(`${baseUrl}/lists/${listId}?manage=true`, { waitUntil: "load", timeout: 30000 });
await page.waitForTimeout(2000);
const xssFired = await page.evaluate(() => window.__xssFired === true);
console.log("XSS payload executed (window.__xssFired)?", xssFired);
const pageContainsRawImgTag = (await page.content()).includes("<img src=x onerror=");
console.log("raw <img onerror> tag present unescaped in HTML?", pageContainsRawImgTag);
const visibleText = await page.locator("body").innerText();
console.log("payload visible as literal text on page?", visibleText.includes(xssPayload));

console.log("\npage/console errors during form validation checks:", errors.length ? errors : "none");

// Cleanup
await page.goto(`${baseUrl}/lists/${listId}?edit=true`, { waitUntil: "load", timeout: 30000 });
await page.waitForTimeout(1000);
const cancelBtn = page.getByRole("button", { name: /cancel/i }).first();
if (await cancelBtn.count()) {
  await cancelBtn.click();
  await page.waitForTimeout(1000);
  console.log("cleaned up test list", listId);
} else {
  console.log("WARNING: could not find Cancel button to clean up", listId);
}

await browser.close();
