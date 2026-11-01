import os
import tempfile
import time
import unittest
from br_feriado_checker.cache import CacheManager


class TestCacheManager(unittest.TestCase):

    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.cache_file = os.path.join(self.tmp_dir.name, "test_cache.json")
        self.cache = CacheManager(cache_file=self.cache_file, default_ttl=10)

    def tearDown(self):
        self.tmp_dir.cleanup()

    def test_set_and_get(self):
        self.cache.set("key1", {"data": 123})
        val = self.cache.get("key1")
        self.assertEqual(val, {"data": 123})

    def test_get_nonexistent(self):
        self.assertIsNone(self.cache.get("nonexistent"))

    def test_ttl_expiration(self):
        # Set with TTL of 1 second
        self.cache.set("short_key", "val", ttl=1)
        self.assertEqual(self.cache.get("short_key"), "val")
        time.sleep(1.1)
        # Should be expired now
        self.assertIsNone(self.cache.get("short_key"))
        # But ignore_ttl=True returns expired value
        self.assertEqual(self.cache.get("short_key", ignore_ttl=True), "val")

    def test_delete(self):
        self.cache.set("key2", "val2")
        self.assertEqual(self.cache.get("key2"), "val2")
        self.cache.delete("key2")
        self.assertIsNone(self.cache.get("key2"))

    def test_clear(self):
        self.cache.set("k1", "v1")
        self.cache.set("k2", "v2")
        self.cache.clear()
        self.assertIsNone(self.cache.get("k1"))
        self.assertIsNone(self.cache.get("k2"))


if __name__ == "__main__":
    unittest.main()
