import { chromium } from "playwright";

const baseUrl = "http://localhost:3000";

const pages = [
  "/",
  "/login",
  "/signup",
  "/explore",
  "/explore?tab=following",
  "/explore?tab=recent",
  "/search",
  "/search?type=people",
  "/compare",
  "/compare?tab=friends",
  "/compare/bookgood",
  "/profile",
  "/profile?edit=true",
  "/profile?tab=library",
  "/profile/following",
  "/profile/favorites",
  "/recommendations",
  "/u/bookgood",
];

const browser = await chromium.launch();
const context = await browser.newContext({
  storageState: "scripts/.auth/state.json",
  viewport: { width: 412, height: 900 },
});
const page = await context.newPage();

const findings = [];

page.on("pageerror", (e) => {
  findings.push({ url: page.url(), kind: "pageerror", text: String(e) });
});
page.on("console", (m) => {
  if (m.type() === "error") {
    findings.push({ url: page.url(), kind: "console.error", text: m.text() });
  }
});

for (const p of pages) {
  await page
    .goto(`${baseUrl}${p}`, { waitUntil: "load", timeout: 45000 })
    .catch((e) => findings.push({ url: p, kind: "navigation-failure", text: String(e).slice(0, 200) }));
  await page.waitForTimeout(1500);
  console.log(`visited ${p}`);
}

console.log(`\n=== ${findings.length} console/page errors found across ${pages.length} pages ===`);
for (const f of findings) {
  console.log(`\n[${f.kind}] on ${f.url}`);
  console.log(f.text.slice(0, 300));
}

await browser.close();
