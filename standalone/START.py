#!/usr/bin/env python3
"""
LexiGraph Python Server
A simple server for when you don't have Node.js installed.
Requires Python 3.7+
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import json
import urllib.request
import urllib.error
import ssl

PORT = 3001

# API Configuration - User should fill these in
API_KEY = os.environ.get('OPENAI_API_KEY', '')
API_ENDPOINT = os.environ.get('OPENAI_API_ENDPOINT', 'https://api.openai.com/v1')
API_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-4o-nano')

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/analyze':
            # Read the request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')

            # If no API key configured, return error
            if not API_KEY:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = json.dumps({'error': 'No API key configured. Please set OPENAI_API_KEY environment variable or edit START.py'})
                self.wfile.write(error_response.encode())
                return

            # Forward to OpenAI-compatible API
            try:
                url = f'{API_ENDPOINT}/chat/completions'
                print(f"[API] Calling: {url}")
                print(f"[API] API_KEY prefix: {API_KEY[:20]}..." if len(API_KEY) > 20 else f"[API] API_KEY: {API_KEY}")

                req = urllib.request.Request(
                    url,
                    data=body.encode('utf-8'),
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {API_KEY}'
                    },
                    method='POST'
                )

                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                with urllib.request.urlopen(req, timeout=60, context=ssl_context) as response:
                    response_data = response.read().decode('utf-8')
                    print(f"[API] Response: {response_data[:200]}...")
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(response_data.encode())

            except urllib.error.HTTPError as e:
                error_data = e.read().decode('utf-8')
                print(f"[API] HTTP Error {e.code}: {error_data[:500]}")
                self.send_response(e.code)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(error_data.encode())

            except Exception as e:
                print(f"[API] Error: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = json.dumps({'error': str(e)})
                self.wfile.write(error_response.encode())

        else:
            self.send_error(404)

    def log_message(self, format, *args):
        # Custom logging
        print(f"[Server] {args[0]}")

def check_node():
    """Check if Node.js is available"""
    import shutil
    return shutil.which('node') is not None

def main():
    # Check for config file
    config_path = os.path.join(os.path.dirname(__file__), 'config.json')
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
                global API_KEY, API_ENDPOINT, API_MODEL
                if config.get('apiKey'):
                    API_KEY = config['apiKey']
                if config.get('endpoint'):
                    API_ENDPOINT = config['endpoint']
                if config.get('model'):
                    API_MODEL = config['model']
                print(f"[Config] Loaded API settings from config.json")
        except Exception as e:
            print(f"[Config] Could not load config.json: {e}")

    # Check for .env file
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        if '=' in line:
                            key, value = line.split('=', 1)
                            value = value.strip().strip('"').strip("'")
                            # Check VITE_ prefix keys (common in Vite projects)
                            if key == 'VITE_OPENAI_API_KEY' and not API_KEY:
                                API_KEY = value
                            elif key == 'VITE_OPENAI_API_ENDPOINT':
                                API_ENDPOINT = value
                            elif key == 'VITE_OPENAI_MODEL':
                                API_MODEL = value
                            # Also check non-prefixed versions
                            elif key == 'OPENAI_API_KEY' and not API_KEY:
                                API_KEY = value
                            elif key == 'OPENAI_API_ENDPOINT':
                                API_ENDPOINT = value
                            elif key == 'OPENAI_MODEL':
                                API_MODEL = value
            print(f"[Config] Loaded API settings from .env")
        except Exception as e:
            print(f"[Config] Could not load .env: {e}")

    # Try to start Node.js instead if available (better performance)
    if check_node():
        print("[Info] Node.js found! Try running START.bat or START.sh instead for better performance.")

    # Change to dist folder if it exists
    dist_path = os.path.join(os.path.dirname(__file__), 'dist')
    if os.path.exists(dist_path):
        os.chdir(dist_path)
        print(f"[Server] Serving files from: {dist_path}")
    else:
        # Serve from current directory
        print(f"[Server] Serving files from: {os.getcwd()}")

    # Check for API key
    if not API_KEY:
        print("[Warning] No API key configured!")
        print("[Warning] Set OPENAI_API_KEY environment variable or edit this file")
        print("[Warning] The app will show an error when trying to analyze words")

    print(f"[Server] API Endpoint: {API_ENDPOINT}")
    print(f"[Server] API Model: {API_MODEL}")
    print("")
    print("=" * 50)
    print("  LexiGraph Server")
    print("=" * 50)
    print(f"  Please visit: http://localhost:{PORT}")
    print("  Press Ctrl+C to stop server")
    print("=" * 50)
    print("")

    # Open browser
    webbrowser.open(f'http://localhost:{PORT}')

    # Start server
    with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[Server] Stopped")

if __name__ == '__main__':
    main()
