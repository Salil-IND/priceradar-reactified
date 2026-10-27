import React, { useState, useEffect } from 'react';

export default function AlertModal({ isOpen, onClose, defaultProduct, onSaveAlert }) {
  const [email, setEmail] = useState('');
  const [product, setProduct] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (defaultProduct) {
        setProduct(defaultProduct);
      }
      setIsConfirmed(false);
      setError('');
    }
  }, [isOpen, defaultProduct]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Enter a valid email.');
      return;
    }
    if (!product.trim()) {
      setError('Enter a product name.');
      return;
    }
    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      setError('Enter a valid target price.');
      return;
    }

    setError('');
    onSaveAlert({
      id: Date.now(),
      email: email.trim(),
      product: product.trim(),
      targetPrice: numPrice,
      createdAt: new Date().toLocaleDateString('en-IN')
    });
    setIsConfirmed(true);
  };

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>

        {isConfirmed ? (
          <div className="alert-set-confirm">
            <div className="check">✅</div>
            <h3>Alert saved!</h3>
            <p>
              We'll notify <strong>{email}</strong> when <strong>{product}</strong> drops below <strong>₹{Number(price).toLocaleString('en-IN')}</strong>.
            </p>
            <button className="btn btn--primary" style={{ width: '100%', marginTop: '16px' }} onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="modal-icon">🔔</div>
            <h3>Set a Price Alert</h3>
            <p>We'll email you the moment the price drops below your target on any platform.</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="alertEmail">Email address</label>
                <input
                  type="email"
                  id="alertEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="alertProductName">Product</label>
                <input
                  type="text"
                  id="alertProductName"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. Samsung Galaxy S24"
                />
              </div>

              <div className="form-group">
                <label htmlFor="alertPrice">Target price (₹)</label>
                <input
                  type="number"
                  id="alertPrice"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 58000"
                />
              </div>

              {error && <div className="alert-error" style={{ display: 'block' }}>{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Set Alert
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
