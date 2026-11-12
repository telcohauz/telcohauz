import datetime as dt
import unittest
from engine import choose, safe_source, parse_date, resolved_slot, script_card

class NewsEngineTests(unittest.TestCase):
    def setUp(self):
        self.date = dt.date(2026, 11, 13)
        self.items = [
            {"id": str(i), "published_at": f"2026-11-{10+i:02d}T00:00:00+00:00",
             "title": "AI update", "source": "Example", "publish_allowed": False}
            for i in range(3)
        ]
    def test_allowlist_blocks_untrusted_feed(self):
        self.assertTrue(safe_source({"url": "https://blog.google/technology/ai/rss/"}))
        self.assertFalse(safe_source({"url": "http://blog.google/technology/ai/rss/"}))
        self.assertFalse(safe_source({"url": "https://malicious.example/rss"}))
    def test_slots_pick_different_items(self):
        self.assertNotEqual(choose(self.items, self.date, "midday")["id"],
                            choose(self.items, self.date, "evening")["id"])
    def test_never_sets_publish_allowed(self):
        card = script_card(choose(self.items, self.date, "midday"))
        self.assertIn("JANGAN TERBIT", " ".join(card))
    def test_parse_date(self):
        self.assertEqual(parse_date("Thu, 12 Nov 2026 00:00:00 GMT").year, 2026)
        self.assertIsNone(parse_date("not a date"))
    def test_auto_slot(self):
        self.assertEqual(resolved_slot("auto", dt.datetime(2026, 11, 13, 12, 15)), "midday")
        self.assertEqual(resolved_slot("auto", dt.datetime(2026, 11, 13, 20, 15)), "evening")
    def test_empty_feed_fails_closed(self):
        with self.assertRaises(ValueError):
            choose([], self.date, "evening")

if __name__ == "__main__":
    unittest.main()
