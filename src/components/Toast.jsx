import React from 'react';
import { CheckCircle, Info, AlertTriangle } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  return (
    <div className="toast-notification" onClick={onClose}>
      {type === 'success' && <CheckCircle size={18} style={{ color: '#4ade80' }} />}
      {type === 'info' && <Info size={18} style={{ color: '#38bdf8' }} />}
      {type === 'warning' && <AlertTriangle size={18} style={{ color: '#fbbf24' }} />}
      <span>{message}</span>
    </div>
  );
}
