import React from 'react';

export default function Toast({ toast }) {
  if (!toast || !toast.show) return null;

  return (
    <div className="toast show">
      <span>{toast.icon || '✓'}</span>
      <span>{toast.msg}</span>
    </div>
  );
}
