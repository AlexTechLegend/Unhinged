"""Screenshot utilities for capturing charts for analysis."""

from typing import Optional, Tuple


try:
    from PIL import ImageGrab  # type: ignore
except Exception:  # pragma: no cover - Pillow may not be installed
    ImageGrab = None


def capture_screen(region: Optional[Tuple[int, int, int, int]] = None,
                   output: str = "capture.png") -> str:
    """Capture a screen region using Pillow's ImageGrab.

    Parameters
    ----------
    region : tuple, optional
        (left, top, right, bottom) region to grab. If ``None`` the entire
        screen is captured.
    output : str
        Filename where the screenshot will be saved.

    Returns
    -------
    str
        Path to the saved screenshot file.
    """
    if ImageGrab is None:
        raise RuntimeError(
            "Screenshot capture requires Pillow. Please install it to use this feature.")

    img = ImageGrab.grab(bbox=region)
    img.save(output)
    return output


# Placeholder analysis function

def analyze_screenshot(image_path: str):
    """Example placeholder that simply reports the image size."""
    try:
        from PIL import Image  # type: ignore
    except Exception:
        raise RuntimeError(
            "Pillow is required to analyze screenshots. Please install it.")

    with Image.open(image_path) as img:
        width, height = img.size
    print(f"Analyzing screenshot {image_path} ({width}x{height})")
    # Real implementation would parse OHLC data from chart images
    return {"width": width, "height": height}
