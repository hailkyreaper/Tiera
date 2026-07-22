import { chromium } from "playwright";

const baseUrl = "http://localhost:3000";

// Routes expected to require auth (should end up at /login for a logged-out
// or invalid-session visitor). Explore/Search/Compare-landing/public-profile
// routes are intentionally excluded — those are meant to work logged out.
const protectedRoutes = [
  "/profile",
  "/profile/following",
  "/profile/favorites",
  "/lists",
  "/recommendations",
  "/admin/backfill-categories",
  "/admin/recommendation-outcomes",
  "/onboard/username",
];

const publicRoutes = ["/", "/explore", "/search", "/compare", "/u/bookgood"];

async function waitForSettledUrl(page, maxMs = 20000) {
  const start = Date.now();
  let lastUrl = page.url();
  while (Date.now() - start < maxMs) {
    await page.waitForTimeout(1000);
    const url = page.url();
    const text = await page.locator("body").innerText().catch(() => "");
    if (url === lastUrl && text.trim() !== "Loading…" && text.trim() !== "") {
      return { url, text: text.slice(0, 150) };
    }
    lastUrl = url;
  }
  return { url: page.url(), text: "(timed out waiting to settle)" };
}

const browser = await chromium.launch();

console.log("=== Protected routes, logged out (expect redirect to /login) ===");
{
  const context = await browser.newContext({ viewport: { width: 412, height: 900 } });
  const page = await context.newPage();
  for (const route of protectedRoutes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "load", timeout: 30000 }).catch(() => {});
    const { url, text } = await waitForSettledUrl(page);
    const ok = url.includes("/login") || url.includes("/onboard");
    console.log(`${route.padEnd(28)} -> ${ok ? "OK" : "FAIL"} settled=${url}`);
    if (!ok) console.log("   body:", text);
  }
  await context.close();
}

console.log("\n=== Public routes, logged out (expect real content, no redirect) ===");
{
  const context = await browser.newContext({ viewport: { width: 412, height: 900 } });
  const page = await context.newPage();
  for (const route of publicRoutes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "load", timeout: 30000 }).catch(() => {});
    const { url, text } = await waitForSettledUrl(page);
    const redirectedToLogin = url.includes("/login");
    console.log(`${route.padEnd(28)} -> ${redirectedToLogin ? "FAIL (redirected)" : "OK"} settled=${url}`);
    if (redirectedToLogin) console.log("   body:", text);
  }
  await context.close();
}

console.log("\n=== Tampered/invalid session cookie (expect same as logged out) ===");
{
  const context = await browser.newContext({ viewport: { width: 412, height: 900 } });
  await context.addCookies([
    {
      name: "sb-ptqykneuyqrcqdigomzt-auth-token",
      value: "base64-eyJhY2Nlc3NfdG9rZW4iOiJpbnZhbGlkLXRva2VuLXZhbHVlIn0=",
      domain: "localhost",
      path: "/",
    },
  ]);
  const page = await context.newPage();
  for (const route of ["/profile", "/lists"]) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "load", timeout: 30000 }).catch(() => {});
    const { url, text } = await waitForSettledUrl(page);
    const ok = url.includes("/login");
    console.log(`${route.padEnd(28)} -> ${ok ? "OK" : "FAIL"} settled=${url}`);
    if (!ok) console.log("   body:", text);
  }
  await context.close();
}

await browser.close();
