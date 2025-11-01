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

// simple health status
app.get("/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// very small PFAS news feed (can change later)
const parser = new Parser();
const FEEDS = [
  "https://news.google.com/rss/search?q=PFAS&hl=en-GB&gl=GB&ceid=GB:en"
];

app.get("/api/news", async (_req, res) => {
  try {
    const items = [];
    for (const url of FEEDS) {
      const feed = await parser.parseURL(url);
      items.push(
        ...feed.items.slice(0, 6).map(i => ({
          title: i.title,
          link: i.link,
          pubDate: i.pubDate
        }))
      );
    }
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    res.json(items.slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`PFAS app server running on http://localhost:${PORT}`);
});