import React, { useEffect, useState } from 'react';
import { LayoutDashboard, BarChart3, CalendarDays, ListTodo, Hexagon } from 'lucide-react';
import { parseCSVData, calculateMetrics, TradeRecord, formatNumber } from './utils/dataUtils';
import OverviewTab from './components/tabs/OverviewTab';
import MonthlyTab from './components/tabs/MonthlyTab';
import CalendarTab from './components/tabs/CalendarTab';
import DataTable from './components/DataTable';

const App: React.FC = () => {
  const [data, setData] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('genel');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const parsedData = await parseCSVData('/data.csv');
        setData(parsedData);
      } catch (err) {
        setError('Failed to load trading data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const metrics = calculateMetrics(data);

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Hexagon className="spin-slow" color="var(--accent-primary)" size={48} />
          <div style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.1em' }}>
            VERİLER İŞLENİYOR
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', border: '1px solid var(--danger)' }}>
          <h2 className="glow-text-danger" style={{ marginBottom: '1rem' }}>Sistem Hatası</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'genel': return <OverviewTab metrics={metrics} data={data} />;
      case 'aylik': return <MonthlyTab data={data} />;
      case 'takvim': return <CalendarTab data={data} />;
      case 'tablo': return <DataTable data={data} />;
      default: return <OverviewTab metrics={metrics} data={data} />;
    }
  };

  const navItems = [
    { id: 'genel', label: 'Genel Bakış', icon: <LayoutDashboard size={20} /> },
    { id: 'aylik', label: 'Aylık Kâr/Zarar', icon: <BarChart3 size={20} /> },
    { id: 'takvim', label: 'Isı Haritası', icon: <CalendarDays size={20} /> },
    { id: 'tablo', label: 'İşlem Kayıtları', icon: <ListTodo size={20} /> }
  ];

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo text-gradient" style={{ marginBottom: '1rem' }}>
          PDH-PDL
        </div>
        <div style={{ marginBottom: '1rem' }}></div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span style={{ opacity: activeTab === item.id ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <p>Total Trades: <strong style={{ color: 'var(--text-primary)' }}>{metrics.totalTrades}</strong></p>
          <p>Win Rate: <strong style={{ color: 'var(--text-primary)' }}>%{metrics.winRate.toFixed(1)}</strong></p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Dynamic Header based on active tab */}
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }} className="animate-fade-in-up">
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', animationDelay: '0.1s' }} className="animate-fade-in-up">
              PDH-PDL Performans Analizi
            </p>
          </div>
        </header>

        <div style={{ paddingBottom: '4rem' }}>
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
