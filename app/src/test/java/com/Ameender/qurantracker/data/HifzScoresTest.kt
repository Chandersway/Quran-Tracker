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
        assertNull(result.juzScores.first().score)
        assertFalse(result.juzScores.first().derived)
    }
    @Test fun latestDuplicateWinsAndInvalidIdsAreIgnored() {
        val result = overview(hizb=listOf(score(1,10,time=1),score(1,80,time=2),score(61,100)),
            juz=listOf(score(0,100)),surah=listOf(score(115,100)))
        assertEquals(1,result.scoredCount)
        assertEquals(80,result.averageScore)
    }
    @Test fun independentCategoriesAndNonBlockingHint() {
        val result = overview(hizb=listOf(score(1,95),score(2,95)),
            juz=listOf(score(1,20)),surah=listOf(score(1,70)))
        assertEquals(95, result.hizbScores.first().score)
        assertEquals(20, result.juzScores.first().score)
        assertEquals(70, result.surahScores.first().score)
        assertEquals(listOf(1), result.inconsistentJuz)
        assertEquals(114, result.surahScores.size)
        assertEquals(4, result.allScores.size)
        assertTrue(overview(hizb=listOf(score(1,95)),juz=listOf(score(1,20))).inconsistentJuz.isEmpty())
    }
    @Test fun latestClearCannotResurrectAnOlderScore() {
        val oldAndCleared = listOf(score(1,90,time=1), score(1,0,false,time=2))
        val result = overview(hizb=oldAndCleared,juz=oldAndCleared,surah=oldAndCleared)
        assertEquals(0,result.scoredCount)
        assertTrue(result.reviewItems.isEmpty())
        assertNull(result.surahScores.first().score)
        assertNull(result.hizbScores.first().score)
        assertNull(result.juzScores.first().score)
    }
    @Test fun zeroHasNeutralColors() {
        assertEquals(com.Ameender.qurantracker.ui.MidNavy, com.Ameender.qurantracker.ui.hifzScoreSurface(0))
        assertEquals(com.Ameender.qurantracker.ui.BorderNavy, com.Ameender.qurantracker.ui.hifzScoreBorder(0))
    }
    @Test fun arabicOverviewUsesArabicSurahNamesIncludingReviews() {
        val result = calculateHifzOverview(listOf(score(1,70)), emptyList(), emptyList(), AppText.strings("ar"), "ar")
        assertEquals("الفاتحة", result.allScores.single().name)
        assertEquals("الفاتحة", result.reviewItems.single().name)
        assertEquals("Al-Fatihah", overview(surah=listOf(score(1,70))).allScores.single().name)
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
        assertFalse(shouldConfirmJuzHifzScore(80, null, 80))
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
        repo.updateHifzScore("hizb",1,90)
        repo.updateHifzScore("surah",1,65)
        repo.updateHifzScore("juz",1,25)
        assertEquals(90,rows.values.single { it.type == "hizb" }.progress)
        assertEquals(65,rows.values.single { it.type == "surah" }.progress)
        repo.markJuzRead(1)
        for (type in listOf("surah", "hizb", "juz")) {
            repo.updateHifzScore(type,1,0)
            val cleared = rows.values.single { it.type == type }
            assertFalse(cleared.hasHifzScore)
            assertEquals(0,cleared.progress)
        }
        assertTrue(rows.values.single { it.type == "juz" }.isRead)
        try { repo.updateHifzScore("rub",1,80); fail("Invalid scope accepted") } catch (_: IllegalArgumentException) {}
        try { repo.updateHifzScore("juz",31,80); fail("Invalid number accepted") } catch (_: IllegalArgumentException) {}
    }
}
