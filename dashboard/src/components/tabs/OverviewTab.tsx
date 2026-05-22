import React, { useMemo } from 'react';
import { Target, Calendar, Flame, Shield, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { formatNumber, TradeRecord } from '../../utils/dataUtils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OverviewTabProps {
  metrics: any;
  data: TradeRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem', fontSize: '0.875rem' }}>İşlem #{label}</p>
        <p style={{ color: payload[0].value >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 800, fontSize: '1.25rem' }}>
          {payload[0].value > 0 ? '+' : ''}{payload[0].value.toFixed(2)} RR
        </p>
      </div>
    );
  }
  return null;
};

const OverviewTab: React.FC<OverviewTabProps> = ({ metrics, data }) => {
  // Compute cumulative data for the mini chart
  const chartData = useMemo(() => {
    let cumulative = 0;
    return data.map((trade, i) => {
      cumulative += trade.RR;
      return { index: i + 1, cumulative: Number(cumulative.toFixed(2)) };
    });
  }, [data]);

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '0.2s', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Main Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--neutral-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-primary)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <Target size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Win Rate</div>
            <div className={metrics.winRate >= 50 ? 'glow-text-success' : 'glow-text-danger'} style={{ fontSize: '2.5rem', fontWeight: 800 }}>
              %{metrics.winRate.toFixed(1)}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: metrics.avgMonthlyRR >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: metrics.avgMonthlyRR >= 0 ? 'var(--success)' : 'var(--danger)', border: `1px solid ${metrics.avgMonthlyRR >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
            <Calendar size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Aylık Ort. Getiri</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: metrics.avgMonthlyRR >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {metrics.avgMonthlyRR > 0 ? '+' : ''}{formatNumber(metrics.avgMonthlyRR)}<span style={{fontSize: '1rem', marginLeft:'4px'}}>RR</span>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-secondary)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <Activity size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>İşlem Başına Beklenti</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {metrics.expectancy > 0 ? '+' : ''}{formatNumber(metrics.expectancy)}<span style={{fontSize: '1rem', marginLeft:'4px'}}>RR</span>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Grid: Streaks & Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Streaks Card */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Kazanç/Kayıp Serileri</h3>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Flame size={18} color="var(--success)" /> Max Kazanç Serisi
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{metrics.maxWinStreak}</span>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-main)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((metrics.maxWinStreak / 15) * 100, 100)}%`, background: 'var(--success)', borderRadius: '3px' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={18} color="var(--danger)" /> Max Kayıp Serisi
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{metrics.maxLoseStreak}</span>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-main)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((metrics.maxLoseStreak / 10) * 100, 100)}%`, background: 'var(--danger)', borderRadius: '3px' }} />
            </div>
          </div>

          <div style={{ marginTop: 'auto', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>İşlem Büyüklükleri</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ort. Kazanç</span>
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>+{formatNumber(metrics.avgWinRR)} RR</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ort. Kayıp</span>
              <span style={{ color: 'var(--danger)', fontWeight: 700 }}>-{formatNumber(metrics.avgLossRR)} RR</span>
            </div>
          </div>
        </div>

        {/* Growth Chart Card */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Kümülatif Büyüme (RR)</h3>
            <div className="badge badge-neutral">Tüm Zamanlar</div>
          </div>
          
          <div style={{ flex: 1, minHeight: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="index" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                <Area 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="var(--accent-primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCumulative)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

export default OverviewTab;
