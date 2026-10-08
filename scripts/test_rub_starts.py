"""Offline regression tests; no Android runtime or network needed."""
import unittest
from build_rub_starts import build, array


class RubStartsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data, cls.report = build()

    def test_each_hizb_has_four_ordered_quarters(self):
        for entries in self.data['editions'].values():
            self.assertEqual(list(range(1, 241)), [r['id'] for r in entries])
            for hizb in range(1, 61):
                self.assertEqual([1, 2, 3, 4], [r['quarter'] for r in entries if r['hizb'] == hizb])

    def test_known_source_conflicts_stay_quarantined(self):
        self.assertEqual(104, len(self.report['crossEditionDifferences']))
        self.assertFalse(self.data['editionStatus']['warsh']['readyForNavigation'])
        self.assertEqual(240, len(self.report['hafsAlignedWarshCandidates']))
        self.assertFalse(any(r['approved'] for r in self.report['hafsAlignedWarshCandidates']))

    def test_hafs_matches_existing_hizb_starts(self):
        self.assertFalse(any(r['edition'] == 'hafs' for r in self.report['existingHizbDifferences']))

    def test_parser_rejects_executable_or_missing_data(self):
        for source in ['export const X = [1, evil()]', 'export const Y = [1,2]']:
            with self.assertRaises(ValueError):
                array(source, 'X')


if __name__ == '__main__':
    unittest.main()
