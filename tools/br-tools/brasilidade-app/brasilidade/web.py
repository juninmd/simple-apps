"""
Web server for Brasilidade encyclopedia and quiz application.
Provides REST API endpoints and serves static web app files.
"""

import json
import os
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
from typing import Dict, Any

from .data import ENCYCLOPEDIA_DATA
from .quiz import QuizEngine

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
quiz_engine = QuizEngine()


class BrasilidadeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/quiz":
            self._handle_get_quiz(parsed.query)
        elif path == "/api/quiz/categories":
            self._handle_get_categories()
        elif path == "/api/search":
            self._handle_get_search(parsed.query)
        elif path == "/api/encyclopedia":
            self._send_json(ENCYCLOPEDIA_DATA)
        else:
            # Fallback to serving static files (index.html, css, js)
            if path == "/" or path == "":
                self.path = "/index.html"
            super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/quiz/submit":
            self._handle_post_quiz_submit()
        else:
            self._send_error(404, "Endpoint not found")

    def _handle_get_quiz(self, query_string: str):
        params = urllib.parse.parse_qs(query_string)
        category = params.get("category", [None])[0]
        limit_val = params.get("limit", [None])[0]
        limit = int(limit_val) if limit_val and limit_val.isdigit() else None

        try:
            session = quiz_engine.create_session(category=category, limit=limit, shuffle=True)
            # Hide correct answer index from frontend GET request to prevent cheating
            questions_payload = [q.to_dict(include_answer=False) for q in session.questions]
            self._send_json({
                "total": len(questions_payload),
                "questions": questions_payload
            })
        except ValueError as err:
            self._send_json({"error": str(err)}, status_code=400)

    def _handle_get_categories(self):
        categories = quiz_engine.get_categories()
        self._send_json({"categories": categories})

    def _handle_get_search(self, query_string: str):
        params = urllib.parse.parse_qs(query_string)
        q = params.get("q", [""])[0].strip().lower()

        if not q:
            results = ENCYCLOPEDIA_DATA
        else:
            results = [
                item for item in ENCYCLOPEDIA_DATA
                if q in item["title"].lower()
                or q in item["description"].lower()
                or q in item["category"].lower()
                or any(q in tag for tag in item.get("tags", []))
            ]

        self._send_json({"query": q, "results": results})

    def _handle_post_quiz_submit(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len) if content_len > 0 else b"{}"
        try:
            data = json.loads(body.decode("utf-8"))
            answers = data.get("answers", [])  # list of {"question_id": int, "selected_index": int}

            details = []
            correct_count = 0
            for ans in answers:
                q_id = ans.get("question_id")
                sel_idx = ans.get("selected_index")
                q_obj = next((q for q in quiz_engine.questions if q.id == q_id), None)
                if q_obj:
                    is_correct = (sel_idx == q_obj.correct_index)
                    if is_correct:
                        correct_count += 1
                    details.append({
                        "id": q_obj.id,
                        "question": q_obj.question,
                        "category": q_obj.category,
                        "selected_index": sel_idx,
                        "correct_index": q_obj.correct_index,
                        "is_correct": is_correct,
                        "explanation": q_obj.explanation
                    })

            total = len(details)
            score_percentage = round((correct_count / total * 100), 1) if total > 0 else 0.0

            self._send_json({
                "total": total,
                "correct_answers": correct_count,
                "score_percentage": score_percentage,
                "details": details
            })
        except Exception as e:
            self._send_json({"error": f"Invalid submission: {str(e)}"}, status_code=400)

    def _send_json(self, data: Any, status_code: int = 200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)


def run_server(host: str = "0.0.0.0", port: int = 8000) -> None:
    os.makedirs(STATIC_DIR, exist_ok=True)
    server_address = (host, port)
    httpd = HTTPServer(server_address, BrasilidadeHandler)
    print(f"🇧🇷 Servidor Brasilidade rodando em http://{host}:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor finalizado.")


if __name__ == "__main__":
    run_server()
