"""Verify the actual 17 -> 18 SQL against exported Room schemas in an isolated SQLite database."""
import json
import re
import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
schemas = root / "app/schemas/com.Ameender.qurantracker.data.QuranDatabase"
before = json.loads((schemas / "17.json").read_text(encoding="utf-8"))["database"]
after = json.loads((schemas / "18.json").read_text(encoding="utf-8"))["database"]
db = sqlite3.connect(":memory:")
for entity in before["entities"]:
    table = entity["tableName"]
    db.execute(entity["createSql"].replace("${TABLE_NAME}", table))
    for index in entity.get("indices", []):
        db.execute(index["createSql"].replace("${TABLE_NAME}", table))
db.execute("INSERT INTO daily_goal VALUES (1, 'pages', 2, 8, 30)")
db.execute("""INSERT INTO reading_history
    (id,surahId,surahName,type,action,extraInfo,timestamp,dateKey)
    VALUES (1,1,'Existing reading','juz','read','',100,'2026-09-07')""")
db.execute("""INSERT INTO planning_items
    (id,date,type,referenceId,subId,displayName,arabicText,isDone,historyLogged,reminderHour,reminderMinute,createdAt)
    VALUES (1,'2026-09-07','khatma',1,8,'Khatma test','Lees Juz 1',1,1,NULL,NULL,100)""")
db.execute("""INSERT INTO reading_history
    (id,surahId,surahName,type,action,extraInfo,timestamp,dateKey)
    VALUES (2,1,'Khatma test','khatma','read','Lees Juz 1',100,'2026-09-07')""")
source = (root / "app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt").read_text(encoding="utf-8")
section = source.split("object : Migration(17, 18)", 1)[1].split("object : Migration(18, 19)", 1)[0]
statements = re.findall(r'db\.execSQL\((?:"""([\s\S]*?)"""|"([^"\n]*)")\)', section)
assert len(statements) == 8, len(statements)
for multi, single in statements:
    db.execute(multi or single)
for entity in after["entities"]:
    table = entity["tableName"]
    actual = {row[1]: row for row in db.execute('PRAGMA table_info("' + table + '")')}
    assert set(actual) == {field["columnName"] for field in entity["fields"]}, table
    for field in entity["fields"]:
        row = actual[field["columnName"]]
        assert row[2] == field["affinity"], (table, field, row)
        assert bool(row[3]) == field.get("notNull", False), (table, field, row)
        assert row[4] == field.get("defaultValue"), (table, field, row)
    keys = [row[1] for row in sorted(actual.values(), key=lambda row: row[5]) if row[5]]
    assert keys == entity["primaryKey"]["columnNames"], (table, keys)
    actual_indices = {row[1]: row for row in db.execute('PRAGMA index_list("' + table + '")')}
    for index in entity.get("indices", []):
        assert index["name"] in actual_indices, index
        assert bool(actual_indices[index["name"]][2]) == index["unique"]
assert db.execute("SELECT unit,target,reminderHour,reminderMinute FROM daily_goal").fetchone() == ("pages",2,8,30)
assert db.execute("SELECT count(*) FROM reading_history").fetchone()[0] == 2
assert db.execute("SELECT type,amount FROM reading_history WHERE id=2").fetchone() == ("rub",8)
assert db.execute("SELECT type,amount,sourceKey FROM reading_history WHERE id=1").fetchone() == ("juz",1,None)
db.execute("UPDATE reading_history SET sourceKey='planning:1' WHERE id=2")
try:
    db.execute("UPDATE reading_history SET sourceKey='planning:1' WHERE id=1")
    raise AssertionError("Duplicate activity source accepted")
except sqlite3.IntegrityError:
    pass

# Continue through the migration used by devices that already have the previous build.
latest = json.loads((schemas / "19.json").read_text(encoding="utf-8"))["database"]
section = source.split("object : Migration(18, 19)", 1)[1].split("private fun migration", 1)[0]
statements = re.findall(r'db\.execSQL\((?:"""([\s\S]*?)"""|"([^"\n]*)")\)', section)
assert len(statements) == 2, len(statements)
for multi, single in statements:
    db.execute(multi or single)
for entity in latest["entities"]:
    table = entity["tableName"]
    actual = {row[1]: row for row in db.execute('PRAGMA table_info("' + table + '")')}
    assert set(actual) == {field["columnName"] for field in entity["fields"]}, table
assert db.execute("SELECT contentType FROM reading_history WHERE id=1").fetchone() == ("juz",)
assert db.execute("SELECT contentType FROM reading_history WHERE id=2").fetchone() == ("rub",)
print("PASS: migrations match Room 18/19, preserve existing data and reject duplicate activity sources.")
