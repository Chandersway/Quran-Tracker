package com.Ameender.qurantracker.data

import androidx.room.Room
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.async
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.flow.first
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class HizbCheckInDatabaseTest {
    @Test fun resetClearsHistoryAndReadingProgressButKeepsHifz() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val db = Room.inMemoryDatabaseBuilder(context, QuranDatabase::class.java).build()
        try {
            val repo = QuranProgressRepository(db.quranDao(), db.readingHistoryDao(), db, ownerProvider = { "a" })
            repo.quickCheckIn("hizb", setOf(1, 2), 1, "before-reset")
            repo.quickCheckIn("surah", setOf(1), 1, "surah")
            repo.markSurah(1, "Al-Fatiha", "memorized")
            repo.updateHifzScore("surah", 1, 85)
            repo.updateHifzScore("hizb", 1, 70)
            repo.resetHistory()
            assertTrue(db.readingHistoryDao().getAllOnce().isEmpty())
            assertEquals(0, db.readingHistoryDao().getTotalReadCount().first())
            assertTrue(db.readingHistoryDao().hizbCounts("a", 0, Long.MAX_VALUE).first().isEmpty())
            val rows = db.quranDao().getAllProgress().first()
            assertTrue(rows.all { !it.isRead && it.readCount == 0 })
            assertEquals(85, rows.single { it.type == "surah" }.progress)
            assertTrue(rows.single { it.type == "surah" }.isMemorized)
            assertEquals(70, rows.single { it.type == "hizb" }.progress)
            repo.quickCheckIn("hizb", setOf(1), 1, "before-reset")
            assertEquals(listOf(HizbReadingCount(1, 1)), db.readingHistoryDao().hizbCounts("a", 0, Long.MAX_VALUE).first())
        } finally { db.close() }
    }

    @Test fun aggregateObserverRefreshesAfterCommit() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val db = Room.inMemoryDatabaseBuilder(context, QuranDatabase::class.java).build()
        try {
            val dao = db.readingHistoryDao()
            val observer = async(start = CoroutineStart.UNDISPATCHED) {
                withTimeout(5000) { dao.hizbCounts("a", 0, Long.MAX_VALUE).first { it.isNotEmpty() } }
            }
            QuranProgressRepository(db.quranDao(), dao, db, ownerProvider = { "a" })
                .quickCheckIn("hizb", setOf(37), 1, "refresh")
            assertEquals(listOf(HizbReadingCount(37, 1)), observer.await())
        } finally { db.close() }
    }

    @Test fun atomicBatchIdempotencyAndAccountRangeIsolation() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val db = Room.inMemoryDatabaseBuilder(context, QuranDatabase::class.java).build()
        try {
            var owner = "account-a"
            val repo = QuranProgressRepository(db.quranDao(), db.readingHistoryDao(), db, ownerProvider = { owner })
            repo.quickCheckIn("hizb", setOf(33,34,36),1,"batch-1")
            repo.quickCheckIn("hizb", setOf(33,34,36),1,"batch-1")
            assertEquals(3,db.readingHistoryDao().getAllOnce().size)
            assertEquals(12,db.quranDao().getAllProgress().first().size)
            repo.quickCheckIn("hizb",setOf(33),1,"batch-2")
            var rows = db.readingHistoryDao().hizbCounts(owner,0,Long.MAX_VALUE).first()
            assertEquals(2,rows.first { it.hizbNumber == 33 }.count)
            assertTrue(db.readingHistoryDao().hizbCounts("account-b",0,Long.MAX_VALUE).first().isEmpty())
            assertTrue(db.readingHistoryDao().hizbCounts(owner,0,1).first().isEmpty())
            owner = "account-b"
            repo.quickCheckIn("hizb",setOf(60),1,"batch-1")
            rows = db.readingHistoryDao().hizbCounts(owner,0,Long.MAX_VALUE).first()
            assertEquals(listOf(HizbReadingCount(60,1)),rows)
            val before = db.readingHistoryDao().getAllOnce().size
            try { repo.quickCheckIn("hizb",setOf(1,61),1,"bad"); fail("Invalid batch accepted") } catch (_: IllegalArgumentException) {}
            assertEquals(before,db.readingHistoryDao().getAllOnce().size)
        } finally { db.close() }
    }

    @Test fun accountChangeRollsBackAndSinglesHaveOwnership() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val db = Room.inMemoryDatabaseBuilder(context, QuranDatabase::class.java).build()
        try {
            var calls = 0
            val changing = QuranProgressRepository(db.quranDao(), db.readingHistoryDao(), db,
                ownerProvider = { if (calls++ == 0) "a" else "b" })
            try { changing.quickCheckIn("hizb", setOf(1, 2), 1, "rollback"); fail("Account switch accepted") }
            catch (_: IllegalStateException) { }
            assertTrue(db.readingHistoryDao().getAllOnce().isEmpty())
            assertTrue(db.quranDao().getAllProgress().first().isEmpty())
            val repo = QuranProgressRepository(db.quranDao(), db.readingHistoryDao(), db, ownerProvider = { "guest" })
            for (type in listOf("surah", "juz", "rub")) {
                repo.quickCheckIn(type, setOf(1), 1, type)
                repo.quickCheckIn(type, setOf(1), 1, type)
            }
            val history = db.readingHistoryDao().getAllOnce()
            assertEquals(3, history.size)
            assertTrue(history.all { it.ownerId == "guest" })
        } finally { db.close() }
    }

    @Test fun clearHistoryOnlyWithExplicitDeviceTestArgument() = runBlocking {
        org.junit.Assume.assumeTrue(InstrumentationRegistry.getArguments().getString("clear_test_history") == "true")
        val db = QuranDatabase.getDatabase(InstrumentationRegistry.getInstrumentation().targetContext)
        db.readingHistoryDao().deleteAll()
        assertTrue(db.readingHistoryDao().getAllOnce().isEmpty())
    }
}
