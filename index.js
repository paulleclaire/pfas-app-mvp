// index.js — Express server + RSS endpoint + health check
import express from "express";
import Parser from "rss-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Serve the /public folder
app.use(express.static(join(__dirname, "public")));

// Root -> index.html
app.get("/", (_req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

// Health
app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// RSS feeds
const parser = new Parser();
const FEEDS = {
  global: [
    "https://news.google.com/rss/search?q=PFAS%20OR%20%22forever%20chemicals%22&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=PFAS%20water%20OR%20drinking%20water%20OR%20health&hl=en-GB&gl=GB&ceid=GB:en",
  ],
  jersey: [
    "https://news.google.com/rss/search?q=PFAS%20Jersey%20%22Channel%20Islands%22&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Ajerseyeveningpost.com&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Abailiwickexpress.com&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Aitv.com%20%22Channel%20Islands%22&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Agov.je&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Astatesassembly.gov.je&hl=en-GB&gl=GB&ceid=GB:en",
  ],
  official: [
    "https://news.google.com/rss/search?q=pfas%20site%3Aepa.gov&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Aecha.europa.eu&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Aeuropa.eu&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Awho.int&hl=en-GB&gl=GB&ceid=GB:en",
  ],
  science: [
    "https://news.google.com/rss/search?q=PFAS%20site%3Anature.com&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=PFAS%20site%3Asciencedaily.com&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=PFAS%20site%3Athelancet.com&hl=en-GB&gl=GB&ceid=GB:en",
  ],
};

const cache = {};
const CACHE_TTL = 10 * 60 * 1000;

app.get("/api/news", async (req, res) => {
  try {
    const scope = req.query.scope || "global";
    if (!FEEDS[scope]) {
      return res
        .status(400)
        .json({
          error: "Invalid scope. Use: global, jersey, official, or science",
        });
    }

    const now = Date.now();
    if (cache[scope] && now - cache[scope].timestamp < CACHE_TTL) {
      return res.json(cache[scope].items);
    }

    const items = [];
    for (const url of FEEDS[scope]) {
      const feed = await parser.parseURL(url);
      items.push(
        ...feed.items.map((i) => ({
          title: i.title,
          link: i.link,
          pubDate: new Date(i.pubDate || i.isoDate || Date.now()).toISOString(),
        })),
      );
    }

    const seen = new Set();
    const unique = items.filter(
      (it) => !seen.has(it.link) && seen.add(it.link),
    );
    unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    const result = unique.slice(0, 25);

    cache[scope] = { items: result, timestamp: now };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`PFAS app server running on http://localhost:${PORT}`);
});
