import React, { useState, useMemo } from 'react';
import { Target, CheckCircle2, AlertTriangle, Lightbulb, Clock, Compass } from 'lucide-react';
import { TradeRecord, formatNumber } from '../../utils/dataUtils';

interface ActionPlanTabProps {
  data: TradeRecord[];
}

const ActionPlanTab: React.FC<ActionPlanTabProps> = ({ data }) => {
  // 1. Dynamic recommendations based on data
  const insights = useMemo(() => {
    if (!data || data.length === 0) return null;

    // A. Session performance
    const sessions = data.reduce((acc, trade) => {
      const s = trade.Session || 'Other';
      if (!acc[s]) acc[s] = { name: s, rr: 0, count: 0 };
      acc[s].rr += trade.RR;
      acc[s].count++;
      return acc;
    }, {} as Record<string, { name: string, rr: number, count: number }>);

    const sessionList = Object.values(sessions);
    const bestSession = sessionList.length > 0 ? sessionList.reduce((max, s) => s.rr > max.rr ? s : max, sessionList[0]) : null;
    const worstSession = sessionList.length > 0 ? sessionList.reduce((min, s) => s.rr < min.rr ? s : min, sessionList[0]) : null;

    // B. Bias Alignment
    let alignedCount = 0, alignedWins = 0, alignedRR = 0;
    let counterCount = 0, counterWins = 0, counterRR = 0;

    data.forEach(trade => {
      const bias = trade['Haftalık Bias'];
      const isWin = trade.RR > 0;
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

    const alignedWinRate = alignedCount > 0 ? (alignedWins / alignedCount) * 100 : 0;
    const counterWinRate = counterCount > 0 ? (counterWins / counterCount) * 100 : 0;

    return {
      bestSession,
      worstSession,
      alignedCount,
      alignedWinRate,
      alignedRR,
      counterCount,
      counterWinRate,
      counterRR,
      biasAdvantage: alignedWinRate - counterWinRate,
      biasRRDiff: alignedRR - counterRR
    };
  }, [data]);

  // 2. Interactive rules state
  const [rules, setRules] = useState([
    { id: 1, text: 'Haftalık Bias yönünde olmayan (trend tersi) işlemleri filtrele.', checked: true, type: 'filter' },
    { id: 2, text: 'Sadece New York ve London seanslarında işlem al, Asya veya Diğer seanslardan uzak dur.', checked: false, type: 'time' },
    { id: 3, text: 'Günde maksimum 2 işlem limiti uygula, intikam işlemlerinden kaçın.', checked: true, type: 'risk' },
    { id: 4, text: 'Haftalık kayıp %5 e ulaştığında o haftalık işlemleri kapat ve dinlen.', checked: false, type: 'risk' },
    { id: 5, text: 'Her işlemin Tradingview linkini ve grafik görselini işlem kaydına ekle.', checked: true, type: 'journal' },
    { id: 6, text: 'Kayıp serilerinde (3+ ardışık stop) sonraki işlem riskini yarıya (%0.25) indir.', checked: false, type: 'risk' }
  ]);

  const toggleRule = (id: number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, checked: !r.checked } : r));
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Intro */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Target size={24} color="var(--accent-tertiary)" />
          Performans Odaklı Aksiyon Planı
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          İşlem verilerinizden çıkarılan istatistiksel zayıflık ve güç noktalarına göre optimize edilmiş ticaret kuralları ve günlük plan.
        </p>
      </div>

      {/* Dynamic Recommendation Panel */}
      {insights && (
        <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--accent-primary)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lightbulb size={20} color="var(--accent-primary)" />
            Veri Analizine Dayalı Stratejik Tavsiyeler
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Session Insight */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                <Clock size={20} />
              </div>
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Seans ve Zaman Yönetimi</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  {insights.bestSession && (
                    <span>En yüksek kâr getiren seansınız <strong>{insights.bestSession.name}</strong> (+{insights.bestSession.rr.toFixed(1)} RR). </span>
                  )}
                  {insights.worstSession && insights.worstSession.rr < 0 && (
                    <span style={{ color: 'var(--text-primary)' }}>
                      Buna karşın, <strong>{insights.worstSession.name}</strong> seansı size net zarar yazdırıyor ({insights.worstSession.rr.toFixed(1)} RR). Bu saatlerde işlem almayı durdurmak genel kârlılığınızı doğrudan artıracaktır.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Bias Alignment Insight */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-secondary)', flexShrink: 0 }}>
                <Compass size={20} />
              </div>
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Weekly Bias Uyum Önceliği</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  Haftalık Bias yönünde açılan işlemlerin kazanma oranı <strong>%{insights.alignedWinRate.toFixed(1)}</strong> iken, bias karşıtı işlemlerin kazanma oranı sadece <strong>%{insights.counterWinRate.toFixed(1)}</strong>.
                  {insights.biasRRDiff > 0 && (
                    <span style={{ color: 'var(--text-primary)' }}>
                      {' '}Trend yönünde kalmak size fazladan <strong>+{insights.biasRRDiff.toFixed(1)} RR</strong> kazandırmış. Trend tersi işlemlerden kaçınmalısınız.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules and Routines Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        
        {/* Trading Rules Checklist */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={20} color="var(--success)" />
            Aktif Ticaret Kuralları ve Filtreler
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {rules.map(rule => (
              <div 
                key={rule.id}
                onClick={() => toggleRule(rule.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: rule.checked ? 'rgba(255,255,255,0.02)' : 'transparent',
                  border: `1px solid ${rule.checked ? 'rgba(255,255,255,0.06)' : 'transparent'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: `2px solid ${rule.checked ? 'var(--success)' : 'var(--text-muted)'}`,
                  background: rule.checked ? 'var(--success)' : 'transparent',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'var(--bg-main)',
                  flexShrink: 0
                }}>
                  {rule.checked && <span style={{ fontSize: '12px', fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ 
                  fontSize: '0.9rem', 
                  color: rule.checked ? 'var(--text-primary)' : 'var(--text-muted)',
                  textDecoration: rule.checked ? 'none' : 'line-through'
                }}>
                  {rule.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Routine Guide */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color="var(--accent-tertiary)" />
            Günlük Disiplin Rutini
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>1.</span> Seans Öncesi Hazırlık (Prep)
              </h4>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>Haftalık Bias analizi ve yön teyidi yap.</li>
                <li>Günlük grafikte PDH (Previous Daily High) ve PDL (Previous Daily Low) seviyelerini belirle.</li>
                <li>Ekonomik takvimi kontrol et (Kırmızı klasörlü haber saatlerini not al).</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>2.</span> Seans Esnası (Execution)
              </h4>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>Seans başlangıcından (Killzone) önce grafik başına geçme, disiplini koru.</li>
                <li>PDH/PDL likidite alımlarında LTF (Düşük Zaman Dilimi) onay formasyonlarını bekle.</li>
                <li>Hedef RR oranı 1:2 ve üzeri olmayan işlemleri pas geç.</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>3.</span> Seans Sonrası (Journaling)
              </h4>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>Sonuç ne olursa olsun işlemi Tradingview görseli ile kaydet.</li>
                <li>Hatalı (FOMO, plana uymama vb.) işlemleri kırmızıyla işaretle.</li>
                <li>Günlük hedeflere ulaşıldığında platformu tamamen kapat.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ActionPlanTab;
