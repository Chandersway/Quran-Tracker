"""Read-only differential check against the sibling Kotlin content sources."""
import hashlib
import json
from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT.parent / "app/src/main/assets"
GENERATED = ROOT / "src/content/generated"


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def identical(source, target):
    assert digest(source) == digest(target), f"Different source bytes: {target}"


def readonly(path):
    return sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)


summary = {"mutation": "none; original content opened read-only", "checks": {}}
for name in ["rub_starts.json", "warsh_rub_starts.json", "warsh_ayah_map.json", "warsh_maknoon_positions.json", "mutashabiha_data.json"]:
    identical(SOURCE / name, GENERATED / name)
summary["checks"]["verbatim_reference_files"] = 5
for name in ["Quraan.db", "books/books.db"]:
    identical(SOURCE / name, ROOT / "assets" / Path(name).name)
summary["checks"]["verbatim_databases"] = 2

translations = {}
for language, name in [("en", "en_sahih.json"), ("nl", "nl_siregar.json")]:
    identical(SOURCE / "translations" / name, ROOT / "assets/translations" / name)
    translations[language] = {(row["surah"], row["ayah"]): row["text"] for row in read(SOURCE / "translations" / name)}
summary["checks"]["verbatim_translations"] = {language: len(rows) for language, rows in translations.items()}

ayahs = 0
words = 0
catalog_entries = 0
catalogs = {}
with readonly(SOURCE / "Quraan.db") as db:
    for surah in range(1, 115):
        original_ayahs = dict(db.execute('SELECT AYA_num, AYA FROM "ALL" WHERE SURA_num=? ORDER BY AYA_num', (surah,)))
        current = read(GENERATED / f"surah-{surah}.json")
        assert len(current) == len(original_ayahs)
        for row in current:
            assert row["text"] == original_ayahs[row["number"]], f"Arabic text {surah}:{row['number']}"
            for language in translations:
                assert row[language] == translations[language][(surah, row["number"])], f"Translation {language} {surah}:{row['number']}"
        ayahs += len(current)
        original_words = {row["ayah"]: row for row in read(SOURCE / f"word_by_word_surah_{surah}.json")}
        study = read(ROOT / "src/content/study-details" / f"surah-{surah}.quran")
        assert len(study) == len(current)
        for row in study:
            original = original_words.get(row["number"], {})
            assert row["words"] == original.get("words", [])
            assert row["irab"] == original.get("e3rab", "")
            words += len(row["words"])
        audio = read(ROOT / "src/content/audio" / f"surah_{surah}.quran")
        assert audio == read(SOURCE / f"audio_surah_{surah}.json")
        catalogs[surah] = audio
        catalog_entries += len(audio)
summary["checks"].update({"canonical_ayahs_and_both_translations": ayahs, "study_surahs": 114, "source_words": words, "audio_catalogs": 114, "audio_options": catalog_entries})
summary["checks"]["audio_next_surah_missing_reciter_ids"] = sum(1 for surah in range(1, 114) for row in catalogs[surah] if not any(next_row["id"] == row["id"] for next_row in catalogs[surah + 1]))

reader = (ROOT.parent / "app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt").read_text(encoding="utf-8")
ranges = read(GENERATED / "page-ranges.json")
for edition, prefix, count, method in [("hafs", "hafs_madina_page", 604, "hafsMadinaPagesForSurah"), ("muhammadi", "warsh_page", 638, "warshPagesForSurah")]:
    for page in range(1, count + 1):
        name = f"{prefix}_{page:03}.png"
        identical(ROOT.parent / "app/src/main/res/drawable" / name, ROOT / "assets/mushaf" / name)
    block = reader.split(f"fun {method}(")[1].split("else -> IntRange.EMPTY")[0]
    expected = {surah: [int(first), int(last)] for surah, first, last in re.findall(r"(\d+)\s*->\s*(\d+)\.\.(\d+)", block)}
    assert ranges[edition] == expected
for name in read(ROOT / "assets/surah-cards/provenance.json")["files"]:
    identical(ROOT.parent / "app/src/main/res/drawable" / name, ROOT / "assets/surah-cards" / name)
summary["checks"].update({"verbatim_original_page_images": 1242, "verbatim_surah_cards": 114, "source_page_range_maps": 2})

positions = {}
with readonly(SOURCE / "hafs_ayahinfo_1260.db") as db:
    for page, surah, ayah, line, x1, y1, x2, y2 in db.execute("SELECT page_number,sura_number,ayah_number,line_number,MIN(min_x),MIN(min_y),MAX(max_x),MAX(max_y) FROM glyphs GROUP BY page_number,sura_number,ayah_number,line_number ORDER BY page_number,sura_number,ayah_number,line_number"):
        positions.setdefault(str(page), []).append([surah, ayah, round(x1 / 1260, 7), round(y1 / 1834, 7), round((x2 - x1) / 1260, 7), round((y2 - y1) / 1834, 7)])
assert read(GENERATED / "hafs-positions.json") == positions
coordinate = (SOURCE / "coordinate_muhammadi.js").read_text(encoding="utf-8")
assert read(GENERATED / "muhammadi-positions.json") == json.loads(re.search(r"(\[.*\])", coordinate, re.S).group(1))
summary["checks"].update({"verified_hafs_geometry_pages": len(positions), "verified_muhammadi_coordinate_source": True})
with readonly(ROOT / "assets/books.db") as db:
    summary["checks"]["book_pages"] = dict(db.execute("SELECT book_id,COUNT(*) FROM pages GROUP BY book_id"))
    summary["checks"]["book_chapters"] = dict(db.execute("SELECT book_id,COUNT(*) FROM chapters GROUP BY book_id"))
summary["checks"]["original_database_sha256"] = {name: digest(SOURCE / name) for name in ["Quraan.db", "books/books.db"]}
report = json.dumps(summary, indent=2) + "\n"
Path(__file__).with_suffix(".json").write_text(report, encoding="utf-8")
print(report, end="")
