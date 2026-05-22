import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { TradeRecord } from '../utils/dataUtils';
import { format } from 'date-fns';

interface DashboardChartsProps {
  data: TradeRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color, fontWeight: 600 }}>
            {entry.name}: {entry.value > 0 ? '+' : ''}{Number(entry.value).toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardCharts: React.FC<DashboardChartsProps> = ({ data }) => {
  // Prepare data for Cumulative RR chart
  const cumulativeData = useMemo(() => {
    // Sort by date (assuming original order or date parsing)
    // For now we rely on the original array order which usually is chronological,
    // or we sort by the parsedDate if available.
    const sorted = [...data].sort((a, b) => {
        if(a.parsedDate && b.parsedDate) return a.parsedDate.getTime() - b.parsedDate.getTime();
        return 0;
    });

    let currentRR = 0;
    return sorted.map((trade, index) => {
      currentRR += trade.RR;
      return {
        name: trade.parsedDate ? format(trade.parsedDate, 'MMM dd, yyyy') : `Trade ${index + 1}`,
        rr: Number(trade.RR.toFixed(2)),
        cumulative: Number(currentRR.toFixed(2))
      };
    });
  }, [data]);

  // Prepare data for Session Win Rate
  const sessionData = useMemo(() => {
    const sessions = data.reduce((acc, trade) => {
      const s = trade.Session || 'Other';
      if (!acc[s]) acc[s] = { session: s, wins: 0, losses: 0, total: 0 };
      acc[s].total += 1;
      if (trade['W/L'] === 'Yes') acc[s].wins += 1;
      else acc[s].losses += 1;
      return acc;
    }, {} as Record<string, { session: string, wins: number, losses: number, total: number }>);

    return Object.values(sessions).map(s => ({
      ...s,
      winRate: Number(((s.wins / s.total) * 100).toFixed(1))
    })).sort((a, b) => b.total - a.total); // Sort by most trades
  }, [data]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
      
      {/* Cumulative Performance Chart */}
      <div className="glass-panel" style={{ padding: '1.5rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Cumulative Performance (RR)</h3>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="var(--text-muted)" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis 
                stroke="var(--text-muted)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="cumulative" 
                name="Total RR"
                stroke="var(--accent-primary)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCumulative)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Session Win Rate Chart */}
      <div className="glass-panel" style={{ padding: '1.5rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Win Rate by Session (%)</h3>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sessionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis 
                dataKey="session" 
                stroke="var(--text-muted)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="var(--text-muted)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
              <Bar dataKey="winRate" name="Win Rate %" radius={[4, 4, 0, 0]}>
                {sessionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.winRate > 50 ? 'var(--success)' : 'var(--accent-secondary)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default DashboardCharts;
