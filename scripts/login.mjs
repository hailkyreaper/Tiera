import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = process.argv[2] ?? "http://localhost:3001";
const email = process.env.TIERA_EMAIL;
const password = process.env.TIERA_PASSWORD;

if (!email || !password) {
  console.error("Set TIERA_EMAIL and TIERA_PASSWORD env vars before running.");
  process.exit(1);
}

const authDir = path.join(path.dirname(fileURLToPath(import.meta.url)), ".auth");
mkdirSync(authDir, { recursive: true });
const statePath = path.join(authDir, "state.json");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
await page.getByLabel("Email").fill(email);
await page.getByLabel("Password").fill(password);
await page.getByRole("button", { name: "Log in" }).click();
await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
  timeout: 15000,
});
await page.context().storageState({ path: statePath });
await browser.close();
console.log(`Saved logged-in session to ${statePath}`);
