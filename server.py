
import http.server
import socketserver
import json
import os
from datetime import datetime

PORT = 8000
DATA_DIR = 'data'
COMMENTS_FILE = os.path.join(DATA_DIR, 'comments.txt')
EMAILS_FILE = os.path.join(DATA_DIR, 'emails.txt')

# Ensure data directory exists
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

class MyRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/comment':
            self.handle_comment()
        elif self.path == '/api/subscribe':
            self.handle_subscribe()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_comment(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            message = data.get('message', '')
            language = data.get('language', 'unknown')
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            entry = f"[{timestamp}] [{language}] Comment: {message}\n"
            
            with open(COMMENTS_FILE, 'a', encoding='utf-8') as f:
                f.write(entry)
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status": "success"}')
            
        except Exception as e:
            print(f"Error handling comment: {e}")
            self.send_error(500, "Internal Server Error")

    def handle_subscribe(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            email = data.get('email', '')
            language = data.get('language', 'unknown')
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            entry = f"[{timestamp}] [{language}] Email: {email}\n"
            
            with open(EMAILS_FILE, 'a', encoding='utf-8') as f:
                f.write(entry)
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status": "success"}')
            
        except Exception as e:
            print(f"Error handling subscribe: {e}")
            self.send_error(500, "Internal Server Error")
    
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type")
        self.end_headers()

    def end_headers(self):
        # Enable CORS for all responses to allow testing from file:// if needed (Chrome blocks this often though)
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

print(f"Serving at http://localhost:{PORT}")
with socketserver.TCPServer(("", PORT), MyRequestHandler) as httpd:
    httpd.serve_forever()
