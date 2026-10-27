import React from 'react';

export default function AlertsSection({ alerts, onDeleteAlert }) {
  return (
    <section className="alerts-section container" id="alerts-section">
      <div className="section-heading">
        <h2>Your saved alerts</h2>
        <span className="section-count">
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="alerts-empty" style={{ display: 'flex' }}>
          <span>🔔</span>
          <p>No alerts set yet. Search a product and tap "Alert me on drop" to get notified.</p>
        </div>
      ) : (
        <ul className="alerts-list">
          {alerts.map((a) => (
            <li key={a.id} className="alert-item">
              <span className="alert-icon">🔔</span>
              <span className="alert-info">
                <span className="alert-product">{a.product}</span>
                <span className="alert-detail">
                  Alert when below ₹{Number(a.targetPrice).toLocaleString('en-IN')} · {a.email}
                </span>
              </span>
              <span className="alert-date">{a.createdAt}</span>
              <button
                type="button"
                className="btn-icon-delete"
                onClick={() => onDeleteAlert(a.id)}
                aria-label="Delete alert"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
