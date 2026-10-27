/**
 * PriceRadar Backend v7.2 (Node.js / Express)
 * - 100% REAL live product scraping only (NO synthetic or fake products)
 * - Intelligent Relevance Scoring Engine (Most accurate real products rank #1 by default)
 * - Direct browser-header scraping with multi-tier error handling
 * - Dedicated anti-accessory filters for electronics & devices
 * - 90s in-memory cache with auto-eviction
 */

import express from 'express';
import cors from 'cors';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// ── Bulletproof CORS Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: false
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

// ScraperAPI key (optional — set in backend/.env)
let SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
let scraperApiDisabled = !SCRAPER_API_KEY;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getBrowserHeaders() {
  return {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  };
}

function scraperUrl(url) {
  return `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&country_code=in`;
}

// ── Cache (90s) ───────────────────────────────────────────────────────────────
const _cache = new Map();

function cacheGet(key) {
  const e = _cache.get(key);
  if (e && Date.now() - e.ts < 90 * 1000) return e.data;
  return null;
}

function cacheSet(key, data) {
  _cache.set(key, { ts: Date.now(), data });
  if (_cache.size > 100) {
    const sorted = [..._cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
    for (let i = 0; i < 30 && i < sorted.length; i++) _cache.delete(sorted[i][0]);
  }
}

function ckey(...parts) {
  return crypto.createHash('md5').update(parts.map(String).join('|')).digest('hex');
}

// ── Price Helpers ─────────────────────────────────────────────────────────────
function cleanPrice(text) {
  if (!text) return null;
  const t = String(text).replace(/[₹$£€,\s]/g, '');
  const m = t.match(/\d+(?:\.\d+)?/);
  if (!m) return null;
  const v = Math.round(parseFloat(m[0]));
  return v && v > 10 ? v : null;
}

/**
 * Stop words for token matching
 */
const STOP_WORDS = new Set([
  'a','an','the','for','with','and','or','of','to','in','on','at','by',
  'from','into','that','this','it','is','was','are','be','as','has',
]);

const ACCESSORY_SIGNALS = [
  'case','cover','screen guard','tempered glass','protector','pouch','sleeve',
  'charger','cable','adapter','stand','holder','mount','tripod','selfie stick',
  'earphone','earpiece','back panel','shell','skin','bumper','wallet',
  'fast charger','power delivery','lightning cable','usb-c cable','type-c cable',
];

/**
 * Filter out unrelated items & accessories disguised as the query product
 */
function isRelevant(name, query) {
  if (!name || !query) return false;
  const nameLower = name.toLowerCase();
  const queryLower = query.toLowerCase();

  const queryTerms = queryLower
    .split(/\s+/)
    .map(t => t.replace(/[^a-z0-9]/g, ''))
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));

  if (queryTerms.length === 0) return true;

  const nameWords = nameLower.split(/\s+/);
  function termMatches(term) {
    return nameLower.includes(term) ||
      nameWords.some(w => w.startsWith(term) || (term.startsWith(w) && w.length > 3));
  }

  if (!queryTerms.every(term => termMatches(term))) return false;

  const firstWords = nameLower.slice(0, 60);
  const isAccessoryLead = ACCESSORY_SIGNALS.some(signal => firstWords.includes(signal));
  if (isAccessoryLead) {
    const compatPattern = new RegExp(
      `(compatible|designed|made|works|for all|for apple|for iphone|fits)\\s+(with\\s+)?.*?${queryTerms[0]}`,
      'i'
    );
    if (compatPattern.test(name)) return false;
  }

  return true;
}

/**
 * Relevance Scoring Engine
 * Computes a relevance score so true products (e.g., iPhone) appear above accessories/unrelated items.
 */
function calculateRelevanceScore(product, query) {
  if (!product || !product.name) return 0;
  const name = product.name.toLowerCase();
  const q = (query || '').toLowerCase().trim();
  const qTokens = q.split(/\s+/).filter(t => t.length > 1);
  let score = 0;

  // 1. Exact phrase match
  if (name.includes(q)) {
    score += 50;
    if (name.startsWith(q) || name.startsWith('apple ' + q) || name.startsWith('samsung ' + q)) {
      score += 25;
    }
  }

  // 2. Token overlap
  let matchingTokens = 0;
  for (const token of qTokens) {
    if (name.includes(token)) matchingTokens++;
  }
  score += Math.round((matchingTokens / Math.max(1, qTokens.length)) * 30);

  // 3. Demote accessories when querying main products
  const isDeviceQuery = /\b(iphone|phone|galaxy|pixel|oneplus|laptop|macbook|ipad|tablet|tv|television|watch|camera)\b/i.test(q);
  const isAccessory = /\b(case|cover|glass|protector|screen|guard|cable|charger|adapter|cord|strap|skin|stand|holder|mount|tripod|selfie|pouch|sleeve|battery|housing|lens)\b/i.test(name);

  if (isDeviceQuery && isAccessory) {
    score -= 60;
  }

  // 4. Price realism for electronics: Real devices vs ₹200 parts
  if (isDeviceQuery && product.price) {
    if (product.price >= 15000) {
      score += 20;
    } else if (product.price < 3000) {
      score -= 30;
    }
  }

  // 5. Image & URL presence bonus
  if (product.img) score += 5;
  if (product.url && product.url.startsWith('http')) score += 5;

  return score;
}

/**
 * Multi-tier HTML fetcher
 */
async function fetchHtml(url, timeoutMs = 25000) {
  if (SCRAPER_API_KEY && !scraperApiDisabled) {
    try {
      const resp = await fetch(scraperUrl(url), { signal: AbortSignal.timeout(timeoutMs) });
      if (resp.status === 401 || resp.status === 403) {
        console.warn(`[ScraperAPI] HTTP ${resp.status}. Disabling — falling back to direct requests.`);
        scraperApiDisabled = true;
      } else if (resp.ok) {
        return await resp.text();
      }
    } catch (err) {
      console.warn(`[ScraperAPI] ${err.message} — trying direct.`);
    }
  }

  const resp = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: getBrowserHeaders(),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return await resp.text();
}

// ── AMAZON ───────────────────────────────────────────────────────────────────
async function scrapeAmazon(query) {
  const results = [];
  try {
    const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    $("[data-component-type='s-search-result']").slice(0, 20).each((_, el) => {
      try {
        if (results.length >= 8) return false;
        const item = $(el);
        if (item.find('span.s-label-popover-default').length > 0) return;

        const name = item.find('h2').text().replace(/\s+/g, ' ').trim() || null;
        const priceEl = item.find('span.a-price:not(.a-text-price) span.a-offscreen').first();
        const mrpEl = item.find('span.a-price.a-text-price span.a-offscreen').first();
        const linkEl = item.find('h2 a[href]').first();
        const imgEl = item.find('img.s-image').first();
        const ratEl = item.find('span.a-icon-alt').first();

        const price = cleanPrice(priceEl.text());
        const mrp = cleanPrice(mrpEl.text());
        const href = linkEl.attr('href');
        const link = href ? (href.startsWith('http') ? href : `https://www.amazon.in${href}`) : null;
        const img = imgEl.attr('src') || null;
        const ratMatch = ratEl.text().trim().match(/([\d.]+)/);
        const rating = ratMatch ? ratMatch[1] : null;

        if (name && price && price > 0 && isRelevant(name, query)) {
          results.push({
            platform: 'Amazon', name, price, mrp,
            discount: mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : null,
            rating, url: link, img,
          });
        }
      } catch (_) {}
    });
    console.log(`  [Amazon] ${results.length} live results`);
  } catch (e) {
    console.warn(`  [Amazon] Live fetch failed: ${e.message}`);
  }
  return results;
}

// ── FLIPKART ─────────────────────────────────────────────────────────────────
async function scrapeFlipkart(query) {
  const results = [];
  try {
    const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}&otracker=search`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const seen = new Set();

    $('a[href*="/p/"]').slice(0, 40).each((_, el) => {
      try {
        if (results.length >= 8) return false;
        const linkEl = $(el);
        const href = linkEl.attr('href') || '';
        if (!href || seen.has(href)) return;
        seen.add(href);

        const imgEl = linkEl.find('img').first();
        const name = imgEl.attr('alt') || linkEl.text().replace(/Add to Compare/gi, '').trim();
        if (!name || name.length < 5) return;
        if (!isRelevant(name, query)) return;

        let container = linkEl;
        for (let i = 0; i < 6; i++) {
          const parent = container.parent('div');
          if (!parent.length) break;
          container = parent;
          if (container.find('a[href*="/p/"]').length === 1) break;
        }

        const containerHtml = container.html() || '';
        const rawPriceMatches = containerHtml.match(/₹[\d,]+/g) || [];
        const containerText = container.text();
        const prices = rawPriceMatches
          .map(p => cleanPrice(p))
          .filter(n => {
            if (!n || n < 100 || n > 10000000) return false;
            const idx = containerText.indexOf(`₹${n.toLocaleString('en-IN')}`);
            if (idx > 4) {
              const before = containerText.slice(Math.max(0, idx - 10), idx).toLowerCase();
              if (before.includes('upto') || before.includes('up to')) return false;
            }
            return true;
          });

        if (!prices.length) return;
        const price = Math.min(...prices);
        const maxP = Math.max(...prices);
        const mrp = prices.length > 1 && maxP !== price && maxP < price * 3 ? maxP : null;
        const fullUrl = href.startsWith('http') ? href : `https://www.flipkart.com${href}`;
        const ratMatch = containerText.match(/\b([3-5]\.\d)\b/);

        results.push({
          platform: 'Flipkart', name, price, mrp,
          discount: mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : null,
          rating: ratMatch ? ratMatch[1] : null,
          url: fullUrl,
          img: imgEl.attr('src') || null,
        });
      } catch (_) {}
    });
    console.log(`  [Flipkart] ${results.length} live results`);
  } catch (e) {
    console.warn(`  [Flipkart] Live fetch failed: ${e.message}`);
  }
  return results;
}

// ── MYNTRA ────────────────────────────────────────────────────────────────────
async function scrapeMyntra(query) {
  const results = [];
  try {
    const url = `https://www.myntra.com/${encodeURIComponent(query)}?rawQuery=${encodeURIComponent(query)}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    $('li.product-base').slice(0, 12).each((_, el) => {
      try {
        if (results.length >= 8) return false;
        const item = $(el);
        const brand = item.find('h3.product-brand').first().text().trim();
        const desc = item.find('h4.product-product').first().text().trim();
        const name = `${brand} ${desc}`.trim();
        if (!name || !isRelevant(name, query)) return;

        let priceEl = item.find('span.product-discountedPrice').first();
        if (!priceEl.length) priceEl = item.find('div.product-price span').first();
        const mrpEl = item.find('span.product-strike').first();
        const linkEl = item.find('a[href]').first();
        let imgEl = item.find('img.img-responsive').first();
        if (!imgEl.length) imgEl = item.find('picture img').first();

        const price = cleanPrice(priceEl.text());
        const mrp = cleanPrice(mrpEl.text());
        const href = linkEl.attr('href') || '';
        const urlP = href.startsWith('http') ? href : `https://www.myntra.com/${href}`;
        const img = imgEl.attr('src') || null;

        if (price && price > 0) {
          results.push({
            platform: 'Myntra', name, price, mrp,
            discount: mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : null,
            rating: null, url: urlP, img,
          });
        }
      } catch (_) {}
    });
    console.log(`  [Myntra] ${results.length} live results`);
  } catch (e) {
    console.warn(`  [Myntra] Live fetch failed: ${e.message}`);
  }
  return results;
}

// ── MEESHO ────────────────────────────────────────────────────────────────────
async function scrapeMeesho(query) {
  const results = [];
  try {
    const url = `https://www.meesho.com/search?q=${encodeURIComponent(query)}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    $("div[class*='ProductCard'], div[class*='product-card']").slice(0, 12).each((_, el) => {
      try {
        if (results.length >= 8) return false;
        const item = $(el);
        const nameEl = item.find("p[class*='name'], span[class*='name'], h5").first();
        const priceEl = item.find("h5[class*='price'], span[class*='price'], p[class*='price']").first();
        const linkEl = item.find('a[href]').first();
        const imgEl = item.find('img').first();

        const name = nameEl.text().trim() || null;
        const price = cleanPrice(priceEl.text());
        if (!name || !price || price <= 0 || !isRelevant(name, query)) return;

        const href = linkEl.attr('href') || '';
        results.push({
          platform: 'Meesho', name, price,
          mrp: null, discount: null, rating: null,
          url: href.startsWith('/') ? `https://www.meesho.com${href}` : href,
          img: imgEl.attr('src') || null,
        });
      } catch (_) {}
    });
    console.log(`  [Meesho] ${results.length} live results`);
  } catch (e) {
    console.warn(`  [Meesho] Live fetch failed: ${e.message}`);
  }
  return results;
}

// ── CROMA ─────────────────────────────────────────────────────────────────────
async function scrapeCroma(query) {
  const results = [];
  try {
    const url = `https://www.croma.com/searchB?q=${encodeURIComponent(query)}%3Arelevance&text=${encodeURIComponent(query)}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    $("li.product-item, div[class*='product-item']").slice(0, 12).each((_, el) => {
      try {
        if (results.length >= 8) return false;
        const item = $(el);
        const nameEl = item.find("h3.product-title, a.product-title, [class*='title']").first();
        const priceEl = item.find("span.amount, [class*='price'] span, span[class*='discount-price']").first();
        const mrpEl = item.find("span.pdpScratchPrice, [class*='old-price'], s").first();
        const linkEl = item.find('a[href]').first();
        const imgEl = item.find('img').first();

        const name = nameEl.text().trim() || null;
        const price = cleanPrice(priceEl.text());
        if (!name || !price || price <= 0 || !isRelevant(name, query)) return;

        const mrp = cleanPrice(mrpEl.text());
        const href = linkEl.attr('href') || '';
        results.push({
          platform: 'Croma', name, price, mrp,
          discount: mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : null,
          rating: null,
          url: href.startsWith('/') ? `https://www.croma.com${href}` : href,
          img: imgEl.attr('src') || null,
        });
      } catch (_) {}
    });
    console.log(`  [Croma] ${results.length} live results`);
  } catch (e) {
    console.warn(`  [Croma] Live fetch failed: ${e.message}`);
  }
  return results;
}

// ── NYKAA ─────────────────────────────────────────────────────────────────────
async function scrapeNykaa(query) {
  const results = [];
  try {
    const url = `https://www.nykaa.com/search/result/?q=${encodeURIComponent(query)}&root=search`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    $("div[class*='product-list'] div[class*='product'], div.product-container").slice(0, 12).each((_, el) => {
      try {
        if (results.length >= 8) return false;
        const item = $(el);
        const nameEl = item.find("[class*='product-name'], [class*='productName'], h3").first();
        const priceEl = item.find("[class*='price-offer'], [class*='offer-price'], [class*='discounted']").first();
        const mrpEl = item.find("[class*='price-mrp'], [class*='mrp'], s").first();
        const linkEl = item.find('a[href]').first();
        const imgEl = item.find('img').first();

        const name = nameEl.text().trim() || null;
        const price = cleanPrice(priceEl.text());
        if (!name || !price || price <= 0 || !isRelevant(name, query)) return;

        const mrp = cleanPrice(mrpEl.text());
        const href = linkEl.attr('href') || '';
        results.push({
          platform: 'Nykaa', name, price, mrp,
          discount: mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : null,
          rating: null,
          url: href.startsWith('/') ? `https://www.nykaa.com${href}` : href,
          img: imgEl.attr('src') || null,
        });
      } catch (_) {}
    });
    console.log(`  [Nykaa] ${results.length} live results`);
  } catch (e) {
    console.warn(`  [Nykaa] Live fetch failed: ${e.message}`);
  }
  return results;
}

// ── SNAPDEAL ──────────────────────────────────────────────────────────────────
async function scrapeSnapdeal(query) {
  const results = [];
  try {
    const url = `https://www.snapdeal.com/search?keyword=${encodeURIComponent(query)}&santizedKeyword=${encodeURIComponent(query)}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    $('div.product-tuple-listing, div[class*="product-tuple"]').slice(0, 20).each((_, el) => {
      try {
        if (results.length >= 8) return false;
        const item = $(el);
        const nameEl = item.find('p.product-title, [class*="product-title"]').first();
        const priceEl = item.find('span.lfloat.product-price, [class*="product-price"]').first();
        const mrpEl = item.find('span.product-desc-price, s').first();
        const linkEl = item.find('a[href]').first();
        let imgEl = item.find('img[src*="http"]').first();
        if (!imgEl.length) imgEl = item.find('img').first();

        const name = nameEl.text().trim() || null;
        const price = cleanPrice(priceEl.text());
        if (!name || !price || price <= 0 || !isRelevant(name, query)) return;

        const mrp = cleanPrice(mrpEl.text());
        const href = linkEl.attr('href') || '';
        results.push({
          platform: 'Snapdeal', name, price, mrp,
          discount: mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : null,
          rating: null,
          url: href.startsWith('http') ? href : `https://www.snapdeal.com${href}`,
          img: imgEl.attr('src') || null,
        });
      } catch (_) {}
    });
    console.log(`  [Snapdeal] ${results.length} live results`);
  } catch (e) {
    console.warn(`  [Snapdeal] Live fetch failed: ${e.message}`);
  }
  return results;
}

// ── PLATFORM MAP ──────────────────────────────────────────────────────────────
const SCRAPERS = {
  amazon: scrapeAmazon,
  flipkart: scrapeFlipkart,
  myntra: scrapeMyntra,
  meesho: scrapeMeesho,
  croma: scrapeCroma,
  nykaa: scrapeNykaa,
  snapdeal: scrapeSnapdeal,
};
const ALL_PLATFORMS = Object.keys(SCRAPERS);

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  const query = (req.query.q || '').trim();
  const rawPlatforms = (req.query.platforms || '')
    .split(',')
    .map(p => p.trim())
    .filter(p => SCRAPERS[p]);
  const platforms = rawPlatforms.length ? rawPlatforms : ALL_PLATFORMS;

  if (!query) return res.status(400).json({ error: 'query required' });

  const ck = ckey(query, [...platforms].sort().join(','));
  const cached = cacheGet(ck);
  if (cached) {
    console.log(`[CACHE HIT] ${query}`);
    return res.json(cached);
  }

  console.log(`\n[Search] '${query}' → ${platforms.join(', ')}`);
  const t0 = Date.now();
  const results = {};
  platforms.forEach(p => { results[p] = []; });

  const settled = await Promise.allSettled(
    platforms.map(p =>
      Promise.race([
        SCRAPERS[p](query),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 25000)),
      ])
    )
  );

  settled.forEach((outcome, idx) => {
    const plat = platforms[idx];
    if (outcome.status === 'fulfilled') {
      results[plat] = outcome.value || [];
    } else {
      results[plat] = [];
    }
  });

  const allProducts = Object.values(results).flat();

  // Filter out any items with strong negative relevance score
  const relevantProducts = allProducts.filter(p => calculateRelevanceScore(p, query) > -30);

  // Sort by RELEVANCE by default so real matching products appear on top!
  relevantProducts.sort((a, b) => calculateRelevanceScore(b, query) - calculateRelevanceScore(a, query));

  const elapsed = parseFloat(((Date.now() - t0) / 1000).toFixed(2));
  console.log(`[Done] ${relevantProducts.length} real products in ${elapsed}s`);

  const payload = {
    query,
    total: relevantProducts.length,
    elapsed,
    by_platform: results,
    all: relevantProducts
  };

  if (relevantProducts.length > 0) cacheSet(ck, payload);
  res.json(payload);
});

app.get('/api/compare', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) return res.status(400).json({ error: 'query required' });

  const ck = ckey('cmp', query);
  const cached = cacheGet(ck);
  if (cached) return res.json(cached);

  const entries = Object.entries(SCRAPERS);
  const settled = await Promise.allSettled(
    entries.map(([, fn]) =>
      Promise.race([
        fn(query),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 25000)),
      ])
    )
  );

  const results = [];
  settled.forEach((outcome) => {
    if (outcome.status === 'fulfilled' && outcome.value && outcome.value.length > 0) {
      results.push(outcome.value[0]);
    }
  });

  // Sort real comparison listings by price ascending
  results.sort((a, b) => (a.price || 99999) - (b.price || 99999));
  const payload = { query, results, best: results[0] || null };
  if (results.length > 0) cacheSet(ck, payload);
  res.json(payload);
});

app.get('/api/health', (_, res) => {
  res.json({
    status: 'ok',
    version: '7.2 (Real Products Only)',
    scraperApiActive: Boolean(SCRAPER_API_KEY && !scraperApiDisabled),
    platforms: ALL_PLATFORMS,
  });
});

app.get('/api/ping', (_, res) => res.json({ pong: true, ts: Date.now() / 1000 }));
app.get('/api/platforms', (_, res) => res.json({ platforms: ALL_PLATFORMS }));

const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n◈ PriceRadar v7.2 (Real Products Only) — port ${PORT}`);
  console.log(`  Mode: ${SCRAPER_API_KEY && !scraperApiDisabled ? 'ScraperAPI' : 'Direct Live Scraping'}`);
  console.log();
});
