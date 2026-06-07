/**
 * Toast Notification Component
 * Displays temporary notification messages (success, error, info, warning)
 */

import { useEffect } from 'react';
import './Toast.css';

export default function Toast({ message, type = 'info', duration = 3000, onClose }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`toast toast--${type}`}>
      <div className="toast__icon">
        {type === 'success' && '✅'}
        {type === 'error' && '❌'}
        {type === 'warning' && '⚠️'}
        {type === 'info' && 'ℹ️'}
      </div>
      <p className="toast__message">{message}</p>
      <button
        className="toast__close"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}
