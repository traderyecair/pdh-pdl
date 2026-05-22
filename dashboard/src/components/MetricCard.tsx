import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  valueColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, valueColor }) => {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </h3>
        <div style={{ color: 'var(--accent-primary)', opacity: 0.8 }}>
          {icon}
        </div>
      </div>
      
      <div>
        <div style={{ 
          fontSize: '2rem', 
          fontWeight: 700, 
          color: valueColor || 'var(--text-primary)',
          letterSpacing: '-0.025em'
        }}>
          {value}
        </div>
        
        {trend && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginTop: '0.5rem',
            fontSize: '0.875rem'
          }}>
            <span style={{ 
              color: trend.value >= 0 ? 'var(--success)' : 'var(--danger)',
              fontWeight: 600
            }}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
            <span style={{ color: 'var(--text-muted)' }}>{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
