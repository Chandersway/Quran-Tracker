package com.Ameender.qurantracker.data

import androidx.room.Room
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.sqlite.db.SupportSQLiteOpenHelper
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID

@RunWith(AndroidJUnit4::class)
class NoteScopesMigrationTest {
    @Test fun version16MigratesWithoutLosingNotesAndAllScopesRoundTrip() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "note-scope-migration-test-${UUID.randomUUID()}.db"
        val helper = FrameworkSQLiteOpenHelperFactory().create(
            SupportSQLiteOpenHelper.Configuration.builder(context).name(name)
                .callback(object : SupportSQLiteOpenHelper.Callback(16) {
                    override fun onCreate(db: SupportSQLiteDatabase) {
                        legacySchema.forEach(db::execSQL)
                        db.execSQL("""INSERT INTO ayah_notes
                            (id,surahId,surahName,ayahNumber,title,note,folder,tags,fontSize,headingLevel,
                            isBold,isItalic,isUnderline,isStrike,listMode,textColorKey,formatSpans,isPinned,updatedAt)
                            VALUES (42,12,'Yusuf',23,'Legacy title','بسم الله — saved note','Study','Reflection',
                            18,1,1,0,1,0,'none','gold','0,5,18,1,1,0,1,0,gold',1,123456)""")
                    }
                    override fun onUpgrade(db: SupportSQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit
                }).build())
        helper.writableDatabase
        helper.close()
        val database = Room.databaseBuilder(context, QuranDatabase::class.java, name)
            .addMigrations(*QuranDatabase.ALL_MIGRATIONS).build()
        try {
            val repository = AyahNoteRepository(database.ayahNoteDao())
            val legacy = repository.allNotes.first().single()
            assertEquals(42L, legacy.id)
            assertEquals("بسم الله — saved note", legacy.note)
            assertEquals("0,5,18,1,1,0,1,0,gold", legacy.formatSpans)
            assertEquals(123456L, legacy.updatedAt)
            assertTrue(legacy.isPinned)
            assertEquals(QuranNoteTarget(NoteScope.AYAH,12,23), legacy.target())
            listOf(QuranNoteTarget(NoteScope.JUZ,30), QuranNoteTarget(NoteScope.HIZB,18),
                QuranNoteTarget(NoteScope.RUB,71), QuranNoteTarget(NoteScope.SURAH,12)).forEach {
                repository.persistNote(AyahNote(note="Scoped note").withTarget(it))
            }
            val notes = repository.allNotes.first()
            assertEquals(5, notes.size)
            notes.filter { it.scopeType != "ayah" }.forEach { assertNull(it.ayahNumber); it.validateTarget() }
            val hizb = notes.single { it.scopeType == "hizb" }
            assertNull(hizb.surahId)
            repository.persistNote(hizb.copy(note="Edited"))
            assertEquals(5, repository.allNotes.first().size)
            repository.deleteForAyah(12,23)
            assertEquals(4, repository.allNotes.first().size)
            assertTrue(repository.allNotes.first().any { it.scopeType == "surah" })
        } finally {
            database.close()
            context.deleteDatabase(name)
        }
    }
    private val legacySchema = listOf(
        """CREATE TABLE IF NOT EXISTS `quran_progress` (`id` TEXT NOT NULL, `referenceId` INTEGER NOT NULL, `subId` INTEGER NOT NULL, `type` TEXT NOT NULL, `isRead` INTEGER NOT NULL, `isMemorized` INTEGER NOT NULL, `progress` INTEGER NOT NULL, `hasHifzScore` INTEGER NOT NULL, `isCompleted` INTEGER NOT NULL, `readCount` INTEGER NOT NULL, `lastUpdated` INTEGER NOT NULL, PRIMARY KEY(`id`))""",
        """CREATE TABLE IF NOT EXISTS `reading_history` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `surahId` INTEGER NOT NULL, `surahName` TEXT NOT NULL, `type` TEXT NOT NULL, `action` TEXT NOT NULL, `extraInfo` TEXT NOT NULL, `timestamp` INTEGER NOT NULL, `dateKey` TEXT NOT NULL)""",
        """CREATE TABLE IF NOT EXISTS `daily_goal` (`id` INTEGER NOT NULL, `unit` TEXT NOT NULL, `target` INTEGER NOT NULL, `reminderHour` INTEGER NOT NULL, `reminderMinute` INTEGER NOT NULL, PRIMARY KEY(`id`))""",
        """CREATE TABLE IF NOT EXISTS `planning_items` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `date` TEXT NOT NULL, `type` TEXT NOT NULL, `referenceId` INTEGER NOT NULL, `subId` INTEGER NOT NULL, `displayName` TEXT NOT NULL, `arabicText` TEXT NOT NULL, `isDone` INTEGER NOT NULL, `historyLogged` INTEGER NOT NULL, `reminderHour` INTEGER, `reminderMinute` INTEGER, `createdAt` INTEGER NOT NULL)""",
        """CREATE TABLE IF NOT EXISTS `reading_journey` (`id` INTEGER NOT NULL, `enabled` INTEGER NOT NULL, `type` TEXT NOT NULL, `totalDays` INTEGER NOT NULL, `startDate` TEXT NOT NULL, `autoDailyGoal` INTEGER NOT NULL, `updatedAt` INTEGER NOT NULL, PRIMARY KEY(`id`))""",
        """CREATE TABLE IF NOT EXISTS `ayah_notes` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `surahId` INTEGER NOT NULL, `surahName` TEXT NOT NULL, `ayahNumber` INTEGER NOT NULL, `title` TEXT NOT NULL, `note` TEXT NOT NULL, `folder` TEXT NOT NULL, `tags` TEXT NOT NULL, `fontSize` INTEGER NOT NULL, `headingLevel` INTEGER NOT NULL, `isBold` INTEGER NOT NULL, `isItalic` INTEGER NOT NULL, `isUnderline` INTEGER NOT NULL, `isStrike` INTEGER NOT NULL, `listMode` TEXT NOT NULL, `textColorKey` TEXT NOT NULL, `formatSpans` TEXT NOT NULL, `isPinned` INTEGER NOT NULL, `updatedAt` INTEGER NOT NULL)""",
        """CREATE INDEX IF NOT EXISTS `index_ayah_notes_surahId_ayahNumber` ON `ayah_notes` (`surahId`, `ayahNumber`)""",
        """CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY,identity_hash TEXT)""",
        """INSERT OR REPLACE INTO room_master_table (id,identity_hash) VALUES(42, '15351eb139df72285077caf6c01a5564')"""
    )
}

