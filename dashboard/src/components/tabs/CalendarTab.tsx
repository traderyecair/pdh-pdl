import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { TradeRecord, getCalendarData, formatNumber } from '../../utils/dataUtils';

interface CalendarTabProps {
  data: TradeRecord[];
}

const monthNamesTr: Record<string, string> = {
  "01": "Ocak", "02": "Şubat", "03": "Mart", "04": "Nisan", "05": "Mayıs", "06": "Haziran",
  "07": "Temmuz", "08": "Ağustos", "09": "Eylül", "10": "Ekim", "11": "Kasım", "12": "Aralık"
};

const CalendarTab: React.FC<CalendarTabProps> = ({ data }) => {
  const { calendar, yearly } = useMemo(() => getCalendarData(data), [data]);
  
  // months array is sorted descending (e.g. ['2023-12', '2023-11', ...])
  const months = useMemo(() => Object.keys(calendar).sort().reverse(), [calendar]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [hoveredCell, setHoveredCell] = useState<{id: string, rr: number, month: string, year: string, x: number, y: number} | null>(null);
  
  // Animation key for forcing re-render animations
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[0]);
    }
  }, [months, selectedMonth]);

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    setAnimKey(prev => prev + 1);
  };

  const currentMonthData = calendar[selectedMonth];
  const years = useMemo(() => Object.keys(yearly).sort().reverse(), [yearly]);

  // Navigation Logic
  const currentIndex = months.indexOf(selectedMonth);
  const hasNext = currentIndex > 0; // "Next" chronologically means a smaller index in the descending array
  const hasPrev = currentIndex < months.length - 1; // "Prev" chronologically means a larger index

  const goToNextMonth = () => { if (hasNext) handleMonthChange(months[currentIndex - 1]); };
  const goToPrevMonth = () => { if (hasPrev) handleMonthChange(months[currentIndex + 1]); };

  // Calculate monthly best/worst day
  const monthStats = useMemo(() => {
    if (!currentMonthData) return null;
    let bestDay = { date: '', rr: -Infinity };
    let worstDay = { date: '', rr: Infinity };
    
    Object.entries(currentMonthData.daily).forEach(([date, dayData]: [string, any]) => {
      if (dayData.net_rr > bestDay.rr) bestDay = { date, rr: dayData.net_rr };
      if (dayData.net_rr < worstDay.rr) worstDay = { date, rr: dayData.net_rr };
    });

    return {
      bestDay: bestDay.rr !== -Infinity ? bestDay : null,
      worstDay: worstDay.rr !== Infinity ? worstDay : null
    };
  }, [currentMonthData]);

  const renderHeatmap = () => {
    return (
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={24} color="var(--accent-secondary)" />
              Yıllık Performans Haritası
            </h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '99px', border: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Kayıp</span>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--danger)', boxShadow: '0 0 8px var(--danger-glow)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--danger-dark)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', margin: '0 4px' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--success-dark)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--success)', boxShadow: '0 0 8px var(--success-glow)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Kazanç</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '700px', paddingBottom: '1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', marginBottom: '1rem', paddingLeft: '4rem' }}>
              {["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"].map(m => (
                <div key={m} style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {m.substring(0,3)}
                </div>
              ))}
              <div style={{ width: '5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)' }}>YIL SONU</div>
            </div>

            {/* Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {years.map(year => {
                let yearlyTotal = 0;
                let hasData = false;
                
                const cells = [];
                for (let i = 1; i <= 12; i++) {
                  const mStr = i.toString().padStart(2, '0');
                  const rrVal = yearly[year][mStr];
                  const targetMonth = `${year}-${mStr}`;
                  const isSelected = selectedMonth === targetMonth;
                  
                  if (rrVal !== null) {
                    hasData = true;
                    yearlyTotal += rrVal;
                    
                    let bgColor = 'rgba(255,255,255,0.02)';
                    let borderColor = 'rgba(255,255,255,0.05)';
                    let glow = 'none';

                    if (rrVal > 0) {
                      if (rrVal >= 10) { bgColor = 'var(--success)'; borderColor = 'var(--success)'; glow = '0 0 15px var(--success-glow)'; }
                      else if (rrVal >= 5) { bgColor = 'var(--success-dark)'; borderColor = 'var(--success-dark)'; }
                      else { bgColor = '#064e3b'; borderColor = '#064e3b'; }
                    } else if (rrVal < 0) {
                      if (rrVal <= -4) { bgColor = 'var(--danger)'; borderColor = 'var(--danger)'; glow = '0 0 15px var(--danger-glow)'; }
                      else if (rrVal <= -2) { bgColor = 'var(--danger-dark)'; borderColor = 'var(--danger-dark)'; }
                      else { bgColor = '#7f1d1d'; borderColor = '#7f1d1d'; }
                    }

                    if (isSelected) {
                      borderColor = 'white';
                      glow = `0 0 0 2px var(--bg-main), 0 0 0 4px ${rrVal >= 0 ? 'var(--success)' : 'var(--danger)'}`;
                    }

                    cells.push(
                      <div 
                        key={mStr}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({ id: targetMonth, rr: rrVal, month: monthNamesTr[mStr], year, x: rect.left + rect.width/2, y: rect.top - 10 });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => {
                          if (months.includes(targetMonth)) handleMonthChange(targetMonth);
                        }}
                        style={{ 
                          flex: 1, 
                          height: '2.5rem', 
                          borderRadius: '8px', 
                          background: bgColor, 
                          border: `1px solid ${borderColor}`,
                          boxShadow: glow,
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          zIndex: isSelected ? 10 : 1
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'white', opacity: isSelected ? 1 : 0.9 }}>
                          {rrVal > 0 ? '+' : ''}{rrVal.toFixed(1)}
                        </span>
                      </div>
                    );
                  } else {
                    cells.push(
                      <div key={mStr} style={{ flex: 1, height: '2.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.05)' }} />
                    );
                  }
                }

                return (
                  <div key={year} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '3.5rem', fontSize: '1rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{year}</div>
                    {cells}
                    <div style={{ 
                      width: '5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)',
                      fontSize: '0.9rem', fontWeight: 800,
                      color: !hasData ? 'var(--text-muted)' : (yearlyTotal >= 0 ? 'var(--success)' : 'var(--danger)')
                    }}>
                      {hasData ? `${yearlyTotal > 0 ? '+' : ''}${yearlyTotal.toFixed(2)}` : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Custom Tooltip */}
        {hoveredCell && (
          <div style={{
            position: 'fixed',
            top: hoveredCell.y,
            left: hoveredCell.x,
            transform: 'translate(-50%, -100%)',
            background: 'rgba(3, 7, 18, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-highlight)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            color: 'white',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 1000,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '120px'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              {hoveredCell.month} {hoveredCell.year}
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: hoveredCell.rr >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {hoveredCell.rr > 0 ? '+' : ''}{hoveredCell.rr} RR
            </span>
            <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid var(--border-highlight)' }} />
          </div>
        )}
      </div>
    );
  };

  const renderCalendar = () => {
    if (!selectedMonth || !currentMonthData) return null;

    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;
    
    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start
    const totalDays = new Date(year, month + 1, 0).getDate();

    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    return (
      <div key={animKey} className="animate-fade-in-up" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', animationDuration: '0.3s' }}>
        
        {/* Left: Main Calendar */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Aylık İşlem Takvimi</h3>
            </div>
            
            {/* New Arrow Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <button 
                onClick={goToPrevMonth}
                disabled={!hasPrev}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', border: 'none', color: hasPrev ? 'white' : 'var(--text-muted)', 
                  width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: hasPrev ? 'pointer' : 'not-allowed', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { if (hasPrev) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={e => { if (hasPrev) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              >
                <ChevronLeft size={20} />
              </button>
              
              <div style={{ minWidth: '140px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {monthNamesTr[monthStr]} {yearStr}
                </div>
              </div>

              <button 
                onClick={goToNextMonth}
                disabled={!hasNext}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', border: 'none', color: hasNext ? 'white' : 'var(--text-muted)', 
                  width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: hasNext ? 'pointer' : 'not-allowed', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { if (hasNext) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={e => { if (hasNext) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
            {/* Days Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                <div key={d} style={{ padding: '1rem 0', textAlign: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {d}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {blanks.map(i => (
                <div key={`blank-${i}`} style={{ minHeight: '100px', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }} />
              ))}
              
              {days.map((d, i) => {
                const dateKey = `${yearStr}-${monthStr}-${d.toString().padStart(2, '0')}`;
                const dayData = currentMonthData.daily[dateKey];
                
                const isLastInRow = (i + blanks.length + 1) % 7 === 0;
                const isLastRow = i + blanks.length >= Math.floor((days.length + blanks.length - 1) / 7) * 7;

                let bgColor = 'transparent';
                let textColor = 'var(--text-muted)';
                
                if (dayData) {
                  if (dayData.status === 'win') {
                    bgColor = 'rgba(16, 185, 129, 0.05)';
                    textColor = 'var(--success)';
                  } else if (dayData.status === 'loss') {
                    bgColor = 'rgba(239, 68, 68, 0.05)';
                    textColor = 'var(--danger)';
                  } else {
                    bgColor = 'rgba(255,255,255,0.02)';
                    textColor = 'var(--text-primary)';
                  }
                }

                return (
                  <div 
                    key={d} 
                    style={{ 
                      minHeight: '100px', 
                      background: bgColor,
                      borderRight: isLastInRow ? 'none' : '1px solid var(--border-color)', 
                      borderBottom: isLastRow ? 'none' : '1px solid var(--border-color)',
                      padding: '0.75rem',
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: dayData ? 'var(--text-primary)' : 'var(--text-muted)' }}>{d}</span>
                    
                    {dayData && (
                      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: textColor }}>
                          {dayData.net_rr > 0 ? '+' : ''}{dayData.net_rr}
                        </span>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                          {Array.from({ length: Math.min(dayData.count, 5) }).map((_, i) => (
                            <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: textColor, opacity: 0.7 }} />
                          ))}
                          {dayData.count > 5 && <span style={{ fontSize: '0.6rem', color: textColor }}>+</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Monthly Sidebar Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(3,7,18,0.8), rgba(139,92,246,0.1))' }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Aylık Net Sonuç</h4>
            <div className={currentMonthData.net_rr >= 0 ? "glow-text-success" : "glow-text-danger"} style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>
              {currentMonthData.net_rr > 0 ? '+' : ''}{formatNumber(currentMonthData.net_rr)}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={18} /> Metrikler
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>İşlem Sayısı</span>
                <span style={{ fontWeight: 700 }}>{currentMonthData.total_trades}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Win Rate</span>
                <span style={{ fontWeight: 700, color: currentMonthData.win_rate >= 50 ? 'var(--success)' : 'var(--danger)' }}>%{currentMonthData.win_rate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Kazanç / Kayıp</span>
                <span style={{ fontWeight: 700 }}>
                  <span style={{ color: 'var(--success)' }}>{currentMonthData.wins}W</span>
                  <span style={{ color: 'var(--text-muted)' }}> / </span>
                  <span style={{ color: 'var(--danger)' }}>{currentMonthData.losses}L</span>
                </span>
              </div>
            </div>
          </div>

          {monthStats?.bestDay && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={16} color="var(--success)" /> En İyi Gün
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{monthStats.bestDay.date.split('-')[2]} {monthNamesTr[monthStr]}</span>
                <span style={{ fontWeight: 800, color: 'var(--success)' }}>+{monthStats.bestDay.rr} RR</span>
              </div>
            </div>
          )}

          {monthStats?.worstDay && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingDown size={16} color="var(--danger)" /> En Kötü Gün
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{monthStats.worstDay.date.split('-')[2]} {monthNamesTr[monthStr]}</span>
                <span style={{ fontWeight: 800, color: 'var(--danger)' }}>{monthStats.worstDay.rr} RR</span>
              </div>
            </div>
          )}

        </div>

      </div>
    );
  };

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      {renderHeatmap()}
      {renderCalendar()}
    </div>
  );
};

export default CalendarTab;
