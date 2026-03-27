#!/usr/bin/env python3
"""Build data/vocabulary-extra.json from Wiktionary (English) French entries + IPA."""

import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional

ROOT = Path(__file__).resolve().parent.parent
CANDIDATES = ROOT / "data/fr_frequency_candidates.txt"
OUT = ROOT / "data/vocabulary-extra.json"

CORE_FRENCH = {
    "bonjour", "merci", "maison", "manger", "beau", "belle", "travailler",
    "eau", "livre", "partir", "ville", "aimer", "vouloir", "avoir", "être",
    "soleil", "temps", "nuit", "savoir", "parler", "enfant", "argent",
    "voir", "faire", "pays", "ami", "amie",
}

DELAY_MS = 150
UA = "FrenchVocabApp/1.0 (educational; local build)"
TARGET_COUNT = 1000


def fetch_json(url: str):
    for attempt in range(5):
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=45) as r:
                body = r.read().decode("utf-8")
                if r.status != 200:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                return json.loads(body)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(5 * (attempt + 1))
            else:
                time.sleep(0.8 * (attempt + 1))
        except Exception:
            time.sleep(0.8 * (attempt + 1))
    return None


def strip_html(html: str) -> str:
    if not html:
        return ""
    s = re.sub(r"<[^>]+>", "", html)
    s = s.replace("&nbsp;", " ")
    s = re.sub(r"&#\d+;", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def shorten_english(raw: str) -> str:
    s = strip_html(raw)
    s = re.sub(r"\s*\([^)]{80,}\)", "", s)
    parts = re.split(r"[.;]", s, maxsplit=1)
    s = (parts[0] or s).strip()
    if len(s) > 90:
        s = s[:87] + "…"
    return s or raw


def map_pos(api_pos: str) -> str:
    p = (api_pos or "").lower()
    if "noun" in p:
        return "noun"
    if "verb" in p:
        return "verb"
    if "adj" in p:
        return "adjective"
    if "adv" in p:
        return "adverb"
    if "prep" in p:
        return "preposition"
    if "pron" in p:
        return "pronoun"
    if "conj" in p:
        return "conjunction"
    if "det" in p:
        return "determiner"
    if "article" in p:
        return "article"
    if "interj" in p:
        return "exclamation"
    return "other"


def build_entry(word: str) -> Optional[Dict[str, Any]]:
    title = urllib.parse.quote(word, safe="")
    url = f"https://en.wiktionary.org/api/rest_v1/page/definition/{title}"
    data = fetch_json(url)
    if not data or "fr" not in data or not data["fr"]:
        return None

    english = ""
    part_of_speech = "other"
    example_fr = ""
    example_en = ""

    for block in data["fr"]:
        if block.get("language") and block["language"] != "French":
            continue
        part_of_speech = map_pos(block.get("partOfSpeech", ""))
        for defn in block.get("definitions") or []:
            d = strip_html(defn.get("definition") or "")
            if len(d) < 2:
                continue
            english = shorten_english(defn.get("definition") or "")
            parsed = (defn.get("parsedExamples") or [{}])[0]
            if isinstance(parsed, dict) and parsed.get("example"):
                example_fr = strip_html(parsed["example"])
                example_en = strip_html(parsed.get("translation") or "")
            break
        else:
            continue
        break

    if not english:
        return None

    # Skip a second Wiktionary request for IPA (add in-editor later if desired).
    ipa = "—"

    if not example_fr:
        example_fr = f"Contexte : {word}."
        example_en = english
    if not example_en:
        example_en = english

    explanation = f"{english} Très fréquent à l’oral et à l’écrit."

    return {
        "french": word,
        "pronunciation": ipa,
        "english": english,
        "partOfSpeech": part_of_speech,
        "example": {"french": example_fr, "english": example_en},
        "explanation": explanation,
    }


def main():
    candidates = [
        w.strip() for w in CANDIDATES.read_text(encoding="utf-8").splitlines() if w.strip()
    ]
    results: list = []
    if OUT.exists():
        try:
            results = json.loads(OUT.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            results = []
    have_fr = {e["french"] for e in results}
    seen: set = set(have_fr)

    for w in candidates:
        if w.lower() in CORE_FRENCH or w in seen:
            continue
        seen.add(w)
        try:
            entry = build_entry(w)
            if entry:
                results.append(entry)
                have_fr.add(w)
                print(f"\r{len(results)} / {TARGET_COUNT}  ({w})".ljust(55), end="", flush=True)
            if len(results) >= TARGET_COUNT:
                break
        except Exception as e:
            print(f"\nfail {w}: {e}")
        time.sleep(DELAY_MS / 1000)

    print(f"\nWriting {len(results)} entries")
    OUT.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
