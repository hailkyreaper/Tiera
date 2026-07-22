import { chromium } from "playwright";

const baseUrl = "http://localhost:3000";

const pagesToScan = [
  "/explore",
  "/search",
  "/compare",
  "/profile",
  "/profile?tab=library",
  "/recommendations",
  "/u/bookgood",
];

const browser = await chromium.launch();
const context = await browser.newContext({
  storageState: "scripts/.auth/state.json",
  viewport: { width: 412, height: 900 },
});
const page = await context.newPage();

const allLinks = new Set();

for (const p of pagesToScan) {
  await page.goto(`${baseUrl}${p}`, { waitUntil: "load", timeout: 30000 }).catch((e) =>
    console.log(`FAILED TO LOAD ${p}: ${e}`),
  );
  await page.waitForTimeout(1500);
  const hrefs = await page.locator("a[href]").evaluateAll((els) =>
    els.map((el) => el.getAttribute("href")),
  );
  for (const h of hrefs) {
    if (!h) continue;
    if (h.startsWith("http") && !h.startsWith(baseUrl)) continue; // external, skip
    if (h.startsWith("mailto:") || h.startsWith("tel:")) continue;
    allLinks.add(h);
  }
  console.log(`${p} -> ${hrefs.length} links found`);
}

console.log(`\ntotal distinct internal links to check: ${allLinks.size}`);

const results = [];
for (const link of allLinks) {
  const full = link.startsWith("http") ? link : `${baseUrl}${link}`;
  try {
    const resp = await page.goto(full, { waitUntil: "load", timeout: 20000 });
    let status = resp?.status();
    // Follow client redirects (e.g. streamed redirect to /login) briefly.
    await page.waitForTimeout(1500);
    const finalUrl = page.url();
    const bodyText = await page.locator("body").innerText().catch(() => "");
    const looksNotFound = /page not found|404/i.test(bodyText.slice(0, 200));
    results.push({ link, status, finalUrl, looksNotFound });
  } catch (e) {
    results.push({ link, status: "ERROR", finalUrl: null, error: String(e).slice(0, 150) });
  }
}

console.log("\n=== Results ===");
for (const r of results) {
  const flag = r.status === "ERROR" || r.looksNotFound || (r.status && r.status >= 400) ? "FLAG" : "ok";
  console.log(
    `[${flag}] ${r.link.padEnd(45)} status=${r.status} finalUrl=${r.finalUrl ?? r.error}`,
  );
}

await browser.close();
