#!/usr/bin/env python3
"""Generate Hindi neural mantra recitations (Edge TTS Madhur / Swara)."""
from __future__ import annotations

import asyncio
import json
from pathlib import Path

import edge_tts

ROOT = Path("/workspace")
CATALOG = ROOT / "public/practices/deities.json"
OUT = [
    ROOT / "public/chants",
    ROOT / "docs/chants",
]

MALE = "hi-IN-MadhurNeural"
FEMALE = "hi-IN-SwaraNeural"

EXTRA = {
    "om": "ॐ",
    "gayatri": "ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्",
}


async def one(text: str, voice: str, dest: Path, rate: str, pitch: str) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(".tmp.mp3")
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await comm.save(str(tmp))
    tmp.replace(dest)
    print(f"ok {dest.relative_to(ROOT)} ({dest.stat().st_size}b)")


async def main() -> None:
    data = json.loads(CATALOG.read_text())
    jobs: dict[str, str] = {}
    for d in data.get("deities") or []:
        if d.get("id") and d.get("mantra"):
            jobs[d["id"]] = d["mantra"]
    jobs.update(EXTRA)

    # Shared mantra copies
    if "shiva" in jobs:
        jobs["shivling"] = jobs["shiva"]

    sem = asyncio.Semaphore(3)

    async def guarded(coro):
        async with sem:
            await coro

    tasks = []
    for did, mantra in jobs.items():
        text = mantra.strip() + "।"
        tasks.append(
            guarded(one(text, MALE, OUT[0] / "male" / f"{did}.mp3", "-12%", "-8Hz"))
        )
        tasks.append(
            guarded(one(text, FEMALE, OUT[0] / "female" / f"{did}.mp3", "-8%", "+1Hz"))
        )
    await asyncio.gather(*tasks)

    # Mirror into docs
    import shutil

    for gender in ("male", "female"):
        src = OUT[0] / gender
        dst = OUT[1] / gender
        dst.mkdir(parents=True, exist_ok=True)
        for f in src.glob("*.mp3"):
            shutil.copy2(f, dst / f.name)
    print("chants ready", sum(1 for _ in (OUT[0] / "male").glob("*.mp3")), "ids")


if __name__ == "__main__":
    asyncio.run(main())
