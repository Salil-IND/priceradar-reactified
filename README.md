# 🛒 SmartPrice AI — PriceRadar

**Track prices. Predict drops. Always buy at the right time.**

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Railway](https://img.shields.io/badge/Backend-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

### 🌐 [https://priceradar-blue.vercel.app](https://priceradar-blue.vercel.app)

SmartPrice AI is a modern full-stack price comparison web application that tracks product prices across top Indian e-commerce stores (Amazon, Flipkart, and more) — analyzes yearly price trends, compares discounts, predicts future price drops using AI, and redirects you straight to the best deal.

[🌐 Live Demo](https://priceradar-blue.vercel.app) · [Features](#-features) · [Tech Stack](#-tech-stack) · [Project Structure](#-project-structure) · [Quick Start](#-quick-start) · [Architecture](#-how-it-works) · [API Reference](#-api-reference) · [Deployment](#-deployment)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **100% Authentic Real Products** | Only real, live scraped products from verified stores are displayed — zero fabricated or synthetic mock listings. |
| 🧠 **Intelligent Relevance Scoring** | Exact product matches rank #1 by default. Anti-accessory heuristics ensure primary devices appear above phone cases, cables, or selfie sticks. |
| 🔍 **Multi-Platform Search** | Live scraping from Amazon, Flipkart, Myntra, Meesho, Croma, Nykaa, and Snapdeal. |
| 📈 **Interactive Price Trend Chart** | Visualizes price trends with responsive Chart.js line graphs across 1M, 3M, and 6M ranges. |
| 🤖 **AI Price Drop Prediction** | Forecasts short-term price variations, upcoming sale events (Diwali, Big Billion Days), and smart buy/wait advice. |
| 💰 **Cross-Store Price Comparison** | Side-by-side price and discount breakdown with visual price difference indicators. |
| 🏆 **Best Deal Recommendation** | Automatically highlights the lowest-priced genuine listing. |
| 🔗 **Direct Store Redirect** | One-click button redirects directly to the lowest-price product listing page. |
| 🔔 **Persistent Price Alerts** | Set target price alerts saved in `localStorage` across user sessions. |

---

## 🛠 Tech Stack

### Frontend
| Technology | Role |
|---|---|
| **React 19** | Component-driven UI framework |
| **Vite 6** | Ultra-fast build tool and local dev server with API proxy |
| **Chart.js 4** | Interactive canvas-based price history visualization |
| **CSS Custom Properties** | Bespoke retro-editorial design tokens, typography, and responsive layouts |
| **Fetch API & localStorage** | Real-time REST client and persistent alert storage |

### Backend
| Technology | Role |
|---|---|
| **Node.js (ES Modules)** | High-throughput asynchronous non-blocking runtime |
| **Express.js (`server.js`)** | REST API routing, CORS middleware, and request orchestration |
| **Cheerio** | Fast HTML parsing and CSS selector extraction for web scrapers |
| **Direct Browser Scraping** | Uses desktop browser headers and rotating User-Agents (zero mandatory proxy key) |
| **ScraperAPI (Optional)** | Optional proxy fallback support via `.env` for large-scale anti-bot bypass |
| **In-Memory Cache** | 90-second query caching with automated LRU-style eviction |

---

## 📁 Project Structure

```
priceradar/
│
├── backend/
│   ├── server.js              # Express REST API — parallel scrapers & relevance scoring
│   ├── package.json           # Node dependencies (express, cheerio, cors, dotenv)
│   ├── Procfile               # Railway web start command
│   ├── railway.json           # Railway deployment configuration
│   └── .env.example           # Optional environment variables template
│
└── frontend/
    ├── index.html             # Vite HTML entry point
    ├── vite.config.js         # Vite configuration with React plugin and /api dev proxy
    ├── package.json           # React & Vite dependencies
    └── src/
        ├── main.jsx           # React DOM root entry
        ├── App.jsx            # State management, alert persistence & layout
        ├── components/
        │   ├── Header.jsx             # Top bar navigation & alert modal trigger
        │   ├── HeroSearch.jsx         # Search box, platform pills, scanning progress
        │   ├── SearchResults.jsx      # Relevance sorting, filter bar, product grid
        │   ├── ProductCard.jsx        # Product cards with badges, prices & buy links
        │   ├── CompareSection.jsx     # Side-by-side price comparison & best deal card
        │   ├── PriceHistoryChart.jsx  # Chart.js price trend visualization
        │   ├── AlertsSection.jsx      # Saved price alerts list
        │   ├── AlertModal.jsx         # Modal to create target price alerts
        │   ├── Toast.jsx              # Status toast notifications
        │   └── Footer.jsx             # Site footer and disclaimer
        ├── services/
        │   └── api.js                 # API service layer with proxy support
        └── styles/
            ├── variables.css          # Design tokens (colors, fonts, radii, shadows)
            ├── reset.css              # Cross-browser CSS baseline
            ├── layout.css             # Grid and flexbox structure
            ├── components.css         # Buttons, cards, pills, modal styles
            └── dashboard.css          # Chart & comparison view styles
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **npm**: v9+

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```
> The API server runs at **http://localhost:5000**

*(Optional)* If you have a free [ScraperAPI](https://www.scraperapi.com) key (5,000 free requests/mo), copy `.env.example` to `.env`:
```bash
cp .env.example .env
# Edit .env and set SCRAPER_API_KEY=your_key
```

### 2. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
> Vite dev server opens at **http://localhost:3000**  
> *(The Vite dev server automatically proxies `/api` calls to `http://localhost:5000` to prevent any CORS issues during development.)*

---

## ⚙️ How It Works

```
User searches for a product (e.g., "iPhone 15")
         │
         ▼
    React 19 Frontend (Vite)
         │
         ├──► GET /api/search?q=iPhone+15 (Proxied via Vite dev server)
         │           │
         │           ▼
         │    Express.js Backend (server.js)
         │           │
         │           ├─► Check 90s in-memory cache
         │           │
         │           └─► Promise.allSettled() across vendors:
         │               ┌───────────────┬───────────────┬───────────────┐
         │               ▼               ▼               ▼               ▼
         │           Amazon          Flipkart        Snapdeal         Croma...
         │               └───────────────┼───────────────┴───────────────┘
         │                               │
         │                 Cheerio DOM Parsing & Cleaning
         │                               │
         │                 Relevance Scoring Engine:
         │                 - Exact query phrase matches (+50 pts)
         │                 - Accessory demotion (-60 pts for cases/cables)
         │                 - Realistic price boundary validation
         │                               │
         │                 Sorted by Best Match (Most Relevant)
         │                               │
         ◄───────────────────────────────┘
         │
         ▼
    SearchResults Component
    - Displays genuine live listings
    - Filters by price, discount, or store tab
    - One-click "Compare" triggers cross-platform comparison
```

---

## 📡 API Reference

All routes are served under `/api` and support standard CORS headers.

| Endpoint | Method | Description |
|---|---|---|
| `/api/search?q=<query>&platforms=<p1,p2>` | `GET` | Searches platforms in parallel, applies relevance scoring, and returns ranked real products |
| `/api/compare?q=<query>` | `GET` | Compares a product's price across all stores, returning the best deal |
| `/api/health` | `GET` | Returns backend health status and active platforms |
| `/api/platforms` | `GET` | Lists all supported e-commerce platforms |
| `/api/ping` | `GET` | Lightweight keep-alive ping for cloud containers |

#### Example Response — `GET /api/search?q=iphone`
```json
{
  "query": "iphone",
  "total": 16,
  "elapsed": 1.94,
  "by_platform": {
    "amazon": [...],
    "flipkart": [...]
  },
  "all": [
    {
      "platform": "Flipkart",
      "name": "Apple iPhone 15 (Blue, 128 GB)",
      "price": 67999,
      "mrp": 74900,
      "discount": 9,
      "rating": "4.6",
      "url": "https://www.flipkart.com/apple-iphone-15-blue-128-gb/p/itm387c20f1f5347...",
      "img": "https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/z/h/l/-original-imahqvadwhgxgx2n.jpeg?q=70"
    }
  ]
}
```

---

## ☁️ Deployment

### Backend → Railway
1. Create a new service on [Railway](https://railway.app) from this GitHub repository.
2. Set the root directory to `/backend` (or use the root `railway.json`).
3. Railway automatically detects `package.json` and runs `npm start` via `Procfile`.
4. *(Optional)* Add `SCRAPER_API_KEY` to environment variables in Railway settings.

### Frontend → Vercel
1. Create a new project on [Vercel](https://vercel.com) from this repository.
2. Set the root directory to `frontend`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. *(Optional)* Set `VITE_API_BASE=https://your-backend.up.railway.app/api` in Vercel environment variables.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

