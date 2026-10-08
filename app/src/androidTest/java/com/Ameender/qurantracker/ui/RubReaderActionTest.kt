package com.Ameender.qurantracker.ui

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class RubReaderActionTest {
    @get:Rule val compose = createComposeRule()
    private val context get() = InstrumentationRegistry.getInstrumentation().targetContext

    @Test fun all240HafsTargetsResolveToTheirActualMushafPage() {
        var previous = 0 to 0
        for (hizb in 1..60) for (quarter in 1..4) {
            val target = requireNotNull(loadRubReaderTarget(context, "hafs", hizb, quarter).target)
            assertTrue(target.surah > previous.first || target.surah == previous.first && target.ayah > previous.second)
            val position = findHafsAyahMushafTarget(context, target.surah, target.ayah, listOf(target.page))
            assertNotNull(position)
            assertEquals(target.page, position!!.page)
            previous = target.surah to target.ayah
        }
    }

    @Test fun unverifiedWarshAndOtherLayoutsCannotSilentlyUseHafs() {
        for (mode in listOf("warsh", "hafs_indopak_15", "hafs_madina_pdf")) {
            val result = loadRubReaderTarget(context, mode, 1, 2)
            assertNull(result.target)
            assertNotNull(result.messageKey)
        }
    }

    @Test fun all240WarshTargetsResolveThroughTheActualReaderWithoutHafsFallback() {
        var previous = 0 to 0
        for (hizb in 1..60) for (quarter in 1..4) {
            val target = loadWarshRubTarget(context, hizb, quarter)
            assertTrue(target.surah > previous.first || target.surah == previous.first && target.printedAyah > previous.second)
            val pages = WarshMaknoonPages.pagesForSurah(context, target.surah)
            val position = requireNotNull(WarshMaknoonPages.findAyah(context, target.surah, target.ayah, pages))
            assertEquals(target.page, position.page)
            val top = WarshMaknoonPages.load(context, target.page).positions.filter {
                it.surahId == target.surah && it.ayahNumber == target.printedAyah
            }.minOf { it.top }
            assertEquals((top * 1.12f - .06f - .14f).coerceAtLeast(0f), position.scrollFraction, .0001f)
            previous = target.surah to target.printedAyah
        }
        assertEquals(RubReaderTarget(1,2,2,26,5,25), loadWarshRubTarget(context,1,2))
        assertEquals(RubReaderTarget(1,3,2,42,7,41), loadWarshRubTarget(context,1,3))
    }

    @Test fun openOnlyEmitsTheRequestedTarget() {
        val expected = RubReaderTarget(1, 2, 2, 26, 5)
        var opened: RubReaderTarget? = null
        compose.setContent {
            QuranTrackerTheme { RubReaderActionContent(RubReaderAvailability(expected), AppText.strings("nl")) { opened = it } }
        }
        compose.onNodeWithTag("rub_open_reader").assertIsEnabled().performClick()
        compose.runOnIdle { assertEquals(expected, opened) }
    }

    @Test fun pendingWarshShowsExplanationAndCannotOpen() {
        var opens = 0
        compose.setContent {
            QuranTrackerTheme { RubReaderActionContent(RubReaderAvailability(messageKey = "rub.open.warshPending"),
                AppText.strings("nl")) { opens++ } }
        }
        compose.onNodeWithTag("rub_open_reader").assertIsNotEnabled().performClick()
        compose.onNodeWithText(AppText.strings("nl").t("rub.open.warshPending")).assertIsDisplayed()
        compose.runOnIdle { assertEquals(0, opens) }
    }
}
