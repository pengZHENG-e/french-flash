#!/usr/bin/env python3
"""Fill vocabulary-extra.json to TARGET using MyMemory (fr→en) for lemmas; keep existing rows."""

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CANDIDATES = ROOT / "data/fr_frequency_candidates.txt"
OUT = ROOT / "data/vocabulary-extra.json"

CORE_FRENCH = {
    "bonjour", "merci", "maison", "manger", "beau", "belle", "travailler",
    "eau", "livre", "partir", "ville", "aimer", "vouloir", "avoir", "être",
    "soleil", "temps", "nuit", "savoir", "parler", "enfant", "argent",
    "voir", "faire", "pays", "ami", "amie",
}

TARGET = 1000
DELAY = 0.35
UA = "FrenchVocabApp/1.0 (educational)"


def translate(fr: str) -> str:
    q = urllib.parse.quote(fr[:450])
    url = f"https://api.mymemory.translated.net/get?q={q}&langpair=fr|en"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            data = json.loads(r.read().decode("utf-8"))
        t = (data.get("responseData") or {}).get("translatedText", "").strip()
        return t or fr
    except Exception:
        return fr


def entry_from_word(w: str, english: str) -> dict:
    eng = english.strip()
    if len(eng) > 95:
        eng = eng[:92] + "…"
    return {
        "french": w,
        "pronunciation": "—",
        "english": eng,
        "partOfSpeech": "other",
        "example": {
            "french": f"Le mot « {w} » est très courant.",
            "english": f"The word “{w}” is very common.",
        },
        "explanation": f"{eng} Mot fréquent issu de corpus de sous-titres. Sens contextuel à affiner.",
    }


def main():
    results = []
    if OUT.exists():
        try:
            results = json.loads(OUT.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            results = []
    have = {e["french"] for e in results}

    candidates = [
        w.strip() for w in CANDIDATES.read_text(encoding="utf-8").splitlines() if w.strip()
    ]

    for w in candidates:
        if len(results) >= TARGET:
            break
        if w.lower() in CORE_FRENCH or w in have:
            continue
        en = translate(w)
        results.append(entry_from_word(w, en))
        have.add(w)
        print(f"\r{len(results)} / {TARGET}  ({w})".ljust(50), end="", flush=True)
        time.sleep(DELAY)

    print(f"\nWriting {len(results)}")
    OUT.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
