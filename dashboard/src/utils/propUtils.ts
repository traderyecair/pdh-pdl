/**
 * propUtils.ts
 * Logic for calculating prop firm challenges, scaling, and projections based on statistical performance.
 */

export interface PropInputs {
  accountSize: number;
  riskPercent: number;
  tradesPerMonth: number;
  splitPercent: number;
  targetRR: number;
  maxDailyDrawdown: number;
  maxTotalDrawdown: number;
  challengePhase1Target: number;
  challengePhase2Target: number;
  scalingPlan: number[];
}

export const calculatePropProjection = (
  inputs: PropInputs, 
  stats: {
    winRate: number;
    avgWinRR: number;
    avgLossRR: number;
    expectancy: number;
  },
  bootstrapExpectedAvg: number,
  monteCarloP5: number,
  monteCarloP95: number
) => {
  // 1R in USD
  const rValueUSD = inputs.accountSize * (inputs.riskPercent / 100);
  
  // -- 1. Normal Projection --
  // Monthly R based on Expectancy
  const normalMonthlyR = stats.expectancy * inputs.tradesPerMonth;
  const normalGrossProfit = normalMonthlyR * rValueUSD;
  const normalNetProfit = normalGrossProfit * (inputs.splitPercent / 100);

  // -- 2. Statistical Projection --
  // Using Bootstrap expected avg
  const statMonthlyR = bootstrapExpectedAvg * inputs.tradesPerMonth;
  const statGrossProfit = statMonthlyR * rValueUSD;
  const statNetProfit = statGrossProfit * (inputs.splitPercent / 100);
  
  // -- 3. Monte Carlo Range (P5 - P95) --
  // Assuming the MonteCarlo ran for "tradesPerMonth" trades
  const mcWorstMonthlyR = monteCarloP5;
  const mcBestMonthlyR = monteCarloP95;
  
  const mcWorstNetProfit = mcWorstMonthlyR * rValueUSD * (inputs.splitPercent / 100);
  const mcBestNetProfit = mcBestMonthlyR * rValueUSD * (inputs.splitPercent / 100);

  // -- Probabilities (Estimations) --
  // Challenge Target in R
  const phase1TargetR = (inputs.challengePhase1Target / 100) * inputs.accountSize / rValueUSD;
  const phase2TargetR = (inputs.challengePhase2Target / 100) * inputs.accountSize / rValueUSD;
  const maxDdLimitR = (inputs.maxTotalDrawdown / 100) * inputs.accountSize / rValueUSD;

  return {
    rValueUSD,
    normal: {
      monthlyR: normalMonthlyR,
      grossProfit: normalGrossProfit,
      netProfit: normalNetProfit
    },
    statistical: {
      monthlyR: statMonthlyR,
      grossProfit: statGrossProfit,
      netProfit: statNetProfit
    },
    monteCarlo: {
      worstMonthlyR: mcWorstMonthlyR,
      worstNetProfit: mcWorstNetProfit,
      bestMonthlyR: mcBestMonthlyR,
      bestNetProfit: mcBestNetProfit
    },
    targets: {
      phase1TargetR,
      phase2TargetR,
      maxDdLimitR
    }
  };
};

export const generateScalingPlan = (
  baseAccountSizes: number[], 
  monthlyExpectedR: number, 
  riskPercent: number, 
  targetRForScale: number,
  splitPercent: number
) => {
  const plan = [];
  
  for (let i = 0; i < baseAccountSizes.length; i++) {
    const size = baseAccountSizes[i];
    const rValue = size * (riskPercent / 100);
    const expectedMonths = Math.ceil(targetRForScale / monthlyExpectedR);
    const netPayoutAtScale = targetRForScale * rValue * (splitPercent / 100);
    
    let riskStatus = 'Low Risk';
    if (size >= 300000) riskStatus = 'Increasing Psychological Risk';
    if (size >= 500000) riskStatus = 'High Psychological Risk';

    plan.push({
      stage: i + 1,
      accountSize: size,
      targetR: targetRForScale,
      monthsToScale: expectedMonths < 1 ? 1 : expectedMonths,
      netPayout: netPayoutAtScale,
      riskStatus
    });
  }

  return plan;
};

// Cumulative Scenarios (3, 6, 12, 24 months)
export const calculateCumulativeScenarios = (
  baseMonthlyR: number, 
  rValueUSD: number, 
  splitPercent: number,
  mcWorstR: number,
  mcBestR: number
) => {
  const calc = (monthlyR: number) => {
    return {
      m3: monthlyR * 3 * rValueUSD * (splitPercent / 100),
      m6: monthlyR * 6 * rValueUSD * (splitPercent / 100),
      m12: monthlyR * 12 * rValueUSD * (splitPercent / 100),
      m24: monthlyR * 24 * rValueUSD * (splitPercent / 100)
    };
  };

  return {
    conservative: calc(Math.max(0, mcWorstR)), // Prevent negative long term projection, assume break-even worst case long term
    base: calc(baseMonthlyR),
    aggressive: calc(mcBestR)
  };
};
