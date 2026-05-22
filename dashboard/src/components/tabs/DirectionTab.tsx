import React, { useMemo } from 'react';
import { Compass, TrendingUp, TrendingDown, Award, Activity, Percent } from 'lucide-react';
import { TradeRecord, formatNumber } from '../../utils/dataUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface DirectionTabProps {
  data: TradeRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>{label}</p>
        {payload.map((entry: any, index: number) => {
          let valueStr = entry.value;
          if (entry.name.includes('Rate') || entry.name.includes('Oran')) {
            valueStr = `%${Number(entry.value).toFixed(1)}`;
          } else {
            valueStr = `${entry.value > 0 ? '+' : ''}${Number(entry.value).toFixed(2)} RR`;
          }
          return (
            <p key={`item-${index}`} style={{ color: entry.fill || entry.color, fontWeight: 600, marginTop: '0.25rem' }}>
              {entry.name}: {valueStr}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

const DirectionTab: React.FC<DirectionTabProps> = ({ data }) => {
  const analytics = useMemo(() => {
    // 1. Long vs Short
    let longCount = 0, longWins = 0, longRR = 0;
    let shortCount = 0, shortWins = 0, shortRR = 0;

    // 2. Bias (Bull vs Bear)
    let bullCount = 0, bullWins = 0, bullRR = 0;
    let bearCount = 0, bearWins = 0, bearRR = 0;

    // 3. Alignment
    let alignedCount = 0, alignedWins = 0, alignedRR = 0;
    let counterCount = 0, counterWins = 0, counterRR = 0;

    data.forEach(trade => {
      const isWin = trade.RR > 0;
      
      // Direction Analysis
      if (trade.Yön === 'Long') {
        longCount++;
        longRR += trade.RR;
        if (isWin) longWins++;
      } else if (trade.Yön === 'Short') {
        shortCount++;
        shortRR += trade.RR;
        if (isWin) shortWins++;
      }

      // Bias Analysis
      const bias = trade['Haftalık Bias'];
      if (bias === 'Bull') {
        bullCount++;
        bullRR += trade.RR;
        if (isWin) bullWins++;
      } else if (bias === 'Bear') {
        bearCount++;
        bearRR += trade.RR;
        if (isWin) bearWins++;
      }

      // Alignment Analysis (Yön vs Weekly Bias)
      if (trade.Yön && bias) {
        const isAligned = 
          (trade.Yön === 'Long' && bias === 'Bull') || 
          (trade.Yön === 'Short' && bias === 'Bear');
        
        if (isAligned) {
          alignedCount++;
          alignedRR += trade.RR;
          if (isWin) alignedWins++;
        } else {
          counterCount++;
          counterRR += trade.RR;
          if (isWin) counterWins++;
        }
      }
    });

    const calculateWinRate = (wins: number, total: number) => total > 0 ? (wins / total) * 100 : 0;

    return {
      direction: {
        long: { count: longCount, winRate: calculateWinRate(longWins, longCount), rr: longRR, avgRR: longCount > 0 ? longRR / longCount : 0 },
        short: { count: shortCount, winRate: calculateWinRate(shortWins, shortCount), rr: shortRR, avgRR: shortCount > 0 ? shortRR / shortCount : 0 }
      },
      bias: {
        bull: { count: bullCount, winRate: calculateWinRate(bullWins, bullCount), rr: bullRR, avgRR: bullCount > 0 ? bullRR / bullCount : 0 },
        bear: { count: bearCount, winRate: calculateWinRate(bearWins, bearCount), rr: bearRR, avgRR: bearCount > 0 ? bearRR / bearCount : 0 }
      },
      alignment: {
        aligned: { count: alignedCount, winRate: calculateWinRate(alignedWins, alignedCount), rr: alignedRR, avgRR: alignedCount > 0 ? alignedRR / alignedCount : 0 },
        counter: { count: counterCount, winRate: calculateWinRate(counterWins, counterCount), rr: counterRR, avgRR: counterCount > 0 ? counterRR / counterCount : 0 }
      }
    };
  }, [data]);

  const directionChartData = useMemo(() => [
    { name: 'Long (Alış)', 'Net RR': Number(analytics.direction.long.rr.toFixed(2)), 'Kazanma Oranı': Number(analytics.direction.long.winRate.toFixed(1)) },
    { name: 'Short (Satış)', 'Net RR': Number(analytics.direction.short.rr.toFixed(2)), 'Kazanma Oranı': Number(analytics.direction.short.winRate.toFixed(1)) }
  ], [analytics]);

  const alignmentChartData = useMemo(() => [
    { name: 'Bias Uyumlu', 'Net RR': Number(analytics.alignment.aligned.rr.toFixed(2)), 'Kazanma Oranı': Number(analytics.alignment.aligned.winRate.toFixed(1)) },
    { name: 'Bias Karşıtı', 'Net RR': Number(analytics.alignment.counter.rr.toFixed(2)), 'Kazanma Oranı': Number(analytics.alignment.counter.winRate.toFixed(1)) }
  ], [analytics]);

  const bestDirection = analytics.direction.long.rr >= analytics.direction.short.rr ? 'Long' : 'Short';
  const bestAlignment = analytics.alignment.aligned.rr >= analytics.alignment.counter.rr ? 'Aligned' : 'Counter';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Introduction Card */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Compass size={24} color="var(--accent-secondary)" />
          Strateji Yönü ve Haftalık Bias Analizi
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          İşlem yönünün (Long/Short) ve haftalık ana trend yöneliminin (Weekly Bias) stratejinizin performansı üzerindeki etkilerini analiz edin.
        </p>
      </div>

      {/* Alignment Analysis Section */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          Weekly Bias Uyumluluk Analizi
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Chart */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alignmentChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Net RR" name="Net RR" radius={[4, 4, 0, 0]}>
                  {alignmentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry['Net RR'] > 0 ? 'var(--success)' : 'var(--danger)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cards & Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
            <div style={{ 
              background: bestAlignment === 'Aligned' ? 'var(--success-bg)' : 'rgba(255,255,255,0.02)', 
              border: `1px solid ${bestAlignment === 'Aligned' ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-color)'}`, 
              borderRadius: '12px', padding: '1.5rem' 
            }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 700 }}>Bias Uyumlu İşlemler</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                İşlem yönünün (Long/Short) Haftalık Bias ile aynı olduğu durumlar.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Toplam / Win Rate:</span>
                <span style={{ fontWeight: 600 }}>{analytics.alignment.aligned.count} İşlem (%{analytics.alignment.aligned.winRate.toFixed(1)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Net RR:</span>
                <span style={{ fontWeight: 800, color: 'var(--success)' }}>+{formatNumber(analytics.alignment.aligned.rr)} RR</span>
              </div>
            </div>

            <div style={{ 
              background: bestAlignment === 'Counter' ? 'var(--success-bg)' : 'rgba(255,255,255,0.02)', 
              border: `1px solid ${bestAlignment === 'Counter' ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-color)'}`, 
              borderRadius: '12px', padding: '1.5rem' 
            }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 700 }}>Bias Karşıtı İşlemler</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Haftalık Bias yönünün tersine alınan counter-trend işlemler.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Toplam / Win Rate:</span>
                <span style={{ fontWeight: 600 }}>{analytics.alignment.counter.count} İşlem (%{analytics.alignment.counter.winRate.toFixed(1)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Net RR:</span>
                <span style={{ fontWeight: 800, color: analytics.alignment.counter.rr >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {analytics.alignment.counter.rr > 0 ? '+' : ''}{formatNumber(analytics.alignment.counter.rr)} RR
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Direction & Bias Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Long vs Short */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {bestDirection === 'Long' ? <TrendingUp size={20} color="var(--success)" /> : <TrendingDown size={20} color="var(--danger)" />}
            Yön Analizi (Long vs Short)
          </h3>
          
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', height: '260px', marginBottom: '1.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={directionChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                <Bar dataKey="Net RR" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Long Net RR</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 850, color: 'var(--success)' }}>+{formatNumber(analytics.direction.long.rr)} RR</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{analytics.direction.long.count} işlem, %{analytics.direction.long.winRate.toFixed(0)} WR</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Short Net RR</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 850, color: analytics.direction.short.rr >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {analytics.direction.short.rr > 0 ? '+' : ''}{formatNumber(analytics.direction.short.rr)} RR
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{analytics.direction.short.count} işlem, %{analytics.direction.short.winRate.toFixed(0)} WR</div>
            </div>
          </div>
        </div>

        {/* Weekly Bias (Bull vs Bear) */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="var(--accent-secondary)" />
            Haftalık Bias Performansı
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center', height: '100%', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--success)' }}>
                <TrendingUp size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700 }}>Bullish Bias Günleri</span>
                  <span style={{ fontWeight: 800, color: 'var(--success)' }}>+{formatNumber(analytics.bias.bull.rr)} RR</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(analytics.bias.bull.winRate, 100)}%`, background: 'var(--success)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  <span>{analytics.bias.bull.count} İşlem</span>
                  <span>Kazanma Oranı: %{analytics.bias.bull.winRate.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--danger)' }}>
                <TrendingDown size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700 }}>Bearish Bias Günleri</span>
                  <span style={{ fontWeight: 800, color: analytics.bias.bear.rr >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {analytics.bias.bear.rr > 0 ? '+' : ''}{formatNumber(analytics.bias.bear.rr)} RR
                  </span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(analytics.bias.bear.winRate, 100)}%`, background: 'var(--danger)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  <span>{analytics.bias.bear.count} İşlem</span>
                  <span>Kazanma Oranı: %{analytics.bias.bear.winRate.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DirectionTab;
