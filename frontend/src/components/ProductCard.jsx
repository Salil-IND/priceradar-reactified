import React, { useState } from 'react';

export default function ProductCard({ product, onCompare }) {
  const [imgError, setImgError] = useState(false);

  const discount = product.discount ? (
    <span className="product-discount">−{product.discount}%</span>
  ) : null;

  const mrp = product.mrp && product.mrp > product.price ? (
    <span className="product-mrp">₹{product.mrp.toLocaleString('en-IN')}</span>
  ) : null;

  const rating = product.rating ? (
    <span className="product-rating">★ {product.rating}</span>
  ) : null;

  return (
    <div className="product-card">
      <div className="product-card-img">
        {product.img && !imgError ? (
          <img
            src={product.img}
            alt={product.name}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="product-img-fallback">📦</div>
        )}
        <span className={`platform-badge platform-badge--${product.platform?.toLowerCase()}`}>
          {product.platform}
        </span>
        {discount}
      </div>

      <div className="product-card-body">
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-pricing">
          <span className="product-card-price">₹{(product.price || 0).toLocaleString('en-IN')}</span>
          {mrp}
          {rating}
        </div>
        <div className="product-card-actions">
          <a
            className="btn btn--outline btn--sm"
            href={product.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
          >
            View ↗
          </a>
          <button
            className="btn btn--primary btn--sm"
            onClick={() => onCompare(product)}
          >
            Compare
          </button>
        </div>
      </div>
    </div>
  );
}
