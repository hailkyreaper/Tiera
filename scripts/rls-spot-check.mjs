import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const dotenv = readFileSync(".env.local", "utf8");
const url = dotenv.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const anonKey = dotenv.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

// Access tokens are short-lived (~1h) — the saved storageState's cookie can
// hold a stale one, so grab a fresh one from a live authenticated session
// rather than reading scripts/.auth/state.json's cookie directly.
async function getFreshToken() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ storageState: "scripts/.auth/state.json" });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/profile", { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(2000);
  const cookies = await context.cookies();
  const authCookie = cookies.find((c) => c.name.includes("auth-token"));
  const decoded = JSON.parse(
    Buffer.from(authCookie.value.replace(/^base64-/, ""), "base64").toString("utf8"),
  );
  await browser.close();
  return { accessToken: decoded.access_token, userId: decoded.user.id };
}

const { accessToken, userId: myUserId } = await getFreshToken();
console.log("testing as user:", myUserId);

async function rest(path, opts = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

console.log("\n=== notifications: querying ALL rows, no filter (RLS should scope to my own) ===");
{
  const { status, body } = await rest("notifications?select=id,recipient_id,actor_id");
  const rows = Array.isArray(body) ? body : [];
  const notMine = rows.filter((r) => r.recipient_id !== myUserId);
  console.log("status:", status, "| rows:", rows.length, "| not mine:", notMine.length);
}

console.log("\n=== notifications: try to insert a row directly (expect 403, no insert policy) ===");
{
  const { status, body } = await rest("notifications", {
    method: "POST",
    body: JSON.stringify({ recipient_id: myUserId, actor_id: myUserId, type: "follow" }),
  });
  console.log("status:", status, "| body:", JSON.stringify(body).slice(0, 150));
}

console.log("\n=== recommendation_outcomes: querying rows (admin-only read policy) ===");
{
  const { status, body } = await rest(`recommendation_outcomes?select=id&limit=1`);
  console.log(
    "status:", status,
    "| rows visible:", Array.isArray(body) ? body.length : body,
    "| NOTE: this account is a real admin (verified via /admin/backfill-categories), so seeing rows here is expected, not a leak",
  );
}

console.log("\n=== books: try updating a non-granted column (title) — expect 403 ===");
{
  const { body: books } = await rest("books?select=id,title&limit=1");
  if (books[0]) {
    const { status, body } = await rest(`books?id=eq.${books[0].id}`, {
      method: "PATCH",
      body: JSON.stringify({ title: "RLS TEST TAMPERED TITLE" }),
    });
    console.log("status:", status, "| body:", JSON.stringify(body).slice(0, 200));
  }
}

console.log("\n=== books: try deleting a confirmed (non-draft) book — expect 0 rows affected ===");
{
  const { body: books } = await rest("books?select=id,title&is_draft=eq.false&limit=1");
  if (books[0]) {
    const { id, title } = books[0];
    const { status, body } = await rest(`books?id=eq.${id}`, {
      method: "DELETE",
      headers: { Prefer: "return=representation" },
    });
    const { body: recheck } = await rest(`books?id=eq.${id}&select=id`);
    console.log(
      `target: "${title}" | delete status: ${status} | rows deleted: ${Array.isArray(body) ? body.length : body} | still exists: ${Array.isArray(recheck) && recheck.length > 0}`,
    );
  }
}

console.log("\n=== owner-scoping: tier_lists (private) / user_books, unfiltered select ===");
{
  const { body } = await rest("tier_lists?select=id,user_id,is_public&is_public=eq.false");
  const rows = Array.isArray(body) ? body : [];
  console.log("private lists visible:", rows.length, "| not mine:", rows.filter((r) => r.user_id !== myUserId).length);
}
{
  const { body } = await rest("user_books?select=id,user_id");
  const rows = Array.isArray(body) ? body : [];
  console.log("user_books rows visible:", rows.length, "| not mine:", rows.filter((r) => r.user_id !== myUserId).length);
}
