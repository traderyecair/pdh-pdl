import React, { useState, useMemo } from 'react';
import { Percent, Activity, RefreshCw, Sliders, HelpCircle } from 'lucide-react';
import { TradeRecord, formatNumber } from '../../utils/dataUtils';
import { 
  calculateWilsonScoreInterval, 
  calculateBayesianEstimate, 
  runMonteCarlo, 
  runBootstrap, 
  calculateTheoreticalStreakProbabilities 
} from '../../utils/statisticsUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatisticsTabProps {
  data: TradeRecord[];
}

const StatisticsTab: React.FC<StatisticsTabProps> = ({ data }) => {
  const [numTrades, setNumTrades] = useState<number>(100);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const tradesRR = useMemo(() => data.map(t => t.RR), [data]);
  
  const basicStats = useMemo(() => {
    const total = data.length;
    const wins = data.filter(t => t.RR > 0).length;
    const losses = data.filter(t => t.RR < 0).length;
    return { total, wins, losses };
  }, [data]);

  // 1. Wilson Score Interval
  const wilson = useMemo(() => 
    calculateWilsonScoreInterval(basicStats.wins, basicStats.total), 
    [basicStats]
  );

  // 2. Bayesian Estimate
  const bayesian = useMemo(() => 
    calculateBayesianEstimate(basicStats.wins, basicStats.losses), 
    [basicStats]
  );

  // 3. Bootstrap Analysis
  const bootstrap = useMemo(() => 
    runBootstrap(tradesRR, 5000), // Use 5000 iterations for speed and correctness
    [tradesRR]
  );

  // 4. Monte Carlo Simulation
  const mc = useMemo(() => 
    runMonteCarlo(tradesRR, 1000, numTrades),
    [tradesRR, numTrades, refreshKey]
  );

  // 5. Streak Probabilities
  const theoreticalStreaks = useMemo(() => {
    const winRate = basicStats.total > 0 ? (basicStats.wins / basicStats.total) * 100 : 0;
    return calculateTheoreticalStreakProbabilities(winRate, numTrades);
  }, [basicStats, numTrades]);

  // Format Monte Carlo path data for Recharts
  const chartData = useMemo(() => {
    if (!mc || !mc.samplePaths) return [];
    
    // We want to combine the first 15 sample paths into an array of objects
    const pathCount = Math.min(mc.samplePaths.length, 15);
    const dataPoints = [];

    for (let step = 0; step <= numTrades; step++) {
      const point: any = { step };
      for (let p = 0; p < pathCount; p++) {
        point[`path_${p}`] = Number(mc.samplePaths[p][step]?.toFixed(2) || 0);
      }
      dataPoints.push(point);
    }
    return dataPoints;
  }, [mc, numTrades]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Intro Card */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={24} color="var(--accent-primary)" />
          Gelişmiş İstatiksel Modeller ve Simülasyonlar
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Kazanma oranınızın güven aralıkları, bootstrap getiri beklentisi ve gelecekteki equity eğrilerini tahmin eden Monte Carlo simülasyonları.
        </p>
      </div>

      {/* Grid: Win Rate & Expectancy Bounds */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Win Rate Confidence Intervals */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Percent size={18} color="var(--accent-secondary)" />
            Kazanma Oranı Güven Sınırları
          </h3>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Wilson Skoru (%95 Güven)
                <span title="Küçük veri setlerinde bile gerçek kazanma oranının sınırlarını gösterir.">
                  <HelpCircle size={14} color="var(--text-muted)" />
                </span>
              </span>
              <span style={{ color: 'var(--accent-secondary)', fontWeight: 800 }}>
                %{wilson.lower.toFixed(1)} - %{wilson.upper.toFixed(1)}
              </span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ 
                position: 'absolute', 
                left: `${wilson.lower}%`, 
                right: `${100 - wilson.upper}%`, 
                height: '100%', 
                background: 'var(--accent-secondary)',
                borderRadius: '4px'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span>Alt Limit</span>
              <span style={{ color: 'var(--text-primary)' }}>Mevcut: %{(basicStats.total > 0 ? basicStats.wins/basicStats.total*100 : 0).toFixed(1)}</span>
              <span>Üst Limit</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Bayesyen Kazanma Oranı (Beta Prior)
                <span title="Bayesyen olasılık modeline göre beklenen gerçek kazanma oranını tahmin eder.">
                  <HelpCircle size={14} color="var(--text-muted)" />
                </span>
              </span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>
                %{bayesian.expected.toFixed(1)} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(±%{((bayesian.upper - bayesian.lower)/2).toFixed(1)})</span>
              </span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ 
                position: 'absolute', 
                left: `${bayesian.lower}%`, 
                right: `${100 - bayesian.upper}%`, 
                height: '100%', 
                background: 'var(--accent-primary)',
                borderRadius: '4px'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span>Min Credible: %{bayesian.lower.toFixed(1)}</span>
              <span>Max Credible: %{bayesian.upper.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Bootstrap Expectancy Bounds */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--success)" />
            Bootstrap Beklenen Getiri (Expected Value)
          </h3>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Geçmiş işlemlerinizden 5.000 kez yeniden örnekleme yapılarak hesaplanan gerçek işlem başına beklenen getiri (RR) aralığı.
          </p>

          {bootstrap && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ortalama Beklenen Getiri</span>
                <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                  {bootstrap.expected > 0 ? '+' : ''}{formatNumber(bootstrap.expected)} RR
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>%95 Güven Aralığı Alt Limit:</span>
                <span style={{ fontWeight: 700, color: bootstrap.lower >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {bootstrap.lower > 0 ? '+' : ''}{formatNumber(bootstrap.lower)} RR
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 1rem 0.75rem 1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>%95 Güven Aralığı Üst Limit:</span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                  +{formatNumber(bootstrap.upper)} RR
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monte Carlo Equity Simulation Section */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={20} color="var(--accent-primary)" />
              Monte Carlo Equity Simülasyonu
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Rastgele geçmiş işlemleriniz seçilerek simüle edilen 1.000 farklı sermaye (equity) büyüme eğrisi.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Gelecekteki İşlemler:</span>
              <input 
                type="number" 
                value={numTrades} 
                onChange={(e) => setNumTrades(Math.max(10, Math.min(500, parseInt(e.target.value) || 10)))}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  width: '70px',
                  fontFamily: 'inherit',
                  textAlign: 'center',
                  outline: 'none'
                }}
              />
            </div>
            
            <button 
              onClick={handleRefresh}
              style={{
                background: 'var(--accent-primary)',
                border: 'none',
                color: 'white',
                padding: '0.4rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
            >
              <RefreshCw size={16} /> Yeniden Simüle Et
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Chart */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="step" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <Tooltip 
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const values = payload.map((p: any) => p.value);
                      const maxVal = Math.max(...values);
                      const minVal = Math.min(...values);
                      return (
                        <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem' }}>
                          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Adım #{payload[0].payload.step}</p>
                          <p style={{ color: 'var(--success)' }}>En İyi Yol: +{maxVal.toFixed(1)} RR</p>
                          <p style={{ color: 'var(--danger)' }}>En Kötü Yol: {minVal.toFixed(1)} RR</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {Array.from({ length: 15 }).map((_, i) => (
                  <Line 
                    key={i} 
                    type="monotone" 
                    dataKey={`path_${i}`} 
                    stroke={i === 0 ? 'var(--accent-secondary)' : 'rgba(139, 92, 246, 0.15)'} 
                    strokeWidth={i === 0 ? 2 : 1}
                    dot={false} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* MC Simulation Stats */}
          {mc && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
              <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>Simülasyon Sonuçları ({numTrades} İşlem Sonunda)</h4>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Ortalama Büyüme (Beklenen):</span>
                <span style={{ fontWeight: 800, color: 'var(--accent-secondary)' }}>+{formatNumber(mc.expectedAvg)} RR</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Medyan Getiri (P50):</span>
                <span style={{ fontWeight: 700 }}>+{formatNumber(mc.median)} RR</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600 }}>En İyi %5 Senaryo (P95):</span>
                <span style={{ fontWeight: 800, color: 'var(--success)' }}>+{formatNumber(mc.best5)} RR</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 600 }}>En Kötü %5 Senaryo (P5):</span>
                <span style={{ fontWeight: 800, color: mc.worst5 >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {mc.worst5 > 0 ? '+' : ''}{formatNumber(mc.worst5)} RR
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Streak Probabilities Section */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          Teorik Kayıp Serisi Olasılıkları
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Mevcut kazanma oranınızla, gelecekteki <strong>{numTrades}</strong> işlem boyunca karşılaşma olasılığınız olan en yüksek ardışık kayıp serisi limitleri.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>3 Ardışık Kayıp</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>%{theoreticalStreaks.streak3.toFixed(1)}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>5 Ardışık Kayıp</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>%{theoreticalStreaks.streak5.toFixed(1)}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>7 Ardışık Kayıp</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>%{theoreticalStreaks.streak7.toFixed(1)}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>10 Ardışık Kayıp</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>%{theoreticalStreaks.streak10.toFixed(1)}</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StatisticsTab;
