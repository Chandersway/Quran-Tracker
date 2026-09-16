package com.Ameender.qurantracker.data

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

/** Room runs this copy in a transaction. IDs, formatting and content are preserved. */
val NOTE_SCOPES_MIGRATION = object : Migration(16, 17) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE ayah_notes_scoped (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                surahId INTEGER, surahName TEXT NOT NULL, ayahNumber INTEGER,
                scopeType TEXT NOT NULL DEFAULT 'ayah',
                juzNumber INTEGER, hizbNumber INTEGER, rubNumber INTEGER,
                title TEXT NOT NULL, note TEXT NOT NULL, folder TEXT NOT NULL, tags TEXT NOT NULL,
                fontSize INTEGER NOT NULL, headingLevel INTEGER NOT NULL,
                isBold INTEGER NOT NULL, isItalic INTEGER NOT NULL, isUnderline INTEGER NOT NULL,
                isStrike INTEGER NOT NULL, listMode TEXT NOT NULL, textColorKey TEXT NOT NULL,
                formatSpans TEXT NOT NULL, isPinned INTEGER NOT NULL, updatedAt INTEGER NOT NULL
            )
        """.trimIndent())
        val legacyColumns = "id,surahId,surahName,ayahNumber,title,note,folder,tags,fontSize,headingLevel," +
            "isBold,isItalic,isUnderline,isStrike,listMode,textColorKey,formatSpans,isPinned,updatedAt"
        db.execSQL("INSERT INTO ayah_notes_scoped ($legacyColumns,scopeType) SELECT $legacyColumns,'ayah' FROM ayah_notes")
        db.execSQL("DROP TABLE ayah_notes")
        db.execSQL("ALTER TABLE ayah_notes_scoped RENAME TO ayah_notes")
        db.execSQL("CREATE INDEX index_ayah_notes_surahId_ayahNumber ON ayah_notes(surahId,ayahNumber)")
        listOf("juzNumber", "hizbNumber", "rubNumber", "surahId").forEach { column ->
            db.execSQL("CREATE INDEX index_ayah_notes_scopeType_$column ON ayah_notes(scopeType,$column)")
        }
    }
}
