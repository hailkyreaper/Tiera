import { chromium } from "playwright";

const baseUrl = "http://localhost:3000";
const errors = [];
const steps = [];

function logStep(name, extra = "") {
  steps.push(`${name}${extra ? " — " + extra : ""}`);
  console.log("STEP:", name, extra);
}

async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    errors.push(`[step failed] ${name}: ${e}`);
    console.log("STEP FAILED:", name, String(e).slice(0, 300));
  }
}

const browser = await chromium.launch();

// ---------- Part 1: signup form mechanics (no saved session) ----------
await step("signup flow", async () => {
  const context = await browser.newContext({ viewport: { width: 412, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(`[signup] pageerror: ${e}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`[signup] console: ${m.text()}`); });

  await page.goto(`${baseUrl}/signup`, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "Sign up" }).click();
  await page.waitForTimeout(300);
  const emailInvalid = await page.locator("#email:invalid").count();
  logStep("signup empty submit", `email field :invalid = ${emailInvalid > 0}`);

  const testEmail = `qa-test-${Date.now()}@example.com`;
  await page.getByLabel("Email").fill(testEmail);
  await page.getByLabel("Password").fill("testpassword123");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.waitForURL((u) => u.pathname.includes("check-email"), { timeout: 10000 });
  logStep("signup submit", `landed on ${page.url()}`);
  await page.screenshot({ path: "scripts/.qa-signup-check-email.png" });

  await context.close();
});

// ---------- Part 2: authenticated core flow ----------
const context = await browser.newContext({
  storageState: "scripts/.auth/state.json",
  viewport: { width: 412, height: 900 },
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(`[app] pageerror on ${page.url()}: ${e}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`[app] console on ${page.url()}: ${m.text()}`); });

let listId = null;

await step("profile baseline", async () => {
  await page.goto(`${baseUrl}/profile`, { waitUntil: "networkidle" });
  logStep("profile loaded", page.url());
  await page.screenshot({ path: "scripts/.qa-profile-before.png" });
});

await step("create list + fill title", async () => {
  await page.goto(`${baseUrl}/lists`, { waitUntil: "networkidle" });
  await page.waitForURL((u) => /\/lists\/[^/]+/.test(u.pathname), { timeout: 10000 });
  listId = page.url().match(/lists\/([^/?]+)/)?.[1];
  logStep("create list", `id=${listId}, url=${page.url()}`);

  const titleInput = page.locator('input[name="title"]');
  await titleInput.fill("QA Walkthrough List");
  logStep("filled title", "");
});

await step("search books and add one", async () => {
  const searchBtn = page.getByRole("button", { name: /search books/i }).or(page.getByRole("link", { name: /search books/i }));
  const found = await searchBtn.count();
  if (!found) {
    errors.push("[app] Search Books button not found on create-list page");
    return;
  }
  await searchBtn.first().click();
  await page.waitForURL((u) => u.pathname.includes("/search"), { timeout: 10000 });
  logStep("navigated to list search", page.url());

  const searchInput = page.locator('input[type="search"], input[name="q"]').first();
  await searchInput.fill("Mistborn");
  await page.waitForTimeout(1200);
  const addBtn = page.getByRole("button", { name: /^add$/i }).first();
  const addCount = await addBtn.count();
  logStep("search results add buttons", String(addCount));
  if (addCount) {
    await addBtn.click();
    await page.waitForTimeout(800);
    logStep("added book from search", "");
  }
});

await step("back to list edit + publish as draft", async () => {
  await page.goto(`${baseUrl}/lists/${listId}?edit=true`, { waitUntil: "networkidle" });
  await page.screenshot({ path: "scripts/.qa-list-edit.png", fullPage: true });
  logStep("back on list edit page", page.url());

  const publishBtn = page.getByRole("button", { name: /publish/i }).first();
  if (!(await publishBtn.count())) {
    errors.push("[app] Publish button not found on list edit page");
    return;
  }
  await publishBtn.click();
  await page.waitForTimeout(500);
  const saveDraftBtn = page.getByRole("button", { name: /save draft/i }).first();
  if (!(await saveDraftBtn.count())) {
    errors.push("[app] Save Draft button not found after Publish click");
    return;
  }
  await saveDraftBtn.click();
  await page.waitForTimeout(1000);
  logStep("saved as draft", page.url());
});

await step("explore", async () => {
  await page.goto(`${baseUrl}/explore`, { waitUntil: "networkidle" });
  logStep("explore loaded", page.url());
  await page.screenshot({ path: "scripts/.qa-explore.png" });
});

await step("compare landing + detail", async () => {
  await page.goto(`${baseUrl}/compare`, { waitUntil: "networkidle" });
  logStep("compare landing loaded", page.url());
  const firstMatchLink = page.locator('a[href^="/compare/"]').first();
  const matchCount = await firstMatchLink.count();
  logStep("top match links found", String(matchCount));
  if (matchCount) {
    await firstMatchLink.click();
    await page.waitForURL((u) => u.pathname.startsWith("/compare/"), { timeout: 10000 });
    logStep("compare detail loaded", page.url());
    await page.screenshot({ path: "scripts/.qa-compare-detail.png", fullPage: true });
  }
});

await step("follow from compare detail", async () => {
  const followBtn = page.getByRole("button", { name: /^follow$/i }).first();
  if (await followBtn.count()) {
    const before = await followBtn.textContent();
    await followBtn.click();
    await page.waitForTimeout(800);
    const after = await page.getByRole("button", { name: /follow|following/i }).first().textContent().catch(() => "?");
    logStep("clicked follow", `${before} -> ${after}`);
  } else {
    logStep("follow button not found (may already be following)", "");
  }
});

await step("search books + people tabs", async () => {
  await page.goto(`${baseUrl}/search`, { waitUntil: "networkidle" });
  logStep("search page loaded", page.url());
  const peopleTab = page.getByRole("tab", { name: /people/i }).or(page.getByRole("link", { name: /people/i }));
  if (await peopleTab.count()) {
    await peopleTab.first().click();
    await page.waitForTimeout(500);
    logStep("clicked people tab", page.url());
  }
  await page.screenshot({ path: "scripts/.qa-search.png" });
});

await step("import entry points", async () => {
  await page.goto(`${baseUrl}/lists/${listId}/import/goodreads`, { waitUntil: "networkidle" });
  logStep("goodreads import page loaded", page.url());
  await page.goto(`${baseUrl}/lists/${listId}/import/ai`, { waitUntil: "networkidle" });
  logStep("ai import page loaded", page.url());
});

await step("profile edit", async () => {
  await page.goto(`${baseUrl}/profile?edit=true`, { waitUntil: "networkidle" });
  logStep("profile edit mode loaded", page.url());
  const bioInput = page.locator('textarea[name="bio"], input[name="bio"]').first();
  if (await bioInput.count()) {
    const original = await bioInput.inputValue();
    await bioInput.fill(original || "");
    logStep("bio field editable", "yes");
  } else {
    errors.push("[app] bio field not found on profile edit");
  }
  await page.screenshot({ path: "scripts/.qa-profile-edit.png" });
});

// Cleanup: discard the QA draft list so it doesn't linger in the account.
await step("cleanup: discard QA draft", async () => {
  if (!listId) return;
  await page.goto(`${baseUrl}/lists/${listId}?edit=true`, { waitUntil: "networkidle" });
  const cancelBtn = page.getByRole("button", { name: /cancel/i }).first();
  if (await cancelBtn.count()) {
    await cancelBtn.click();
    await page.waitForTimeout(800);
    logStep("discarded QA draft list", listId);
  }
});

await context.close();
await browser.close();

console.log("\n=== STEPS ===");
steps.forEach((s) => console.log(" -", s));
console.log("\n=== ERRORS ===");
console.log(errors.length ? errors.join("\n") : "none");
