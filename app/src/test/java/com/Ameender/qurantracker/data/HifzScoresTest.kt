package com.Ameender.qurantracker.data

import com.Ameender.qurantracker.domain.derivedJuzHifzScore
import com.Ameender.qurantracker.domain.shouldConfirmJuzHifzScore
import com.Ameender.qurantracker.ui.AppText
import com.Ameender.qurantracker.ui.HifzRawScore
import com.Ameender.qurantracker.ui.calculateHifzOverview
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import java.lang.reflect.Proxy

class HifzScoresTest {
    private fun score(id: Int, value: Int, scored: Boolean = true, time: Long = 100) = HifzRawScore(id,value,scored,time)
    private fun overview(hizb: List<HifzRawScore> = emptyList(), juz: List<HifzRawScore> = emptyList(), surah: List<HifzRawScore> = emptyList()) =
        calculateHifzOverview(surah,hizb,juz,AppText.strings("nl"))

    @Test fun derivedScoresDoNotDoubleCount() {
        val result = overview(hizb=listOf(score(1,0),score(2,100),score(3,100)))
        assertEquals(100,result.averageScore)
        assertEquals(2,result.scoredCount)
        assertEquals(0,result.juzCount)
        assertEquals(2,result.reviewItems.size)
    }
    @Test fun zeroAndUnassessedDoNotCount() {
        val result = overview(surah=listOf(score(1,0),score(2,100),score(3,90,false)))
        assertEquals(100,result.averageScore)
        assertEquals(1,result.scoredCount)
        assertEquals(100,result.weakest.first().score)
        assertEquals(0,overview().scoredCount)
    }
    @Test fun explicitJuzIsAnIndependentAssessment() {
        val result = overview(hizb=listOf(score(1,50),score(2,100)),juz=listOf(score(1,0)))
        assertEquals(75,result.averageScore)
        assertEquals(0,result.juzCount)
        assertEquals(75,result.juzScores.first().score)
        assertTrue(result.juzScores.first().derived)
    }
    @Test fun latestDuplicateWinsAndInvalidIdsAreIgnored() {
        val result = overview(hizb=listOf(score(1,10,time=1),score(1,80,time=2),score(61,100)),
            juz=listOf(score(0,100)),surah=listOf(score(115,100)))
        assertEquals(1,result.scoredCount)
        assertEquals(80,result.averageScore)
    }
    @Test fun averagesRoundAndClamp() {
        assertEquals(51,overview(surah=listOf(score(1,50),score(2,51))).averageScore)
        assertEquals(100,overview(surah=listOf(score(1,-10),score(2,120))).averageScore)
    }
    @Test fun juzNeedsTwoRealHizbScores() {
        assertNull(derivedJuzHifzScore(80,null))
        assertNull(derivedJuzHifzScore(null,80))
        assertNull(derivedJuzHifzScore(0,0))
        assertEquals(51,derivedJuzHifzScore(50,51))
        assertNull(derivedJuzHifzScore(-1,110))
    }
    @Test fun inconsistentJuzScoresNeedConfirmation() {
        assertFalse(shouldConfirmJuzHifzScore(0, null, null))
        assertTrue(shouldConfirmJuzHifzScore(80, null, 80))
        assertTrue(shouldConfirmJuzHifzScore(80, 60, 80))
        assertFalse(shouldConfirmJuzHifzScore(80, 61, 99))
    }
    @Test fun readActionsPreserveJuzAssessmentAndTimestamp() = runBlocking {
        val rows = mutableMapOf<String,QuranProgress>()
        val progress = Proxy.newProxyInstance(QuranDao::class.java.classLoader,arrayOf(QuranDao::class.java)) { _, method, args ->
            when(method.name) {
                "getAllProgress", "getByType" -> flowOf(rows.values.toList())
                "getById" -> rows[args!![0] as String]
                "upsertProgress" -> { val row=args!![0] as QuranProgress; rows[row.id]=row; Unit }
                else -> error("Unexpected DAO call: ${method.name}")
            }
        } as QuranDao
        val history = Proxy.newProxyInstance(ReadingHistoryDao::class.java.classLoader,arrayOf(ReadingHistoryDao::class.java)) { _, method, _ ->
            when(method.name) {
                "insert" -> Unit
                "getTotalReadCount" -> flowOf(0)
                else -> flowOf(emptyList<Any>())
            }
        } as ReadingHistoryDao
        val repo=QuranProgressRepository(progress,history)
        repo.updateHifzScore("juz",1,78)
        val original=rows.values.single()
        repo.markJuzRead(1)
        assertEquals(78,rows.values.single().progress)
        assertTrue(rows.values.single().hasHifzScore)
        assertTrue(rows.values.single().isRead)
        assertEquals(original.lastUpdated,rows.values.single().lastUpdated)
        repo.removeJuz(1)
        assertEquals(78,rows.values.single().progress)
        assertTrue(rows.values.single().hasHifzScore)
        assertFalse(rows.values.single().isRead)
        repo.updateHifzScore("juz",1,0)
        assertEquals(0,rows.values.single().progress)
        assertFalse(rows.values.single().hasHifzScore)
        assertEquals(1,rows.size)
        try { repo.updateHifzScore("rub",1,80); fail("Invalid scope accepted") } catch (_: IllegalArgumentException) {}
        try { repo.updateHifzScore("juz",31,80); fail("Invalid number accepted") } catch (_: IllegalArgumentException) {}
    }
}
