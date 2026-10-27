import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';

function calculateRelevanceScore(product, query) {
  if (!product || !product.name) return 0;
  const name = product.name.toLowerCase();
  const q = (query || '').toLowerCase().trim();
  const qTokens = q.split(/\s+/).filter(t => t.length > 1);
  let score = 0;

  // Exact phrase match
  if (name.includes(q)) {
    score += 50;
    if (name.startsWith(q) || name.startsWith('apple ' + q) || name.startsWith('samsung ' + q)) {
      score += 25;
    }
  }

  // Token overlap
  let matchingTokens = 0;
  for (const token of qTokens) {
    if (name.includes(token)) matchingTokens++;
  }
  score += Math.round((matchingTokens / Math.max(1, qTokens.length)) * 30);

  // Demote accessories when searching for main devices
  const isDeviceQuery = /\b(iphone|phone|galaxy|pixel|oneplus|laptop|macbook|ipad|tablet|tv|television|watch|camera)\b/i.test(q);
  const isAccessory = /\b(case|cover|glass|protector|screen|guard|cable|charger|adapter|cord|strap|skin|stand|holder|mount|tripod|selfie|pouch|sleeve|battery|housing|lens)\b/i.test(name);

  if (isDeviceQuery && isAccessory) {
    score -= 60;
  }

  // Price realism for electronics
  if (isDeviceQuery && product.price) {
    if (product.price >= 15000) {
      score += 20;
    } else if (product.price < 3000) {
      score -= 30;
    }
  }

  if (product.img) score += 5;
  if (product.url && product.url.startsWith('http')) score += 5;

  return score;
}

export default function SearchResults({
  query,
  allProducts,
  byPlatform,
  onCompare
}) {
  const [selectedTab, setSelectedTab] = useState('all');
  const [sortOption, setSortOption] = useState('relevance'); // Most relevant by default!
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minDiscount, setMinDiscount] = useState('0');
  const [appliedFilters, setAppliedFilters] = useState({ minPrice: 0, maxPrice: Infinity, minDiscount: 0 });
  const [visibleCount, setVisibleCount] = useState(12);

  // Only show tabs for platforms that have REAL live products
  const tabs = useMemo(() => {
    const list = [{ id: 'all', label: `All (${allProducts.length})` }];
    if (byPlatform) {
      Object.entries(byPlatform).forEach(([key, items]) => {
        if (items && items.length > 0) {
          list.push({
            id: key.toLowerCase(),
            label: `${key.charAt(0).toUpperCase() + key.slice(1)} (${items.length})`
          });
        }
      });
    }
    return list;
  }, [allProducts.length, byPlatform]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      minPrice: minPrice ? parseInt(minPrice, 10) : 0,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : Infinity,
      minDiscount: parseInt(minDiscount, 10) || 0
    });
    setVisibleCount(12);
  };

  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinDiscount('0');
    setAppliedFilters({ minPrice: 0, maxPrice: Infinity, minDiscount: 0 });
    setVisibleCount(12);
  };

  // Filter & Sort
  const processedProducts = useMemo(() => {
    let list = allProducts;
    if (selectedTab !== 'all') {
      list = list.filter(p => p.platform?.toLowerCase() === selectedTab);
    }

    list = list.filter(p => {
      const price = p.price || 0;
      const discount = p.discount || 0;
      return (
        price >= appliedFilters.minPrice &&
        price <= appliedFilters.maxPrice &&
        discount >= appliedFilters.minDiscount
      );
    });

    const sorted = [...list];
    if (sortOption === 'relevance') {
      sorted.sort((a, b) => calculateRelevanceScore(b, query) - calculateRelevanceScore(a, query));
    } else if (sortOption === 'price_asc') {
      sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortOption === 'price_desc') {
      sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortOption === 'discount') {
      sorted.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    } else if (sortOption === 'rating') {
      sorted.sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
    }

    return sorted;
  }, [allProducts, selectedTab, appliedFilters, sortOption, query]);

  const displayedProducts = processedProducts.slice(0, visibleCount);

  if (!allProducts.length) return null;

  return (
    <section className="results-section container" id="results-section" style={{ display: 'block' }}>
      <div className="results-header">
        <div>
          <h2 className="results-title">Results for "{query}"</h2>
          <span className="results-meta">
            {allProducts.length} real products found across verified stores
          </span>
        </div>
        <div className="results-controls">
          <div className="sort-group">
            <label htmlFor="sortSelect">Sort by</label>
            <select
              id="sortSelect"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="relevance">Best Match (Most Relevant)</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="discount">Best Discount</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            ⚙ Filter
          </button>
        </div>
      </div>

      {/* Filter bar (collapsible) */}
      {showFilters && (
        <div className="filter-bar" style={{ display: 'flex' }}>
          <div className="filter-group">
            <label htmlFor="filterMinPrice">Min price (₹)</label>
            <input
              type="number"
              id="filterMinPrice"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="filterMaxPrice">Max price (₹)</label>
            <input
              type="number"
              id="filterMaxPrice"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="filterDiscount">Min discount</label>
            <select
              id="filterDiscount"
              value={minDiscount}
              onChange={(e) => setMinDiscount(e.target.value)}
            >
              <option value="0">Any</option>
              <option value="10">10%+</option>
              <option value="20">20%+</option>
              <option value="30">30%+</option>
              <option value="50">50%+</option>
            </select>
          </div>
          <button type="button" className="btn btn--primary btn--sm" onClick={handleApplyFilters}>
            Apply
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={handleClearFilters}>
            Clear
          </button>
        </div>
      )}

      {/* Platform tabs */}
      <div className="platform-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`ptab ${selectedTab === tab.id ? 'ptab--active' : ''}`}
            onClick={() => {
              setSelectedTab(tab.id);
              setVisibleCount(12);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="product-grid">
        {displayedProducts.length > 0 ? (
          displayedProducts.map((p, idx) => (
            <ProductCard
              key={`${p.platform}-${p.name}-${idx}`}
              product={p}
              onCompare={onCompare}
            />
          ))
        ) : (
          <div className="no-results">No products found matching your search.</div>
        )}
      </div>

      {/* Load more */}
      {visibleCount < processedProducts.length && (
        <div className="load-more-wrap" style={{ display: 'flex' }}>
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => setVisibleCount(prev => prev + 12)}
          >
            Load more results ({processedProducts.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </section>
  );
}
