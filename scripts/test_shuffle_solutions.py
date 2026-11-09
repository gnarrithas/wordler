#!/usr/bin/env python3
"""Pins the shuffle: a change here would reorder every deployed daily word."""

import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import shuffle_solutions as s

WORDS = ["delta", "alpha", "Charlie", "bravo", "echo", "foxtrot", "golf", "hotel"]


class ShuffleTest(unittest.TestCase):
    def test_stream_is_hmac_sha256_counter_mode(self):
        # First value cross-checked with: openssl dgst -sha256 -mac HMAC.
        stream = s.ByteStream(b"test-seed")
        self.assertEqual(
            [stream.next_u64() for _ in range(3)],
            [11957243613851627194, 3755087740879313799, 18115887728204555026],
        )

    def test_golden_order(self):
        self.assertEqual(
            s.shuffle(WORDS, "test-seed"),
            ["alpha", "foxtrot", "delta", "bravo", "golf", "echo", "hotel", "charlie"],
        )

    def test_input_order_case_and_duplicates_do_not_matter(self):
        messy = list(reversed(WORDS)) + ["  ALPHA ", "", "echo"]
        self.assertEqual(s.shuffle(messy, "test-seed"), s.shuffle(WORDS, "test-seed"))

    def test_seed_changes_the_order(self):
        self.assertNotEqual(s.shuffle(WORDS, "test-seed"), s.shuffle(WORDS, "other"))

    def test_below_rejects_non_positive_and_stays_in_range(self):
        stream = s.ByteStream(b"x")
        with self.assertRaises(ValueError):
            stream.below(0)
        self.assertTrue(all(0 <= stream.below(7) < 7 for _ in range(1000)))

    def test_empty_seed_is_refused(self):
        with self.assertRaises(ValueError):
            s.shuffle(WORDS, "")

    def test_main_rewrites_the_file_and_requires_the_seed(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "solutions.txt"
            path.write_text("\n".join(WORDS))
            with mock.patch.dict(os.environ, {s.SEED_ENV: ""}):
                self.assertEqual(s.main([str(path)]), 1)
            with mock.patch.dict(os.environ, {s.SEED_ENV: "test-seed"}):
                self.assertEqual(s.main([str(path)]), 0)
            self.assertEqual(
                path.read_text(),
                "\n".join(s.shuffle(WORDS, "test-seed")) + "\n",
            )


if __name__ == "__main__":
    unittest.main()
