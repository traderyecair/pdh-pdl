import React, { useState, useMemo } from 'react';
import { TradeRecord, formatNumber } from '../utils/dataUtils';
import { ExternalLink, Filter, ArrowUpDown, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import ImageModal from './ImageModal';

interface DataTableProps {
  data: TradeRecord[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [filterSession, setFilterSession] = useState<string>('All');
  const [filterWL, setFilterWL] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<{ key: keyof TradeRecord | 'dateObj', direction: 'ascending' | 'descending' } | null>(null);
  
  // Modal State
  const [activeModalUrl, setActiveModalUrl] = useState<string | null>(null);

  // Get unique sessions for filter dropdown
  const sessions = useMemo(() => {
    const uniqueSessions = new Set(data.map(item => item.Session).filter(Boolean));
    return ['All', ...Array.from(uniqueSessions)];
  }, [data]);

  const requestSort = (key: keyof TradeRecord | 'dateObj') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    let sortableData = [...data];

    // Apply filters
    if (filterSession !== 'All') {
      sortableData = sortableData.filter(item => item.Session === filterSession);
    }
    if (filterWL !== 'All') {
      sortableData = sortableData.filter(item => item['W/L'] === filterWL);
    }

    // Apply sorting
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof TradeRecord];
        let bValue: any = b[sortConfig.key as keyof TradeRecord];
        
        if (sortConfig.key === 'dateObj') {
            aValue = a.parsedDate ? a.parsedDate.getTime() : 0;
            bValue = b.parsedDate ? b.parsedDate.getTime() : 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableData;
  }, [data, filterSession, filterWL, sortConfig]);

  const tableHeaderStyle = {
    padding: '1rem',
    textAlign: 'left' as const,
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: '0.875rem',
    borderBottom: '1px solid var(--border-color)',
    cursor: 'pointer',
    userSelect: 'none' as const,
  };

  const tableCellStyle = {
    padding: '1rem',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  };

  return (
    <>
      <div className="glass-panel" style={{ marginTop: '1.5rem', overflow: 'hidden' }}>
        
        {/* Filters Bar */}
        <div style={{ 
          padding: '1.5rem', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <Filter size={18} />
            <span style={{ fontWeight: 500 }}>Filters:</span>
          </div>

          <select 
            value={filterSession} 
            onChange={(e) => setFilterSession(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          >
            {sessions.map(session => (
              <option key={session} value={session}>{session === 'All' ? 'All Sessions' : session}</option>
            ))}
          </select>

          <select 
            value={filterWL} 
            onChange={(e) => setFilterWL(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          >
            <option value="All">All Results</option>
            <option value="Yes">Wins Only</option>
            <option value="No">Losses Only</option>
          </select>
          
          <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Showing {filteredAndSortedData.length} records
          </div>
        </div>

        {/* Table Container */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle} onClick={() => requestSort('Parite')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Parity <ArrowUpDown size={14} />
                  </div>
                </th>
                <th style={tableHeaderStyle} onClick={() => requestSort('dateObj')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Date <ArrowUpDown size={14} />
                  </div>
                </th>
                <th style={tableHeaderStyle} onClick={() => requestSort('Session')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Session <ArrowUpDown size={14} />
                  </div>
                </th>
                <th style={tableHeaderStyle} onClick={() => requestSort('Yön')}>Direction</th>
                <th style={tableHeaderStyle} onClick={() => requestSort('W/L')}>Result</th>
                <th style={tableHeaderStyle} onClick={() => requestSort('RR')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    RR <ArrowUpDown size={14} />
                  </div>
                </th>
                <th style={tableHeaderStyle}>Chart</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map((trade, index) => (
                <tr key={index} style={{ transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{...tableCellStyle, fontWeight: 500}}>{trade.Parite}</td>
                  <td style={tableCellStyle}>{trade.parsedDate ? format(trade.parsedDate, 'dd MMM yyyy') : trade.Date}</td>
                  <td style={tableCellStyle}>{trade.Session}</td>
                  <td style={tableCellStyle}>
                    {trade.Yön && (
                      <span className={`badge ${trade.Yön === 'Long' ? 'badge-success' : 'badge-danger'}`}>
                        {trade.Yön}
                      </span>
                    )}
                  </td>
                  <td style={tableCellStyle}>
                    {trade['W/L'] && (
                      <span style={{ 
                        color: trade['W/L'] === 'Yes' ? 'var(--success)' : 'var(--danger)',
                        fontWeight: 600 
                      }}>
                        {trade['W/L'] === 'Yes' ? 'Win' : 'Loss'}
                      </span>
                    )}
                  </td>
                  <td style={{...tableCellStyle, fontWeight: 600, color: trade.RR > 0 ? 'var(--success)' : trade.RR < 0 ? 'var(--danger)' : 'var(--text-primary)'}}>
                    {trade.RR > 0 ? '+' : ''}{formatNumber(trade.RR)}
                  </td>
                  <td style={tableCellStyle}>
                    {trade.Tradingview && (
                      <button 
                        onClick={() => setActiveModalUrl(trade.Tradingview)}
                        style={{ 
                          color: 'var(--text-primary)', 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.35rem 0.75rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                          e.currentTarget.style.color = 'var(--accent-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                      >
                        <ImageIcon size={14} /> Görsel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAndSortedData.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No records found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {activeModalUrl && (
        <ImageModal 
          url={activeModalUrl} 
          onClose={() => setActiveModalUrl(null)} 
        />
      )}
    </>
  );
};

export default DataTable;
