import json
import threading
import time
import urllib.request
import unittest

from brasilidade.web import run_server


class TestWebAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.port = 8888
        cls.server_thread = threading.Thread(
            target=run_server, args=("127.0.0.1", cls.port), daemon=True
        )
        cls.server_thread.start()
        time.sleep(0.5)

    def test_get_categories_endpoint(self):
        url = f"http://127.0.0.1:{self.port}/api/quiz/categories"
        req = urllib.request.urlopen(url)
        self.assertEqual(req.status, 200)
        data = json.loads(req.read().decode("utf-8"))
        self.assertIn("categories", data)
        self.assertIn("Música", data["categories"])

    def test_get_quiz_endpoint(self):
        url = f"http://127.0.0.1:{self.port}/api/quiz?limit=3"
        req = urllib.request.urlopen(url)
        self.assertEqual(req.status, 200)
        data = json.loads(req.read().decode("utf-8"))
        self.assertEqual(data["total"], 3)
        self.assertEqual(len(data["questions"]), 3)
        # Ensure correct_index is hidden in GET response
        self.assertNotIn("correct_index", data["questions"][0])

    def test_post_quiz_submit_endpoint(self):
        url = f"http://127.0.0.1:{self.port}/api/quiz/submit"
        payload = json.dumps({"answers": [{"question_id": 1, "selected_index": 0}]}).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        response = urllib.request.urlopen(req)
        self.assertEqual(response.status, 200)
        data = json.loads(response.read().decode("utf-8"))
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["correct_answers"], 1)
        self.assertEqual(data["score_percentage"], 100.0)

    def test_search_endpoint(self):
        url = f"http://127.0.0.1:{self.port}/api/search?q=feijoada"
        req = urllib.request.urlopen(url)
        self.assertEqual(req.status, 200)
        data = json.loads(req.read().decode("utf-8"))
        self.assertEqual(len(data["results"]), 1)
        self.assertEqual(data["results"][0]["id"], "feijoada")


if __name__ == "__main__":
    unittest.main()
