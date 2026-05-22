import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TradeRecord } from '../../utils/dataUtils';

interface SessionsTabProps {
  data: TradeRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.fill, fontWeight: 600 }}>
            {entry.name}: {entry.value > 0 ? '+' : ''}{Number(entry.value).toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SessionsTab: React.FC<SessionsTabProps> = ({ data }) => {
  const sessionData = useMemo(() => {
    const sessions = data.reduce((acc, trade) => {
      const s = trade.Session || 'Other';
      if (!acc[s]) acc[s] = { session: s, netRR: 0, wins: 0, total: 0 };
      acc[s].total += 1;
      acc[s].netRR += trade.RR;
      if (trade['W/L'] === 'Yes') acc[s].wins += 1;
      return acc;
    }, {} as Record<string, { session: string, netRR: number, wins: number, total: number }>);

    return Object.values(sessions)
      .map(s => ({
        ...s,
        netRR: Number(s.netRR.toFixed(2)),
        winRate: Number(((s.wins / s.total) * 100).toFixed(1))
      }))
      .sort((a, b) => b.netRR - a.netRR);
  }, [data]);

  const bestSession = sessionData[0];

  return (
    <div className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          Zaman Dilimi (Killzone) Verimliliği
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '1.5rem' }}>
          {/* Main Chart */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="session" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                <Bar dataKey="netRR" name="Net RR" radius={[6, 6, 0, 0]}>
                  {sessionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.netRR > 0 ? 'var(--success)' : 'var(--danger)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Session Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {sessionData.map(session => (
              <div key={session.session} style={{ 
                background: session === bestSession ? 'var(--success-bg)' : 'rgba(255,255,255,0.02)', 
                border: `1px solid ${session === bestSession ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-color)'}`, 
                borderRadius: '12px', 
                padding: '1.5rem' 
              }}>
                <h3 style={{ 
                  fontWeight: 700, 
                  color: session === bestSession ? 'var(--success)' : 'var(--text-primary)', 
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {session.session}
                  {session === bestSession && <span style={{ fontSize: '1rem' }}>🏆</span>}
                </h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Net RR:</span>
                  <span style={{ fontWeight: 800, color: session.netRR >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {session.netRR > 0 ? '+' : ''}{session.netRR}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Win Rate:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>%{session.winRate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionsTab;
