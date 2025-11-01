// index.js — tiny Express server + RSS endpoint + health check
import express from "express";
import Parser from "rss-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// serve the /public folder with absolute path
app.use(express.static(join(__dirname, "public")));

// fallback route for root
app.get("/", (_req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

// simple health status
app.get("/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// multi-scope RSS feeds
const parser = new Parser();
const FEEDS = {
  global: [
    "https://news.google.com/rss/search?q=PFAS%20OR%20%22forever%20chemicals%22&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=PFAS%20water%20OR%20drinking%20water%20OR%20health&hl=en-GB&gl=GB&ceid=GB:en"
  ],
  jersey: [
    "https://news.google.com/rss/search?q=PFAS%20Jersey%20%22Channel%20Islands%22&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Ajerseyeveningpost.com&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Abailiwickexpress.com&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Aitv.com%20%22Channel%20Islands%22&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Agov.je&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Astatesassembly.gov.je&hl=en-GB&gl=GB&ceid=GB:en"
  ],
  official: [
    "https://news.google.com/rss/search?q=pfas%20site%3Aepa.gov&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Aecha.europa.eu&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Aeuropa.eu&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=pfas%20site%3Awho.int&hl=en-GB&gl=GB&ceid=GB:en"
  ],
  science: [
    "https://news.google.com/rss/search?q=PFAS%20site%3Anature.com&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=PFAS%20site%3Asciencedaily.com&hl=en-GB&gl=GB&ceid=GB:en",
    "https://news.google.com/rss/search?q=PFAS%20site%3Athelancet.com&hl=en-GB&gl=GB&ceid=GB:en"
  ]
};

// in-memory cache with 10-minute TTL
const cache = {};
const CACHE_TTL = 10 * 60 * 1000;

app.get("/api/news", async (req, res) => {
  try {
    const scope = req.query.scope || "global";
    
    // validate scope
    if (!FEEDS[scope]) {
      return res.status(400).json({ error: "Invalid scope. Use: global, jersey, official, or science" });
    }
    
    // check cache
    const now = Date.now();
    if (cache[scope] && (now - cache[scope].timestamp < CACHE_TTL)) {
      return res.json(cache[scope].items);
    }
    
    // fetch fresh data
    const items = [];
    for (const url of FEEDS[scope]) {
      const feed = await parser.parseURL(url);
      items.push(
        ...feed.items.map(i => ({
          title: i.title,
          link: i.link,
          pubDate: new Date(i.pubDate || i.isoDate).toISOString()
        }))
      );
    }
    
    // deduplicate by link
    const seen = new Set();
    const unique = items.filter(item => {
      if (seen.has(item.link)) return false;
      seen.add(item.link);
      return true;
    });
    
    // sort by date descending, cap to 25
    unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    const result = unique.slice(0, 25);
    
    // update cache
    cache[scope] = { items: result, timestamp: now };
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`PFAS app server running on http://localhost:${PORT}`);
});