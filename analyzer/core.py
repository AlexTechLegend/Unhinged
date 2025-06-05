class PriceData:
    """Simple OHLCV structure."""
    def __init__(self, timestamp, open_, high, low, close, volume):
        self.timestamp = timestamp
        self.open = open_
        self.high = high
        self.low = low
        self.close = close
        self.volume = volume


class DataLoader:
    """Load OHLCV data from a CSV file."""
    def load_csv(self, path):
        data = []
        with open(path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.lower().startswith('date'):
                    continue
                parts = line.split(',')
                timestamp = parts[0]
                open_, high, low, close, volume = map(float, parts[1:6])
                data.append(PriceData(timestamp, open_, high, low, close, volume))
        return data


def moving_average(values, period):
    if period <= 0:
        raise ValueError('period must be positive')
    result = []
    for i in range(len(values)):
        if i + 1 < period:
            result.append(None)
        else:
            window = values[i + 1 - period:i + 1]
            result.append(sum(window) / period)
    return result


def exponential_moving_average(values, period):
    if period <= 0:
        raise ValueError('period must be positive')
    result = []
    multiplier = 2 / (period + 1)
    ema = None
    for v in values:
        ema = v if ema is None else (v - ema) * multiplier + ema
        result.append(ema)
    return result


def relative_strength_index(values, period=14):
    result = []
    gains = [0]
    losses = [0]
    for i in range(1, len(values)):
        diff = values[i] - values[i - 1]
        gains.append(max(diff, 0))
        losses.append(abs(min(diff, 0)))
    for i in range(len(values)):
        if i < period:
            result.append(None)
        else:
            avg_gain = sum(gains[i-period+1:i+1]) / period
            avg_loss = sum(losses[i-period+1:i+1]) / period
            rs = avg_gain / avg_loss if avg_loss != 0 else 0
            rsi = 100 - (100 / (1 + rs))
            result.append(rsi)
    return result


def atr(highs, lows, closes, period=14):
    trs = []
    for i in range(len(highs)):
        if i == 0:
            tr = highs[i] - lows[i]
        else:
            tr = max(highs[i] - lows[i], abs(highs[i] - closes[i-1]), abs(lows[i] - closes[i-1]))
        trs.append(tr)
    result = []
    for i in range(len(trs)):
        if i < period:
            result.append(None)
        else:
            result.append(sum(trs[i-period+1:i+1]) / period)
    return result


def bollinger_bands(values, period=20, num_std=2):
    result = []
    for i in range(len(values)):
        if i + 1 < period:
            result.append((None, None))
        else:
            window = values[i + 1 - period:i + 1]
            mean = sum(window) / period
            variance = sum((v - mean) ** 2 for v in window) / period
            std = variance ** 0.5
            upper = mean + num_std * std
            lower = mean - num_std * std
            result.append((upper, lower))
    return result


def simple_pattern_recognition(data):
    patterns = []
    for i in range(1, len(data)):
        curr = data[i]
        prev = data[i-1]
        if curr.close > curr.open and prev.close < prev.open:
            if curr.open < prev.close and curr.close > prev.open:
                patterns.append((curr.timestamp, 'bullish_engulfing'))
    return patterns


def generate_signals(data):
    closes = [d.close for d in data]
    highs = [d.high for d in data]
    lows = [d.low for d in data]

    ema50 = exponential_moving_average(closes, 50)
    rsi14 = relative_strength_index(closes, 14)
    bbands = bollinger_bands(closes, 20)
    atr14 = atr(highs, lows, closes, 14)

    signals = []
    for i in range(len(data)):
        if i < 50:
            continue
        entry = None
        exit = None
        reason = []
        if rsi14[i] is not None and rsi14[i] < 30 and bbands[i][1] is not None and closes[i] <= bbands[i][1]:
            entry = 'long'
            reason.append('RSI<30 and near lower Bollinger')
        if ema50[i] is not None and closes[i] < ema50[i]:
            exit = 'long'
            reason.append('price below EMA50')
        if entry or exit:
            signals.append({
                'timestamp': data[i].timestamp,
                'entry': entry,
                'exit': exit,
                'reasons': reason,
                'atr': atr14[i]
            })
    return signals


class Backtester:
    def __init__(self, data, signals):
        self.data = data
        self.signals = signals

    def run(self, initial_balance=10000):
        balance = initial_balance
        position = None
        entry_price = None
        history = []
        for bar in self.data:
            for sig in [s for s in self.signals if s['timestamp'] == bar.timestamp]:
                if sig['entry'] == 'long' and position is None:
                    position = 'long'
                    entry_price = bar.close
                    history.append((bar.timestamp, 'enter', bar.close, balance, ','.join(sig['reasons'])))
                if sig['exit'] == 'long' and position == 'long':
                    profit = bar.close - entry_price
                    balance += profit
                    position = None
                    entry_price = None
                    history.append((bar.timestamp, 'exit', bar.close, balance, ','.join(sig['reasons'])))
        if position == 'long':
            profit = self.data[-1].close - entry_price
            balance += profit
            history.append((self.data[-1].timestamp, 'exit_end', self.data[-1].close, balance, 'close_end'))
        return history
