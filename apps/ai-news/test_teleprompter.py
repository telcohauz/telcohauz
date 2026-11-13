import unittest
from teleprompter import build, render_script, render_srt

class TeleprompterTests(unittest.TestCase):
    def setUp(self):
        self.record = {"story": {
            "title": "AI technology test story",
            "source": "Official technology publisher",
            "url": "https://example.org/news"
        }}
    def test_unverified_headline_never_publish(self):
        p=build(self.record)
        self.assertFalse(p["publish_allowed"])
        self.assertEqual(p["scenes"][0]["shot"], "REVIEW_BANNER")
        self.assertIn("HOST", [s["shot"] for s in p["scenes"]])
    def test_full_sources_rights_and_owner_review(self):
        x={**self.record,
           "verified_facts":[
               {"fact":"Fact one", "source_url":"https://example.org/a", "checked_by_editor":True},
               {"fact":"Fact two", "source_url":"https://example.org/b", "checked_by_editor":True}],
           "demo_footage_rights_cleared":True,
           "owner_approved":True}
        p=build(x)
        self.assertTrue(p["publish_allowed"])
        self.assertEqual([s["shot"] for s in p["scenes"]],
                         ["BRAND_INTRO","HOST","B_ROLL","HOST","REAL_DEMO","HOST","OUTRO"])
    def test_unverified_facts_are_excluded(self):
        x={**self.record,"verified_facts":[{"fact":"Fabricated claim","source_url":"http://insecure.example","checked_by_editor":True}]}
        self.assertNotIn("Fabricated claim", render_script(build(x)))
    def test_srt_emits_sections(self):
        self.assertIn("-->", render_srt(build(self.record)))
        self.assertIn("AI.NEWS", render_script(build(self.record)))
    def test_no_title_fails(self):
        with self.assertRaises(ValueError):
            build({"story": {"source":"Source"}})

if __name__=="__main__":
    unittest.main()
