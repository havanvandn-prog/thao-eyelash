import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "images", "google-reviews");

const URLS = [
  "https://maps.app.goo.gl/oJhVNNZC7HXkm5Y57?g_st=iz",
  "https://maps.app.goo.gl/DjLUHoW6CyorUk7D7?g_st=iz",
  "https://maps.app.goo.gl/NKKeXwzFLYbSGwPx5?g_st=iz",
  "https://maps.app.goo.gl/FfsjiMs8YF6jHn3y6?g_st=iz",
  "https://maps.app.goo.gl/zdHZff7mmrv2KqYE7?g_st=iz",
  "https://maps.app.goo.gl/52sDWFXMKkT2odfY9?g_st=iz",
  "https://maps.app.goo.gl/zf1YGcgm6wKCQ5a47?g_st=iz",
  "https://maps.app.goo.gl/XNDXA1eYxUMu2cVt8?g_st=iz",
  "https://maps.app.goo.gl/ZwmHtftf5oygfWAC6?g_st=iz",
];

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "reviewer";
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

async function extractReview(page) {
  await page.waitForSelector(".jftiEf", { timeout: 45000 });
  await new Promise((r) => setTimeout(r, 2000));

  const card = await page.$(".jftiEf");
  if (!card) throw new Error("Review card not found");

  // Show original-language review text when Google translation is active
  const buttons = await card.$$("button");
  for (const btn of buttons) {
    const label = await page.evaluate((el) => el.textContent || el.getAttribute("aria-label") || "", btn);
    if (/xem bản gốc|see original|view original/i.test(label)) {
      await btn.click();
      await new Promise((r) => setTimeout(r, 1200));
      break;
    }
  }

  return page.evaluate(() => {
    const card = document.querySelector(".jftiEf");
    if (!card) return { error: "no card" };

    const actionBtn = [...document.querySelectorAll("button")].find((b) =>
      /thao tác đối với bài đánh giá|actions on.*review/i.test(b.getAttribute("aria-label") || "")
    );
    const name =
      actionBtn
        ?.getAttribute("aria-label")
        ?.replace(/.*bài đánh giá của\s*/i, "")
        ?.replace(/.*review by\s*/i, "")
        ?.trim() || "Unknown";

    const avatarImg =
      document.querySelector(`img[alt*="${name}"]`) ||
      card.querySelector('img[src*="/a-"]') ||
      [...document.querySelectorAll("img")].find((img) => img.src.includes("googleusercontent.com/a-"));

    const avatarUrl = avatarImg?.src?.replace(/=w\d+-h\d+[^/]*/, "=w200-h200") || null;

    const photoUrls = [...card.querySelectorAll("button")]
      .filter((b) => /ảnh số|photo \d|image \d|before|after|trước|sau/i.test(b.getAttribute("aria-label") || ""))
      .map((b) => {
        const bg = getComputedStyle(b).backgroundImage;
        const m = bg.match(/url\(["']?(.*?)["']?\)/);
        return m ? m[1].replace(/\\u003d/g, "=") : null;
      })
      .filter(Boolean)
      .map((u) => u.replace(/=w\d+-h\d+[^)]*/, "=w800-h600"));

    const reviewText = card.querySelector(".wiI7pd")?.textContent?.trim() || "";
    const date = card.querySelector(".rsqaWe")?.textContent?.trim() || null;
    const stars = card.querySelectorAll('[aria-label*="sao"], [aria-label*="star"]').length || 5;

    return {
      name,
      reviewText,
      date,
      stars,
      avatarUrl,
      photoUrls,
      pageUrl: location.href,
    };
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1400,900"],
  });

  const results = [];

  try {
    for (let i = 0; i < URLS.length; i++) {
      const url = URLS[i];
      const page = await browser.newPage();
      await page.setViewport({ width: 1400, height: 900 });
      console.log(`[${i + 1}/${URLS.length}] ${url}`);
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.setViewport({ width: 1400, height: 900 });
        const data = await extractReview(page);
        const folder = path.join(OUT_DIR, `review-${String(i + 1).padStart(2, "0")}-${slugify(data.name)}`);
        fs.mkdirSync(folder, { recursive: true });

        const files = { avatar: null, photos: [] };

        if (data.avatarUrl) {
          const avatarPath = path.join(folder, "avatar.jpg");
          await downloadFile(data.avatarUrl, avatarPath);
          files.avatar = path.relative(ROOT, avatarPath).replace(/\\/g, "/");
        }

        for (let p = 0; p < data.photoUrls.length; p++) {
          const photoPath = path.join(folder, `photo-${p + 1}.jpg`);
          await downloadFile(data.photoUrls[p], photoPath);
          files.photos.push(path.relative(ROOT, photoPath).replace(/\\/g, "/"));
        }

        results.push({
          index: i + 1,
          sourceUrl: url,
          resolvedUrl: data.pageUrl,
          name: data.name,
          date: data.date,
          stars: data.stars,
          text: data.reviewText,
          files,
        });
      } catch (err) {
        results.push({ index: i + 1, sourceUrl: url, error: String(err) });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  const manifestPath = path.join(OUT_DIR, "reviews-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`Saved manifest: ${manifestPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
