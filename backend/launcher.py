import sys
import threading
import uvicorn
import webview
from main import app

PORT = 8003


def _start_server():
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")


if __name__ == "__main__":
    t = threading.Thread(target=_start_server, daemon=True)
    t.start()

    # Give the server a moment to start before opening the window
    import time
    time.sleep(1.5)

    window = webview.create_window(
        "mdTree",
        f"http://127.0.0.1:{PORT}",
        width=1400,
        height=900,
        min_size=(800, 600),
    )
    webview.start()
