/* api.js — Service for fetching real live prices */

function getApiBase() {
  // Read backend URL strictly from the environment variable (VITE_BACKEND_URL)
  const envUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const clean = envUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  // Fallback to relative /api if no environment variable is provided
  return '/api';
}

const API_BASE = getApiBase();

// Keep backend awake (e.g. Render spin-down prevention) — ping on load + every 9 mins
if (typeof window !== 'undefined') {
  const ping = () => fetch(`${API_BASE}/ping`).catch(() => {});
  ping();
  setInterval(ping, 9 * 60 * 1000);
}

export const API = {
  async _get(url, ms = 25000) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms);
    try {
      const r = await fetch(url, { signal: c.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r;
    } catch (e) {
      clearTimeout(t);
      throw e;
    }
  },

  async search(query, platforms) {
    const plats = (platforms || []).join(",");
    try {
      const r = await this._get(`${API_BASE}/search?q=${encodeURIComponent(query)}&platforms=${plats}`);
      const data = await r.json();
      return {
        all: data.all || [],
        by_platform: data.by_platform || {},
        query: data.query || query,
        total: data.total || (data.all ? data.all.length : 0),
        elapsed: data.elapsed || 0
      };
    } catch (e) {
      console.warn("Search API network error:", e.message);
      return { all: [], by_platform: {}, query, total: 0, elapsed: 0 };
    }
  },

  async compare(query) {
    try {
      const r = await this._get(`${API_BASE}/compare?q=${encodeURIComponent(query)}`);
      return await r.json();
    } catch (e) {
      console.warn("Compare API network error:", e.message);
      return { query, results: [], best: null };
    }
  },

  async health() {
    try {
      await this._get(`${API_BASE}/health`, 5000);
      return true;
    } catch {
      return false;
    }
  },
};
