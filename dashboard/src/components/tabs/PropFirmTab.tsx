import React, { useState, useMemo } from 'react';
import { Briefcase, DollarSign, Target, Shield, ArrowUpRight, Award, Sliders } from 'lucide-react';
import { TradeRecord, calculateMetrics, formatNumber } from '../../utils/dataUtils';
import { runBootstrap, runMonteCarlo } from '../../utils/statisticsUtils';
import { 
  calculatePropProjection, 
  generateScalingPlan, 
  calculateCumulativeScenarios,
  PropInputs
} from '../../utils/propUtils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PropFirmTabProps {
  data: TradeRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>{label} Planı</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color || entry.fill, fontWeight: 700 }}>
            {entry.name}: ${formatNumber(entry.value, 0)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PropFirmTab: React.FC<PropFirmTabProps> = ({ data }) => {
  // 1. Sliders & Input States
  const [accountSize, setAccountSize] = useState<number>(100000);
  const [riskPercent, setRiskPercent] = useState<number>(0.5);
  const [tradesPerMonth, setTradesPerMonth] = useState<number>(20);
  const [splitPercent, setSplitPercent] = useState<number>(80);
  const [targetRForScale, setTargetRForScale] = useState<number>(20);

  const tradesRR = useMemo(() => data.map(t => t.RR), [data]);
  const metrics = useMemo(() => calculateMetrics(data), [data]);

  // Run statistics models to drive predictions
  const statsValues = useMemo(() => {
    const boot = runBootstrap(tradesRR, 1000) || { expected: metrics.expectancy };
    const mc = runMonteCarlo(tradesRR, 1000, tradesPerMonth) || { worst5: 0, best5: 0 };
    
    return {
      bootstrapExpectedAvg: boot.expected,
      mcWorstR: mc.worst5 || 0,
      mcBestR: mc.best5 || 0
    };
  }, [tradesRR, tradesPerMonth, metrics]);

  // Compute projections
  const propInputs = useMemo<PropInputs>(() => ({
    accountSize,
    riskPercent,
    tradesPerMonth,
    splitPercent,
    targetRR: metrics.expectancy,
    maxDailyDrawdown: 5,
    maxTotalDrawdown: 10,
    challengePhase1Target: 8,
    challengePhase2Target: 5,
    scalingPlan: [accountSize, accountSize * 1.25, accountSize * 1.5, accountSize * 1.75, accountSize * 2]
  }), [accountSize, riskPercent, tradesPerMonth, splitPercent, metrics]);

  const statsInput = useMemo(() => ({
    winRate: metrics.winRate,
    avgWinRR: metrics.avgWinRR,
    avgLossRR: metrics.avgLossRR,
    expectancy: metrics.expectancy
  }), [metrics]);

  const projections = useMemo(() => {
    return calculatePropProjection(
      propInputs,
      statsInput,
      statsValues.bootstrapExpectedAvg,
      statsValues.mcWorstR,
      statsValues.mcBestR
    );
  }, [propInputs, statsInput, statsValues]);

  const cumulativeScenarios = useMemo(() => {
    return calculateCumulativeScenarios(
      projections.normal.monthlyR,
      projections.rValueUSD,
      splitPercent,
      statsValues.mcWorstR,
      statsValues.mcBestR
    );
  }, [projections, splitPercent, statsValues]);

  const scalingPlan = useMemo(() => {
    const baseSizes = [accountSize, accountSize * 1.25, accountSize * 1.5, accountSize * 1.75, accountSize * 2];
    // Scale on expectancy
    const expectedMonthlyR = Math.max(0.5, statsValues.bootstrapExpectedAvg * tradesPerMonth);
    return generateScalingPlan(baseSizes, expectedMonthlyR, riskPercent, targetRForScale, splitPercent);
  }, [accountSize, riskPercent, targetRForScale, splitPercent, statsValues, tradesPerMonth]);

  // Format cumulative scenarios for Recharts
  const chartData = useMemo(() => {
    return [
      { name: 'Başlangıç', Muhafazakar: 0, Standart: 0, Agresif: 0 },
      { name: '3 Ay', Muhafazakar: cumulativeScenarios.conservative.m3, Standart: cumulativeScenarios.base.m3, Agresif: cumulativeScenarios.aggressive.m3 },
      { name: '6 Ay', Muhafazakar: cumulativeScenarios.conservative.m6, Standart: cumulativeScenarios.base.m6, Agresif: cumulativeScenarios.aggressive.m6 },
      { name: '12 Ay', Muhafazakar: cumulativeScenarios.conservative.m12, Standart: cumulativeScenarios.base.m12, Agresif: cumulativeScenarios.aggressive.m12 },
      { name: '24 Ay', Muhafazakar: cumulativeScenarios.conservative.m24, Standart: cumulativeScenarios.base.m24, Agresif: cumulativeScenarios.aggressive.m24 },
    ];
  }, [cumulativeScenarios]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Overview Intro */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Briefcase size={24} color="var(--accent-secondary)" />
          Prop Firm Finansman Projeksiyonu ve Simülasyonu
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Kendi istatistiksel performansınızı kullanarak, prop firması değerlendirme süreçlerinizi, kâr hedeflerinizi ve sermaye büyütme planınızı hesaplayın.
        </p>
      </div>

      {/* Inputs and Challenge Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        
        {/* Sliders Box */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} color="var(--accent-primary)" /> Projeksiyon Parametreleri
          </h3>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Başlangıç Sermayesi (USD):</span>
              <span style={{ fontWeight: 800 }}>${formatNumber(accountSize, 0)}</span>
            </div>
            <input 
              type="range" min={10000} max={300000} step={10000}
              value={accountSize} onChange={e => setAccountSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>İşlem Başına Risk (%):</span>
              <span style={{ fontWeight: 800 }}>%{riskPercent.toFixed(2)}</span>
            </div>
            <input 
              type="range" min={0.1} max={2.0} step={0.05}
              value={riskPercent} onChange={e => setRiskPercent(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'right' }}>
              1R Değeri: <strong>${formatNumber(projections.rValueUSD, 1)}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Aylık İşlem Sayısı:</span>
                <span style={{ fontWeight: 800 }}>{tradesPerMonth}</span>
              </div>
              <input 
                type="range" min={5} max={40} step={1}
                value={tradesPerMonth} onChange={e => setTradesPerMonth(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-secondary)' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Kâr Paylaşımı (%):</span>
                <span style={{ fontWeight: 800 }}>%{splitPercent}</span>
              </div>
              <input 
                type="range" min={50} max={95} step={5}
                value={splitPercent} onChange={e => setSplitPercent(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-secondary)' }}
              />
            </div>
          </div>
        </div>

        {/* Challenge Requirements Card */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--success)" /> Değerlendirme Hedefleri
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem', flex: 1, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-primary)' }}>
                <Target size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Aşama 1 Hedefi (%8)</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${formatNumber(accountSize * 0.08, 0)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({projections.targets.phase1TargetR.toFixed(1)}R)</span></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-secondary)' }}>
                <Target size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Aşama 2 Hedefi (%5)</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${formatNumber(accountSize * 0.05, 0)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({projections.targets.phase2TargetR.toFixed(1)}R)</span></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--danger)' }}>
                <Shield size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Maksimum Kayıp (%10)</span>
                  <span style={{ fontWeight: 700, color: 'var(--danger)' }}>${formatNumber(accountSize * 0.1, 0)} <span style={{ fontSize: '0.75rem', color: 'var(--text-danger)' }}>({projections.targets.maxDdLimitR.toFixed(1)}R)</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Projections & Scaling Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        
        {/* Monthly Projection Scenarios */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            Aylık Net Kazanç Tahmini (Profit Split Sonrası)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Muhafazakar (MC P5)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: projections.monteCarlo.worstNetProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                ${formatNumber(Math.max(0, projections.monteCarlo.worstNetProfit), 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({Math.max(0, statsValues.mcWorstR).toFixed(1)}R)</div>
            </div>
            
            <div style={{ background: 'var(--neutral-bg)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Ortalama Beklenen</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 850, color: 'var(--accent-primary)' }}>
                ${formatNumber(projections.statistical.netProfit, 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>({projections.statistical.monthlyR.toFixed(1)}R)</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Agresif (MC P95)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                ${formatNumber(projections.monteCarlo.bestNetProfit, 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({statsValues.mcBestR.toFixed(1)}R)</div>
            </div>
          </div>

          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Kümülatif Kazanç Simülasyonu (Aylar)</h4>
          <div style={{ flex: 1, minHeight: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Standart" stroke="var(--accent-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBase)" />
                <Area type="monotone" dataKey="Muhafazakar" stroke="var(--danger)" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="Agresif" stroke="var(--success)" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scaling Plan Ladder */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Hesap Büyütme (Scaling) Ladderı</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hedef R:</span>
              <input 
                type="number" value={targetRForScale} 
                onChange={e => setTargetRForScale(Math.max(5, Math.min(100, parseInt(e.target.value) || 5)))}
                style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                  padding: '0.2rem 0.5rem', borderRadius: '4px', width: '50px', fontSize: '0.8rem', textAlign: 'center', outline: 'none'
                }}
              />
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Hedeflenen <strong>{targetRForScale}R</strong> kazancına ulaştığınızda prop firmasının hesabınızı büyüterek bir sonraki aşamaya aktardığı plan.
          </p>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>Aşama</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>Hesap Boyutu</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Ödeme (Split)</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Süre (Ay)</th>
                </tr>
              </thead>
              <tbody>
                {scalingPlan.map((stage, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Aşama {stage.stage}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>${formatNumber(stage.accountSize, 0)}</td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                      ${formatNumber(stage.netPayout, 0)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      {stage.monthsToScale} Ay
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default PropFirmTab;
