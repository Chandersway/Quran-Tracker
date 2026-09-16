package com.Ameender.qurantracker

import com.Ameender.qurantracker.domain.hizbProgressId
import com.Ameender.qurantracker.domain.juzProgressId
import com.Ameender.qurantracker.domain.rubProgressId
import com.Ameender.qurantracker.domain.surahProgressId
import com.Ameender.qurantracker.domain.deriveDailyGoalFromJourney
import org.junit.Test

import org.junit.Assert.*

class ExampleUnitTest {
    @Test
    fun deriveDailyGoalFromJourney_usesJuzWhenPartsDivideByEight() {
        assertEquals("juz" to 1, deriveDailyGoalFromJourney(30))
    }

    @Test
    fun deriveDailyGoalFromJourney_usesHizbWhenPartsDivideByFour() {
        assertEquals("hizb" to 1, deriveDailyGoalFromJourney(60))
    }

    @Test
    fun deriveDailyGoalFromJourney_usesRubForSmallestUnit() {
        assertEquals("rub" to 3, deriveDailyGoalFromJourney(100))
    }

    @Test
    fun progressIds_areStable() {
        assertEquals("juz_2", juzProgressId(2))
        assertEquals("hizb_7", hizbProgressId(7))
        assertEquals("rub_4_3", rubProgressId(4, 3))
        assertEquals("surah_18", surahProgressId(18))
    }
}
