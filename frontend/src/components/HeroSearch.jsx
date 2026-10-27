import React, { useEffect, useState } from 'react';

const ALL_PLATFORMS = ['amazon', 'flipkart', 'myntra', 'meesho', 'croma', 'nykaa', 'snapdeal'];

export default function HeroSearch({ onSearch, isSearching }) {
  const [query, setQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(ALL_PLATFORMS);
  const [scanStep, setScanStep] = useState(0);

  const togglePlatform = (p) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  useEffect(() => {
    let timer;
    if (isSearching) {
      setScanStep(0);
      const activeCount = selectedPlatforms.length || ALL_PLATFORMS.length;
      let current = 0;
      timer = setInterval(() => {
        current++;
        if (current <= activeCount) {
          setScanStep(current);
        }
      }, 400);
    } else {
      setScanStep(0);
    }
    return () => clearInterval(timer);
  }, [isSearching, selectedPlatforms.length]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim(), selectedPlatforms.length ? selectedPlatforms : ALL_PLATFORMS);
  };

  const platformsToScan = selectedPlatforms.length ? selectedPlatforms : ALL_PLATFORMS;
  const progressPercent = Math.min(100, Math.round(((scanStep + 1) / platformsToScan.length) * 100));

  return (
    <section className="hero" id="search-section">
      <div className="container">
        <div className="hero-eyebrow">Real products · Live prices · All platforms</div>
        <h1 className="hero-title">
          Stop overpaying.<br />
          <em>Start tracking.</em>
        </h1>
        <p className="hero-subtitle">
          Search any product and instantly compare live prices from Amazon, Flipkart, Myntra, Meesho, Croma &amp; more — all in one place.
        </p>

        <form className="search-box" onSubmit={handleSubmit}>
          <div className="search-icon">⌕</div>
          <input
            type="text"
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any product — iPhone 15, boAt headphones, Nike shoes, Samsung TV…"
            autoComplete="off"
          />
          <button type="submit" className="btn btn--primary" disabled={isSearching}>
            {isSearching ? 'Searching…' : 'Search →'}
          </button>
        </form>

        {/* Platform filter pills */}
        <div className="platform-pills">
          {ALL_PLATFORMS.map((plat) => {
            const isActive = selectedPlatforms.includes(plat);
            return (
              <button
                type="button"
                key={plat}
                className={`pill ${isActive ? 'pill--active' : ''}`}
                onClick={() => togglePlatform(plat)}
              >
                {plat.charAt(0).toUpperCase() + plat.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Search progress bar */}
        {isSearching && (
          <div className="search-progress" style={{ display: 'block' }}>
            <div className="progress-bar-wrap">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%`, transition: 'width 0.3s ease' }}
              />
            </div>
            <div className="progress-labels">
              {platformsToScan.map((p, idx) => {
                let statusClass = '';
                if (idx < scanStep) statusClass = 'done';
                else if (idx === scanStep) statusClass = 'scanning';

                return (
                  <span key={p} className={`progress-step ${statusClass}`}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
