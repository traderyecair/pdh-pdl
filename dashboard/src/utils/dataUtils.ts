import Papa from 'papaparse';
import { isValid, format } from 'date-fns';

export interface TradeRecord {
  Parite: string;
  Date: string;
  'Haftalık Bias': string;
  'P-RR': number | null;
  RR: number;
  Session: string;
  Tradingview: string;
  'W/L': 'Yes' | 'No' | '';
  Yön: 'Long' | 'Short' | '';
  parsedDate: Date | null;
}

export const parseCSVData = async (csvFilePath: string): Promise<TradeRecord[]> => {
  try {
    const response = await fetch(csvFilePath);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const formattedData = results.data
            .map((row: any) => {
              const rr = parseFloat(row.RR);
              const prr = parseFloat(row['P-RR']);
              
              let parsedDate = null;
              if (row.Date) {
                const parts = row.Date.split('/');
                if (parts.length === 3) {
                  const dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                  const date = new Date(dateStr);
                  if (isValid(date)) {
                     parsedDate = date;
                  }
                }
              }

              return {
                Parite: row.Parite || '',
                Date: row.Date || '',
                'Haftalık Bias': row['Haftalık Bias'] || '',
                'P-RR': isNaN(prr) ? null : prr,
                RR: isNaN(rr) ? 0 : rr,
                Session: row.Session || 'Unknown',
                Tradingview: row.Tradingview || '',
                'W/L': row['W/L'] || '',
                Yön: row.Yön || '',
                parsedDate
              } as TradeRecord;
            })
            .filter((row) => row.Parite !== '' && row.RR !== 0);

          // Sort chronological for streak calculation
          const sortedData = formattedData.sort((a, b) => {
            if(a.parsedDate && b.parsedDate) return a.parsedDate.getTime() - b.parsedDate.getTime();
            return 0;
          });

          resolve(sortedData);
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("Error loading CSV:", error);
    return [];
  }
};

export const calculateMetrics = (data: TradeRecord[]) => {
  if (!data || data.length === 0) return { 
    totalTrades: 0, winRate: 0, totalRR: 0, avgRR: 0,
    maxWinStreak: 0, maxLoseStreak: 0,
    avgWinRR: 0, avgLossRR: 0, expectancy: 0,
    avgMonthlyRR: 0
  };

  const totalTrades = data.length;
  const winningTrades = data.filter(t => t.RR > 0);
  const losingTrades = data.filter(t => t.RR < 0);
  
  const wins = winningTrades.length;
  const winRate = (wins / totalTrades) * 100;
  
  const totalRR = data.reduce((sum, t) => sum + t.RR, 0);
  const avgRR = totalRR / totalTrades;

  // Expectancy & Averages
  const avgWinRR = winningTrades.reduce((sum, t) => sum + t.RR, 0) / (wins || 1);
  const avgLossRR = losingTrades.reduce((sum, t) => sum + Math.abs(t.RR), 0) / (losingTrades.length || 1);
  const expectancy = (winRate/100 * avgWinRR) - ((1 - winRate/100) * avgLossRR);

  // Streaks
  let currentWinStreak = 0;
  let currentLoseStreak = 0;
  let maxWinStreak = 0;
  let maxLoseStreak = 0;

  data.forEach(trade => {
    if (trade.RR > 0) {
      currentWinStreak++;
      currentLoseStreak = 0;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    } else if (trade.RR < 0) {
      currentLoseStreak++;
      currentWinStreak = 0;
      if (currentLoseStreak > maxLoseStreak) maxLoseStreak = currentLoseStreak;
    } else {
      currentWinStreak = 0;
      currentLoseStreak = 0;
    }
  });

  // Calculate Avg Monthly RR
  const months = new Set(data.filter(t => t.parsedDate).map(t => format(t.parsedDate!, 'yyyy-MM')));
  const avgMonthlyRR = months.size > 0 ? totalRR / months.size : 0;

  return {
    totalTrades,
    winRate,
    totalRR,
    avgRR,
    maxWinStreak,
    maxLoseStreak,
    avgWinRR,
    avgLossRR,
    expectancy,
    avgMonthlyRR
  };
};

export const getMonthlyData = (data: TradeRecord[]) => {
  const grouped: Record<string, { rr: number, count: number }> = {};
  
  data.forEach(trade => {
    if (trade.parsedDate) {
      const monthKey = format(trade.parsedDate, 'yyyy-MM');
      if (!grouped[monthKey]) grouped[monthKey] = { rr: 0, count: 0 };
      grouped[monthKey].rr += trade.RR;
      grouped[monthKey].count += 1;
    }
  });

  const sortedKeys = Object.keys(grouped).sort();
  return {
    labels: sortedKeys.map(k => {
      const parts = k.split('-');
      return `${parts[0].slice(2)}-${parts[1]}`;
    }),
    fullKeys: sortedKeys,
    rrData: sortedKeys.map(k => Number(grouped[k].rr.toFixed(2))),
    countData: sortedKeys.map(k => grouped[k].count)
  };
};

export const getCalendarData = (data: TradeRecord[]) => {
  const calendar: Record<string, any> = {};
  const yearly: Record<string, Record<string, number | null>> = {};

  data.forEach(trade => {
    if (!trade.parsedDate) return;
    
    const year = format(trade.parsedDate, 'yyyy');
    const month = format(trade.parsedDate, 'MM');
    const monthKey = `${year}-${month}`;
    const dateKey = format(trade.parsedDate, 'yyyy-MM-dd');

    // Init yearly
    if (!yearly[year]) {
      yearly[year] = {};
      for(let i=1; i<=12; i++) {
        yearly[year][i.toString().padStart(2, '0')] = null;
      }
    }
    
    // Add to yearly
    if (yearly[year][month] === null) yearly[year][month] = 0;
    yearly[year][month]! += trade.RR;

    // Init calendar month
    if (!calendar[monthKey]) {
      calendar[monthKey] = {
        total_trades: 0,
        net_rr: 0,
        wins: 0,
        losses: 0,
        breakevens: 0,
        daily: {}
      };
    }

    const monthData = calendar[monthKey];
    monthData.total_trades++;
    monthData.net_rr += trade.RR;
    if (trade.RR > 0) monthData.wins++;
    else if (trade.RR < 0) monthData.losses++;
    else monthData.breakevens++;

    // Init daily
    if (!monthData.daily[dateKey]) {
      monthData.daily[dateKey] = { net_rr: 0, count: 0, status: 'neutral' };
    }
    
    monthData.daily[dateKey].net_rr += trade.RR;
    monthData.daily[dateKey].count++;
    monthData.daily[dateKey].status = monthData.daily[dateKey].net_rr > 0 ? 'win' : (monthData.daily[dateKey].net_rr < 0 ? 'loss' : 'neutral');
  });

  // Calculate win rate per month and fix RR precision
  Object.keys(calendar).forEach(k => {
    calendar[k].win_rate = calendar[k].total_trades > 0 
      ? Number(((calendar[k].wins / calendar[k].total_trades) * 100).toFixed(1)) 
      : 0;
    calendar[k].net_rr = Number(calendar[k].net_rr.toFixed(2));
    
    Object.keys(calendar[k].daily).forEach(dk => {
      calendar[k].daily[dk].net_rr = Number(calendar[k].daily[dk].net_rr.toFixed(2));
    });
  });

  // Fix yearly precision
  Object.keys(yearly).forEach(y => {
    Object.keys(yearly[y]).forEach(m => {
      if (yearly[y][m] !== null) {
        yearly[y][m] = Number(yearly[y][m]!.toFixed(2));
      }
    });
  });

  return { calendar, yearly };
};

export const formatNumber = (num: number, decimals: number = 2) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};
