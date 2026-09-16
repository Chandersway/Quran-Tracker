package com.Ameender.qurantracker.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [
        QuranProgress::class,
        ReadingHistory::class,
        DailyGoal::class,
        GoalDay::class,
        PlanningItem::class,
        ReadingJourney::class,
        AyahNote::class
    ],
    version = 19,
    exportSchema = true
)
abstract class QuranDatabase : RoomDatabase() {

    abstract fun quranDao(): QuranDao
    abstract fun readingHistoryDao(): ReadingHistoryDao
    abstract fun dailyGoalDao(): DailyGoalDao
    abstract fun goalDayDao(): GoalDayDao
    abstract fun planningItemDao(): PlanningItemDao
    abstract fun readingJourneyDao(): ReadingJourneyDao
    abstract fun ayahNoteDao(): AyahNoteDao

    companion object {
        @Volatile
        private var INSTANCE: QuranDatabase? = null

        fun getDatabase(context: Context): QuranDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    QuranDatabase::class.java,
                    "quran_database"
                )
                    .addMigrations(*ALL_MIGRATIONS)
                    .build()
                INSTANCE = instance
                instance
            }
        }

        private val ALL_MIGRATIONS = arrayOf(
            migration(1, 2),
            migration(2, 3),
            migration(3, 4),
            migration(4, 5),
            migration(5, 6),
            migration(6, 7),
            migration(7, 8),
            migration(8, 9),
            migration(9, 10),
            migration(10, 11),
            migration(11, 12),
            migration(12, 13),
            migration(13, 14),
            migration(14, 15),
            migration(15, 16),
            NOTE_SCOPES_MIGRATION,
            object : Migration(17, 18) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    db.execSQL("ALTER TABLE reading_history ADD COLUMN amount INTEGER NOT NULL DEFAULT 1")
                    db.execSQL("ALTER TABLE reading_history ADD COLUMN sourceKey TEXT")
                    db.execSQL("CREATE UNIQUE INDEX index_reading_history_sourceKey ON reading_history(sourceKey)")
                    db.execSQL("CREATE TABLE goal_days (goalId INTEGER NOT NULL, date TEXT NOT NULL, unit TEXT NOT NULL, target INTEGER NOT NULL, extra INTEGER NOT NULL, resolution TEXT NOT NULL, PRIMARY KEY(goalId, date))")
                    db.execSQL("ALTER TABLE planning_items ADD COLUMN goalId INTEGER NOT NULL DEFAULT 1")
                    db.execSQL("ALTER TABLE planning_items ADD COLUMN amount INTEGER NOT NULL DEFAULT 1")
                    db.execSQL("ALTER TABLE planning_items ADD COLUMN measurementUnit TEXT NOT NULL DEFAULT ''")
                    db.execSQL("""UPDATE reading_history SET amount = (
                        SELECT MAX(1, MIN(240, p.subId - p.referenceId + 1)) FROM planning_items p
                        WHERE p.type = 'khatma' AND p.displayName = reading_history.surahName
                        AND p.date = reading_history.dateKey LIMIT 1), type = 'rub'
                        WHERE type = 'khatma' AND EXISTS (SELECT 1 FROM planning_items p
                        WHERE p.type = 'khatma' AND p.displayName = reading_history.surahName AND p.date = reading_history.dateKey)
                    """)
                }
            },
            object : Migration(18, 19) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    db.execSQL("ALTER TABLE reading_history ADD COLUMN contentType TEXT NOT NULL DEFAULT ''")
                    db.execSQL("UPDATE reading_history SET contentType = type")
                }
            }
        )

        private fun migration(startVersion: Int, endVersion: Int): Migration =
            object : Migration(startVersion, endVersion) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    ensureCurrentSchema(db)
                }
            }

        private fun ensureCurrentSchema(db: SupportSQLiteDatabase) {
            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS `quran_progress` (
                    `id` TEXT NOT NULL,
                    `referenceId` INTEGER NOT NULL DEFAULT 0,
                    `subId` INTEGER NOT NULL DEFAULT 0,
                    `type` TEXT NOT NULL DEFAULT '',
                    `isRead` INTEGER NOT NULL DEFAULT 0,
                    `isMemorized` INTEGER NOT NULL DEFAULT 0,
                    `progress` INTEGER NOT NULL DEFAULT 0,
                    `hasHifzScore` INTEGER NOT NULL DEFAULT 0,
                    `isCompleted` INTEGER NOT NULL DEFAULT 0,
                    `readCount` INTEGER NOT NULL DEFAULT 0,
                    `lastUpdated` INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY(`id`)
                )
                """.trimIndent()
            )
            addColumnIfMissing(db, "quran_progress", "referenceId", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "quran_progress", "subId", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "quran_progress", "type", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "quran_progress", "isRead", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "quran_progress", "isMemorized", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "quran_progress", "progress", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "quran_progress", "hasHifzScore", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "quran_progress", "isCompleted", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "quran_progress", "readCount", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "quran_progress", "lastUpdated", "INTEGER NOT NULL DEFAULT 0")

            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS `reading_history` (
                    `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    `surahId` INTEGER NOT NULL DEFAULT 0,
                    `surahName` TEXT NOT NULL DEFAULT '',
                    `type` TEXT NOT NULL DEFAULT '',
                    `action` TEXT NOT NULL DEFAULT '',
                    `extraInfo` TEXT NOT NULL DEFAULT '',
                    `timestamp` INTEGER NOT NULL DEFAULT 0,
                    `dateKey` TEXT NOT NULL DEFAULT ''
                )
                """.trimIndent()
            )
            addColumnIfMissing(db, "reading_history", "surahId", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "reading_history", "surahName", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "reading_history", "type", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "reading_history", "action", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "reading_history", "extraInfo", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "reading_history", "timestamp", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "reading_history", "dateKey", "TEXT NOT NULL DEFAULT ''")

            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS `daily_goal` (
                    `id` INTEGER NOT NULL,
                    `unit` TEXT NOT NULL DEFAULT 'rub',
                    `target` INTEGER NOT NULL DEFAULT 4,
                    `reminderHour` INTEGER NOT NULL DEFAULT 8,
                    `reminderMinute` INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY(`id`)
                )
                """.trimIndent()
            )
            addColumnIfMissing(db, "daily_goal", "unit", "TEXT NOT NULL DEFAULT 'rub'")
            addColumnIfMissing(db, "daily_goal", "target", "INTEGER NOT NULL DEFAULT 4")
            addColumnIfMissing(db, "daily_goal", "reminderHour", "INTEGER NOT NULL DEFAULT 8")
            addColumnIfMissing(db, "daily_goal", "reminderMinute", "INTEGER NOT NULL DEFAULT 0")

            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS `planning_items` (
                    `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    `date` TEXT NOT NULL DEFAULT '',
                    `type` TEXT NOT NULL DEFAULT '',
                    `referenceId` INTEGER NOT NULL DEFAULT 0,
                    `subId` INTEGER NOT NULL DEFAULT 0,
                    `displayName` TEXT NOT NULL DEFAULT '',
                    `arabicText` TEXT NOT NULL DEFAULT '',
                    `isDone` INTEGER NOT NULL DEFAULT 0,
                    `historyLogged` INTEGER NOT NULL DEFAULT 0,
                    `reminderHour` INTEGER,
                    `reminderMinute` INTEGER,
                    `createdAt` INTEGER NOT NULL DEFAULT 0
                )
                """.trimIndent()
            )
            addColumnIfMissing(db, "planning_items", "date", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "planning_items", "type", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "planning_items", "referenceId", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "planning_items", "subId", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "planning_items", "displayName", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "planning_items", "arabicText", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "planning_items", "isDone", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "planning_items", "historyLogged", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "planning_items", "reminderHour", "INTEGER")
            addColumnIfMissing(db, "planning_items", "reminderMinute", "INTEGER")
            addColumnIfMissing(db, "planning_items", "createdAt", "INTEGER NOT NULL DEFAULT 0")

            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS `reading_journey` (
                    `id` INTEGER NOT NULL,
                    `enabled` INTEGER NOT NULL DEFAULT 0,
                    `type` TEXT NOT NULL DEFAULT 'quran',
                    `totalDays` INTEGER NOT NULL DEFAULT 30,
                    `startDate` TEXT NOT NULL DEFAULT '',
                    `autoDailyGoal` INTEGER NOT NULL DEFAULT 1,
                    `updatedAt` INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY(`id`)
                )
                """.trimIndent()
            )
            addColumnIfMissing(db, "reading_journey", "enabled", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "reading_journey", "type", "TEXT NOT NULL DEFAULT 'quran'")
            addColumnIfMissing(db, "reading_journey", "totalDays", "INTEGER NOT NULL DEFAULT 30")
            addColumnIfMissing(db, "reading_journey", "startDate", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "reading_journey", "autoDailyGoal", "INTEGER NOT NULL DEFAULT 1")
            addColumnIfMissing(db, "reading_journey", "updatedAt", "INTEGER NOT NULL DEFAULT 0")

            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS `ayah_notes` (
                    `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    `surahId` INTEGER NOT NULL,
                    `surahName` TEXT NOT NULL DEFAULT '',
                    `ayahNumber` INTEGER NOT NULL,
                    `title` TEXT NOT NULL DEFAULT '',
                    `note` TEXT NOT NULL DEFAULT '',
                    `folder` TEXT NOT NULL DEFAULT '',
                    `tags` TEXT NOT NULL DEFAULT '',
                    `fontSize` INTEGER NOT NULL DEFAULT 16,
                    `headingLevel` INTEGER NOT NULL DEFAULT 0,
                    `isBold` INTEGER NOT NULL DEFAULT 0,
                    `isItalic` INTEGER NOT NULL DEFAULT 0,
                    `isUnderline` INTEGER NOT NULL DEFAULT 0,
                    `isStrike` INTEGER NOT NULL DEFAULT 0,
                    `listMode` TEXT NOT NULL DEFAULT 'none',
                    `textColorKey` TEXT NOT NULL DEFAULT 'gold',
                    `formatSpans` TEXT NOT NULL DEFAULT '',
                    `isPinned` INTEGER NOT NULL DEFAULT 0,
                    `updatedAt` INTEGER NOT NULL DEFAULT 0
                )
                """.trimIndent()
            )
            addColumnIfMissing(db, "ayah_notes", "surahId", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "ayah_notes", "surahName", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "ayah_notes", "ayahNumber", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "ayah_notes", "title", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "ayah_notes", "note", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "ayah_notes", "folder", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "ayah_notes", "tags", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "ayah_notes", "fontSize", "INTEGER NOT NULL DEFAULT 16")
            addColumnIfMissing(db, "ayah_notes", "headingLevel", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "ayah_notes", "isBold", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "ayah_notes", "isItalic", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "ayah_notes", "isUnderline", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "ayah_notes", "isStrike", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "ayah_notes", "listMode", "TEXT NOT NULL DEFAULT 'none'")
            addColumnIfMissing(db, "ayah_notes", "textColorKey", "TEXT NOT NULL DEFAULT 'gold'")
            addColumnIfMissing(db, "ayah_notes", "formatSpans", "TEXT NOT NULL DEFAULT ''")
            addColumnIfMissing(db, "ayah_notes", "isPinned", "INTEGER NOT NULL DEFAULT 0")
            addColumnIfMissing(db, "ayah_notes", "updatedAt", "INTEGER NOT NULL DEFAULT 0")
            db.execSQL("DROP INDEX IF EXISTS `index_ayah_notes_surahId_ayahNumber`")
            db.execSQL(
                "CREATE INDEX IF NOT EXISTS `index_ayah_notes_surahId_ayahNumber` " +
                    "ON `ayah_notes` (`surahId`, `ayahNumber`)"
            )
        }

        private fun addColumnIfMissing(
            db: SupportSQLiteDatabase,
            tableName: String,
            columnName: String,
            columnDefinition: String
        ) {
            db.query("PRAGMA table_info(`$tableName`)").use { cursor ->
                val nameIndex = cursor.getColumnIndex("name")
                while (cursor.moveToNext()) {
                    if (cursor.getString(nameIndex) == columnName) return
                }
            }
            db.execSQL("ALTER TABLE `$tableName` ADD COLUMN `$columnName` $columnDefinition")
        }
    }
}
