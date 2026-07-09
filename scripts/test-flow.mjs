import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const outDir = process.argv[3];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 412, height: 915 },
  storageState: "scripts/.auth/state.json",
});

await page.goto(`${baseUrl}/lists`, { waitUntil: "networkidle" });
const id = page.url().match(/lists\/([^/?]+)/)[1];
console.log("list id:", id);

await page.goto(`${baseUrl}/lists/${id}/library`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/library-page.png` });

const addButton = page.getByRole("button", { name: /add/i }).first();
console.log("add buttons found:", await addButton.count());
if (await addButton.count()) {
  await addButton.click();
  await page.waitForTimeout(1000);
}

await page.goto(`${baseUrl}/lists/${id}?edit=true&new=true`, {
  waitUntil: "networkidle",
});
await page.screenshot({ path: `${outDir}/after-add.png`, fullPage: true });

await browser.close();
console.log("done");
