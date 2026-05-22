/**
 * statisticsUtils.ts
 * Advanced statistical methods for analyzing trading performance.
 */

// 1. Wilson Score Interval for Win Rate (95% Confidence)
export const calculateWilsonScoreInterval = (wins: number, total: number) => {
  if (total === 0) return { lower: 0, upper: 0, center: 0 };
  const z = 1.96; // 95% confidence
  const phat = wins / total;
  
  const denominator = 1 + z * z / total;
  const center = (phat + z * z / (2 * total)) / denominator;
  const spread = z * Math.sqrt((phat * (1 - phat) + z * z / (4 * total)) / total) / denominator;
  
  return {
    lower: Math.max(0, center - spread) * 100,
    upper: Math.min(1, center + spread) * 100,
    center: center * 100
  };
};

// 2. Bayesian Win Rate Estimate (Beta Distribution)
// Using Beta(1,1) as uniform prior
export const calculateBayesianEstimate = (wins: number, losses: number) => {
  const alpha = wins + 1;
  const beta = losses + 1;
  const total = alpha + beta;
  
  const expectedValue = alpha / total;
  
  // Approximate 95% Credible Interval using Normal approximation of Beta for simplicity
  // Variance = (alpha * beta) / ((alpha + beta)^2 * (alpha + beta + 1))
  const variance = (alpha * beta) / (Math.pow(total, 2) * (total + 1));
  const stdDev = Math.sqrt(variance);
  
  const lower = Math.max(0, expectedValue - 1.96 * stdDev);
  const upper = Math.min(1, expectedValue + 1.96 * stdDev);
  
  return {
    expected: expectedValue * 100,
    lower: lower * 100,
    upper: upper * 100
  };
};

// 3. Monte Carlo Simulation (Equity Curve projection)
export const runMonteCarlo = (tradesRR: number[], numSimulations: number, numTrades: number) => {
  if (tradesRR.length === 0) return null;
  
  const allFinalResults = [];
  const samplePaths = []; // Store a few paths to chart
  
  for (let i = 0; i < numSimulations; i++) {
    let currentRR = 0;
    const path = [0];
    
    for (let j = 0; j < numTrades; j++) {
      // Random sample with replacement
      const randomIndex = Math.floor(Math.random() * tradesRR.length);
      currentRR += tradesRR[randomIndex];
      
      if (i < 50) { // Keep first 50 paths for graphing
        path.push(currentRR);
      }
    }
    
    if (i < 50) samplePaths.push(path);
    allFinalResults.push(currentRR);
  }
  
  allFinalResults.sort((a, b) => a - b);
  
  // Percentiles
  const p5Index = Math.floor(numSimulations * 0.05);
  const p50Index = Math.floor(numSimulations * 0.50);
  const p95Index = Math.floor(numSimulations * 0.95);
  
  const expectedAvg = allFinalResults.reduce((a, b) => a + b, 0) / numSimulations;
  
  return {
    expectedAvg,
    median: allFinalResults[p50Index],
    worst5: allFinalResults[p5Index],
    best5: allFinalResults[p95Index],
    samplePaths // Array of arrays (each sub array is a sequence of cumulative RRs)
  };
};

// 4. Bootstrap Analysis for Expected Average RR
export const runBootstrap = (tradesRR: number[], iterations: number = 10000) => {
  if (tradesRR.length === 0) return null;
  
  const bootstrapAverages = [];
  
  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < tradesRR.length; j++) {
      const randomIndex = Math.floor(Math.random() * tradesRR.length);
      sum += tradesRR[randomIndex];
    }
    bootstrapAverages.push(sum / tradesRR.length);
  }
  
  bootstrapAverages.sort((a, b) => a - b);
  
  const lower = bootstrapAverages[Math.floor(iterations * 0.025)];
  const upper = bootstrapAverages[Math.floor(iterations * 0.975)];
  const expected = bootstrapAverages.reduce((a, b) => a + b, 0) / iterations;
  
  return { expected, lower, upper };
};

// 5. Streak Probability (Theoretical)
// Probability of losing streak of length N = (LossRate)^N
export const calculateTheoreticalStreakProbabilities = (winRatePerc: number, totalFutureTrades: number) => {
  const lossRate = 1 - (winRatePerc / 100);
  
  // Probability of seeing at least one streak of length N in M trades
  // Approximation formula: P(streak >= N) ≈ 1 - exp(-M * winRate * lossRate^N)
  const calcProb = (n: number) => {
    const probOneStreak = Math.pow(lossRate, n);
    // Rough estimate for large numbers
    const expectedStreaks = totalFutureTrades * (winRatePerc/100) * probOneStreak;
    const probabilityOfAtLeastOne = 1 - Math.exp(-expectedStreaks);
    return probabilityOfAtLeastOne * 100;
  };
  
  return {
    streak3: calcProb(3),
    streak5: calcProb(5),
    streak7: calcProb(7),
    streak10: calcProb(10)
  };
};
