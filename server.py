import os
import sys
import urllib.request
import urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 5432
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(ROOT_DIR, 'public')
SOUNDFONTS_DIR = os.path.join(PUBLIC_DIR, 'soundfonts')

os.makedirs(SOUNDFONTS_DIR, exist_ok=True)

class DroneStationHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def do_GET(self):
        # Auto proxy and cache SoundFonts on-demand
        if self.path.startswith('/soundfonts/') and self.path.endswith('-mp3.js'):
            filename = os.path.basename(self.path.split('?')[0])
            local_file = os.path.join(SOUNDFONTS_DIR, filename)

            if not os.path.exists(local_file):
                print(f"[SoundFont Proxy] Fetching and caching {filename} from CDN...")
                cdn_url = f"https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/{filename}"
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                try:
                    req = urllib.request.Request(cdn_url, headers=headers)
                    with urllib.request.urlopen(req, timeout=15) as resp:
                        content = resp.read()
                        with open(local_file, 'wb') as f:
                            f.write(content)
                    print(f"[SoundFont Proxy] Successfully cached {filename} ({len(content)} bytes)")
                except Exception as e:
                    print(f"[SoundFont Proxy] Error fetching {filename}: {e}")
                    self.send_error(502, f"Could not fetch soundfont: {e}")
                    return

        # Enable CORS and disable aggressive caching for local dev
        super().do_GET()

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

def run_server():
    server_address = ('127.0.0.1', PORT)
    try:
        httpd = HTTPServer(server_address, DroneStationHandler)
    except OSError:
        # If port 5432 is occupied, try 5433
        alt_port = 5433
        httpd = HTTPServer(('127.0.0.1', alt_port), DroneStationHandler)
        print(f"Port {PORT} busy, listening on http://127.0.0.1:{alt_port}")
        return httpd, alt_port

    print(f"[Drone Station Server] Running at http://127.0.0.1:{PORT}")
    return httpd, PORT

if __name__ == '__main__':
    httpd, port = run_server()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Drone Station Server] Stopped.")
        sys.exit(0)
