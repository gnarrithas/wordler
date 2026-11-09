#!/usr/bin/env python3
"""Shuffle the solution list into the daily order, from a secret seed.

The deploy workflow runs this before the build, so the deployed
solutions.txt lists one word per day: line 0 is the first day's word.

The shuffle depends only on the seed and the set of words. It uses
HMAC-SHA256 in counter mode as its random stream and an exact rejection
sampler, never Python's `random` module, so it gives the same order on any
Python version.
"""

import argparse
import hashlib
import hmac
import logging
import os
import sys
from pathlib import Path

SEED_ENV = "SOLUTIONS_SHUFFLE_SEED"

log = logging.getLogger("shuffle_solutions")


class ByteStream:
    """Deterministic 64-bit integers: HMAC-SHA256(seed, counter) blocks."""

    def __init__(self, seed: bytes):
        self._seed = seed
        self._counter = 0
        self._buffer = b""

    def next_u64(self) -> int:
        if len(self._buffer) < 8:
            block = hmac.new(
                self._seed, self._counter.to_bytes(8, "big"), hashlib.sha256
            ).digest()
            self._counter += 1
            self._buffer += block
        value, self._buffer = self._buffer[:8], self._buffer[8:]
        return int.from_bytes(value, "big")

    def below(self, n: int) -> int:
        """Uniform integer in [0, n), without modulo bias."""
        if n <= 0:
            raise ValueError(f"n must be positive, got {n}")
        limit = (1 << 64) - ((1 << 64) % n)
        while True:
            value = self.next_u64()
            if value < limit:
                return value % n


def normalize(lines):
    """Lowercased, trimmed, deduplicated and sorted words."""
    return sorted({line.strip().lower() for line in lines if line.strip()})


def shuffle(words, seed: str):
    """Fisher-Yates shuffle of the normalized words, driven by the seed."""
    if not seed:
        raise ValueError("the seed is empty")
    order = normalize(words)
    stream = ByteStream(seed.encode("utf-8"))
    for i in range(len(order) - 1, 0, -1):
        j = stream.below(i + 1)
        order[i], order[j] = order[j], order[i]
    return order


def parse_args(argv):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("input", type=Path, help="solution list, one word per line")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="where to write the daily order (default: overwrite the input)",
    )
    return parser.parse_args(argv)


def main(argv=None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    args = parse_args(argv)
    # Read from the environment so the secret never shows in argv or logs.
    seed = os.environ.get(SEED_ENV, "")
    if not seed:
        log.error("%s is not set or empty", SEED_ENV)
        return 1
    try:
        words = args.input.read_text(encoding="utf-8").splitlines()
    except OSError as err:
        log.error("cannot read %s: %s", args.input, err)
        return 1
    order = shuffle(words, seed)
    if not order:
        log.error("%s has no words", args.input)
        return 1
    output = args.output or args.input
    try:
        output.write_text("\n".join(order) + "\n", encoding="utf-8")
    except OSError as err:
        log.error("cannot write %s: %s", output, err)
        return 1
    log.info("wrote %d words in daily order to %s", len(order), output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
