import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, color = 'green', trend, trendLabel, subtitle }) {
  const isPositive = trend && trend.startsWith('+');

  return (
    <div className="stat-card">
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {trend ? (
          <div className={`stat-trend ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{trend}</span>
            {trendLabel && <span style={{ color: 'var(--neutral-500)', fontWeight: 500, marginLeft: 4 }}>{trendLabel}</span>}
          </div>
        ) : subtitle ? (
          <span style={{ fontSize: '0.78rem', color: 'var(--neutral-500)', fontWeight: 500 }}>{subtitle}</span>
        ) : null}
      </div>
      {Icon && (
        <div className={`stat-icon-wrapper stat-icon-${color}`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
}
