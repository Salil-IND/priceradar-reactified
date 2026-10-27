import React from 'react';

export default function Header({ onOpenAlert }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="#" className="logo">
          <span className="logo-mark">◈</span>
          <span className="logo-text">PriceRadar</span>
        </a>
        <nav className="header-nav">
          <a href="#search-section">Search</a>
          <a href="#results-section">Results</a>
          <a href="#compare-section">Compare</a>
          <a href="#alerts-section">Alerts</a>
        </nav>
        <div className="header-actions">
          <span className="live-indicator">
            <span className="live-dot"></span>
            <span>Live</span>
          </span>
          <button className="btn btn--outline btn--sm" onClick={() => onOpenAlert()}>
            🔔 Alert me
          </button>
        </div>
      </div>
    </header>
  );
}
