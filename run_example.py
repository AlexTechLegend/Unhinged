from analyzer.core import DataLoader, generate_signals, Backtester
from analyzer.screenshot import capture_screen, analyze_screenshot

# Example usage with sample CSV path
if __name__ == '__main__':
    loader = DataLoader()
    try:
        data = loader.load_csv('sample_data.csv')
    except FileNotFoundError:
        print('Provide sample_data.csv to run example.')
        exit(0)

    signals = generate_signals(data)
    backtester = Backtester(data, signals)
    history = backtester.run()
    for record in history:
        ts, action, price, balance, reason = record
        print(f"{ts} {action} @{price:.2f} balance={balance:.2f} reasons={reason}")

    # Demonstrate screenshot capture and analysis
    print("\nCapturing screenshot of the entire screen ...")
    try:
        path = capture_screen()
        info = analyze_screenshot(path)
        print(f"Screenshot saved to {path} -> {info}")
    except RuntimeError as e:
        print(e)
