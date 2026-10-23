import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.DEMO_URL ?? "http://localhost:3322";
const OUT_DIR = "tools/.video";

mkdirSync(OUT_DIR, { recursive: true });

async function addLinkDemo(page) {
  await page.getByRole("button", { name: "Add link" }).click();
  await page.waitForTimeout(900);

  const dialog = page.getByRole("dialog");

  // paste URL → auto-fetch fires after 550ms debounce
  await page.locator("#stash-url").fill("https://nextjs.org");
  await page.waitForTimeout(450);

  // wait for fetch to finish (skeleton disappears / title filled)
  await dialog
    .locator("text=Reading the page…")
    .waitFor({ state: "hidden", timeout: 20000 })
    .catch(() => {});
  await page.waitForTimeout(1200);

  // safety: if metadata fetch failed, type a title so we can still save
  const titleValue = (await page.locator("#stash-title").inputValue()) ?? "";
  if (!titleValue.trim()) {
    await page.locator("#stash-title").fill("Next.js — the React framework");
  }

  await page.waitForTimeout(1000); // let the viewer absorb the preview
  await page.getByRole("button", { name: "Stash it" }).click();
  await page.waitForTimeout(1200); // toast + card entry animation
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: OUT_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  // ── 1) empty state
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // ── 2) sample data entry
  await page.getByRole("button", { name: "Add sample data" }).click();
  await page.locator("article").first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(2200);

  // gentle hover over first card
  await page.locator("article").first().hover({ position: { x: 300, y: 150 } });
  await page.waitForTimeout(1400);

  // ── 3) add-link flow with live metadata fetch
  await addLinkDemo(page);

  // ── 4) check two items off → progress animates
  const checkboxes = page.getByLabel(/^Mark .* as done$/);
  await checkboxes.first().click();
  await page.waitForTimeout(1100);
  await checkboxes.first().click();
  await page.waitForTimeout(1400);

  // ── 5) switch filter to “Done”
  await page.getByRole("tab", { name: "Done" }).click();
  await page.waitForTimeout(1600);
  await page.getByRole("tab", { name: "All" }).click();
  await page.waitForTimeout(1200);

  // ── 6) open a category
  await page.getByText("Watch later", { exact: true }).first().click();
  await page.waitForTimeout(1500);

  // ── 7) dark mode
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await page.waitForTimeout(1600);

  // hover a card in dark mode
  await page.locator("article").first().hover({ position: { x: 300, y: 150 } });
  await page.waitForTimeout(1800);

  // settle before close so the last frames are captured
  await page.waitForTimeout(1000);

  const video = page.video();
  await context.close(); // flushes the recording
  const path = await video.path().catch(() => null);
  console.log(JSON.stringify({ ok: true, video: path }));
  await browser.close();
}

main().catch(async (err) => {
  console.error(JSON.stringify({ ok: false, error: String(err) }));
  process.exit(1);
});
