# Unhinged

This repository provides a basic stock price action analyzer implemented in pure Python. It includes:

- Data loader for OHLCV CSV files
- Common technical indicators (EMA, RSI, ATR, Bollinger Bands)
- Simple candlestick pattern recognition
- Signal generation logic combining indicator confluence
- A lightweight backtester
- Example script (`run_example.py`)
- Optional screenshot utilities using Pillow

The implementation avoids third-party dependencies so indicator calculations are minimal.

To run the example, supply a `sample_data.csv` file with columns:

```
Date,Open,High,Low,Close,Volume
2020-01-01,10,10.5,9.5,10.2,1000
...
```

Then execute:

```
python run_example.py
```

The example attempts to capture a screenshot using Pillow. If Pillow is not
installed or your environment lacks screen access, a runtime message will be
displayed instead of saving a screenshot.

