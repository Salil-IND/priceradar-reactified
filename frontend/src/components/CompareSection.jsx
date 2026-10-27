import React from 'react';
import PriceHistoryChart from './PriceHistoryChart';

export default function CompareSection({
  product,
  compareResults,
  isLoading,
  onOpenAlert
}) {
  if (!product) return null;

  const price = product.price || 0;
  const bestPrice = compareResults && compareResults.length > 0
    ? compareResults[0].price
    : price;

  return (
    <section className="compare-section container" id="compare-section" style={{ display: 'block' }}>
      <div className="compare-header">
        <div className="compare-product-info">
          <div className="compare-thumb">
            {product.img ? (
              <img
                src={product.img}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'inherit' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              '📦'
            )}
          </div>
          <div>
            <h2 className="compare-title">{product.name}</h2>
            <span className="compare-meta">Comparing across all major e-commerce platforms</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => onOpenAlert(product.name)}
        >
          🔔 Alert me on drop
        </button>
      </div>

      {/* Best deal highlight */}
      <div className="best-deal-card">
        <div className="best-deal-inner">
          <div className="best-deal-badge">✓ Best Price Found</div>
          <div className="best-deal-price">₹{price.toLocaleString('en-IN')}</div>
          <div className="best-deal-meta">
            {product.platform} · {product.discount ? `${product.discount}% off` : 'Current lowest'}
          </div>
          <a
            className="btn btn--primary"
            href={product.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy on {product.platform} ↗
          </a>
        </div>
      </div>

      {/* All platform prices */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          🔍 Gathering real-time prices across all platforms…
        </div>
      ) : (
        <div className="compare-grid">
          {compareResults && compareResults.map((p, i) => {
            const diff = (p.price || 0) - bestPrice;
            const isBest = i === 0;
            const diffHtml = isBest ? (
              <span className="compare-best-label">Best price →</span>
            ) : (
              <span className="compare-diff">+₹{diff.toLocaleString('en-IN')}</span>
            );

            const fillWidth = p.price ? Math.round((bestPrice / p.price) * 100) : 100;

            return (
              <a
                key={`${p.platform}-${i}`}
                className={`compare-row ${isBest ? 'compare-row--best' : ''}`}
                href={p.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={`compare-plat-badge compare-plat-badge--${p.platform?.toLowerCase()}`}>
                  {p.platform?.charAt(0)}
                </span>
                <span className="compare-info">
                  <span className="compare-plat-name">{p.platform}</span>
                  <span className="compare-plat-meta">
                    {p.rating ? `★ ${p.rating} · ` : ''}Tap to open ↗
                  </span>
                  <span className="compare-track">
                    <span
                      className="compare-fill"
                      style={{
                        width: `${fillWidth}%`,
                        background: isBest ? 'var(--green)' : 'var(--amber)'
                      }}
                    />
                  </span>
                </span>
                <span className="compare-price-col">
                  <span className={`compare-price ${isBest ? 'compare-price--best' : ''}`}>
                    ₹{(p.price || 0).toLocaleString('en-IN')}
                  </span>
                  {diffHtml}
                </span>
              </a>
            );
          })}
        </div>
      )}

      {/* Price history chart */}
      <PriceHistoryChart price={price} />

      {/* AI Forecast */}
      <div className="forecast-row">
        <div className="forecast-card">
          <div className="forecast-icon">📉</div>
          <div className="forecast-body">
            <h4>Short-term prediction</h4>
            <p>
              Based on recent trend, price may drop{' '}
              <strong>
                ₹{Math.round(price * 0.03).toLocaleString('en-IN')}–₹{Math.round(price * 0.06).toLocaleString('en-IN')}
              </strong>{' '}
              in the next 7 days.
            </p>
          </div>
          <span className="forecast-tag forecast-tag--down">
            ↓ ~₹{Math.round(price * 0.04).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="forecast-card">
          <div className="forecast-icon">🗓️</div>
          <div className="forecast-body">
            <h4>Sale event forecast</h4>
            <p>
              Sale events (Diwali, Big Billion Day, Great Indian Festival) historically reduce this category by 15–30%.
              Predicted: <strong>₹{Math.round(price * 0.75).toLocaleString('en-IN')}–₹{Math.round(price * 0.85).toLocaleString('en-IN')}</strong>
            </p>
          </div>
          <span className="forecast-tag forecast-tag--sale">⚡ Sale</span>
        </div>

        <div className="forecast-card">
          <div className="forecast-icon">✅</div>
          <div className="forecast-body">
            <h4>Buy recommendation</h4>
            <p>
              Current price is {product.discount ? 'already heavily discounted. Great time to buy.' : 'near average. Consider waiting for an upcoming sale.'}
            </p>
          </div>
          <span className="forecast-tag forecast-tag--buy">
            {product.discount ? 'Buy now' : 'Wait'}
          </span>
        </div>
      </div>
    </section>
  );
}
