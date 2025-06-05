// Basic stock price analyzer
// This module provides simple indicator calculations and mock pattern detection

function sma(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push(sum / period);
  }
  return result;
}

function ema(data, period) {
  const result = [];
  const k = 2 / (period + 1);
  let emaPrev = data[0].close;
  result.push(emaPrev);
  for (let i = 1; i < data.length; i++) {
    emaPrev = data[i].close * k + emaPrev * (1 - k);
    result.push(emaPrev);
  }
  return result;
}

function rsi(data, period = 14) {
  const gains = [];
  const losses = [];
  for (let i = 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    gains.push(Math.max(0, diff));
    losses.push(Math.max(0, -diff));
  }
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const result = [null];
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    const rs = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    result.push(rs);
  }
  return result;
}

function detectCandlestickPatterns(data) {
  // Very naive pattern detection as placeholder
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const patterns = [];
  if (last.close < last.open && prev.close > prev.open && last.open >= prev.close) {
    patterns.push('Bearish engulfing');
  }
  if (last.close > last.open && prev.close < prev.open && last.close >= prev.open) {
    patterns.push('Bullish engulfing');
  }
  return patterns;
}

function supportResistanceLevels(data) {
  // Simple detection of recent highs/lows
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  const high = Math.max(...highs.slice(-20));
  const low = Math.min(...lows.slice(-20));
  return { support: low, resistance: high };
}

function generateSignals(data) {
  const emaFast = ema(data, 10);
  const emaSlow = ema(data, 30);
  const lastIndex = data.length - 1;
  const signals = [];
  if (emaFast[lastIndex] > emaSlow[lastIndex] && emaFast[lastIndex - 1] <= emaSlow[lastIndex - 1]) {
    signals.push('EMA crossover bullish - possible entry');
  }
  if (emaFast[lastIndex] < emaSlow[lastIndex] && emaFast[lastIndex - 1] >= emaSlow[lastIndex - 1]) {
    signals.push('EMA crossover bearish - possible exit');
  }
  const rsiVals = rsi(data);
  const rsiLast = rsiVals[rsiVals.length - 1];
  if (rsiLast < 30) signals.push('RSI oversold');
  if (rsiLast > 70) signals.push('RSI overbought');
  return signals;
}

function riskReward(entry, stop, target) {
  const risk = Math.abs(entry - stop);
  const reward = Math.abs(target - entry);
  const rr = reward / risk;
  return { risk, reward, ratio: rr.toFixed(2) };
}

function backtest(data) {
  // Simple moving average crossover backtest
  const emaFast = ema(data, 10);
  const emaSlow = ema(data, 30);
  let position = null;
  let pnl = 0;
  const trades = [];
  for (let i = 1; i < data.length; i++) {
    if (!position && emaFast[i] > emaSlow[i] && emaFast[i - 1] <= emaSlow[i - 1]) {
      position = { entry: data[i].close, index: i };
    } else if (position && emaFast[i] < emaSlow[i] && emaFast[i - 1] >= emaSlow[i - 1]) {
      const exit = data[i].close;
      pnl += exit - position.entry;
      trades.push({ entry: position.entry, exit, entryIndex: position.index, exitIndex: i });
      position = null;
    }
  }
  return { pnl, trades };
}

function analyzeImage(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const width = canvas.width;
  const height = canvas.height;
  const data = ctx.getImageData(0, 0, width, height).data;
  const line = [];
  for (let x = 0; x < width; x++) {
    let bestY = 0;
    let minL = 765;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const l = data[idx] + data[idx + 1] + data[idx + 2];
      if (l < minL) {
        minL = l;
        bestY = y;
      }
    }
    line.push(bestY);
  }
  const first = line[0];
  const last = line[line.length - 1];
  const slope = (last - first) / width;
  const trend = slope < -0.1 ? 'up' : slope > 0.1 ? 'down' : 'sideways';
  const support = Math.max(...line) / height;
  const resistance = Math.min(...line) / height;
  return { trend, support, resistance };
}

function analyzeData(data) {
  const patterns = detectCandlestickPatterns(data);
  const levels = supportResistanceLevels(data);
  const signals = generateSignals(data);
  const rsiVals = rsi(data);
  const backtestRes = backtest(data);
  return {
    patterns,
    levels,
    signals,
    rsi: rsiVals[rsiVals.length - 1],
    backtest: backtestRes
  };
}

// Example placeholder data (OHLCV)
function sampleData() {
  // Generate synthetic data
  const arr = [];
  let price = 100;
  for (let i = 0; i < 100; i++) {
    const open = price + (Math.random() - 0.5);
    const close = open + (Math.random() - 0.5);
    const high = Math.max(open, close) + Math.random();
    const low = Math.min(open, close) - Math.random();
    const volume = Math.random() * 1000;
    arr.push({ open, high, low, close, volume });
    price = close;
  }
  return arr;
}

// Expose functions
window.StockAnalyzer = {
  analyzeData,
  sampleData,
  riskReward,
  analyzeImage
};
