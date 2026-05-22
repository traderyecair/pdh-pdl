import React, { useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TradeRecord, getMonthlyData } from '../../utils/dataUtils';

interface MonthlyTabProps {
  data: TradeRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>{label}</p>
        {payload.map((entry: any, index: number) => {
          let valueStr = entry.value;
          if (entry.dataKey === 'rrData') valueStr = `${entry.value > 0 ? '+' : ''}${entry.value} RR`;
          if (entry.dataKey === 'countData') valueStr = `${entry.value} İşlem`;
          
          return (
            <p key={`item-${index}`} style={{ color: entry.color || entry.fill, fontWeight: 600, marginTop: '0.25rem' }}>
              {entry.name}: {valueStr}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

const MonthlyTab: React.FC<MonthlyTabProps> = ({ data }) => {
  const monthlyDataRaw = useMemo(() => getMonthlyData(data), [data]);
  
  // Format for Recharts
  const chartData = useMemo(() => {
    return monthlyDataRaw.labels.map((label, i) => ({
      name: label,
      rrData: monthlyDataRaw.rrData[i],
      countData: monthlyDataRaw.countData[i],
      fullKey: monthlyDataRaw.fullKeys[i]
    }));
  }, [monthlyDataRaw]);

  return (
    <div className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          Aydan Aya Kar/Zarar ve İşlem Sıklığı
        </h2>
        
        {/* Chart */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', height: '400px', marginBottom: '2rem', overflowX: 'auto' }}>
          <div style={{ minWidth: '800px', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--accent-primary)" tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                
                <Bar yAxisId="left" dataKey="rrData" name="Net Kar (RR)" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.rrData >= 0 ? 'var(--success)' : 'var(--danger)'} />
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="countData" name="İşlem Sayısı" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-primary)' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Aylık Detaylı Veri Dökümü</h3>
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
              <tr>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Yıl - Ay</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'center' }}>Toplam İşlem</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'right' }}>Net Kar (RR)</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'center' }}>Durum</th>
              </tr>
            </thead>
            <tbody>
              {chartData.slice().reverse().map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{row.fullKey}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>{row.countData}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: row.rrData > 0 ? 'var(--success)' : row.rrData < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                    {row.rrData > 0 ? '+' : ''}{row.rrData.toFixed(2)} RR
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span className={`badge ${row.rrData > 0 ? 'badge-success' : row.rrData < 0 ? 'badge-danger' : 'badge-neutral'}`}>
                      {row.rrData > 0 ? 'Kar' : row.rrData < 0 ? 'Zarar' : 'Nötr'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTab;
