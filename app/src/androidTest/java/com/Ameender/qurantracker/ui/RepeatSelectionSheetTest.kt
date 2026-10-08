package com.Ameender.qurantracker.ui

import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import org.junit.Rule
import org.junit.Test
import android.graphics.Bitmap
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File

class RepeatSelectionSheetTest {
    @get:Rule val compose = createComposeRule()

    private fun show(page: Int? = 2, warsh: Boolean = false, language: String = "nl") {
        compose.setContent {
            val player = remember { GlobalAudioPlayer() }
            DisposableEffect(Unit) { onDispose { player.release() } }
            QuranTrackerTheme {
                RepeatSelectionSheet(2, page, warsh, AppText.strings(language), player, onDismiss = {})
            }
        }
    }

    @Test fun pageAndRepeatCountAreSelectable() {
        show()
        compose.onNodeWithText("Pagina 2").assertIsSelected()
        compose.onNodeWithText("3×").performClick().assertIsSelected()
        compose.onNodeWithText("Doorlopend").performClick().assertIsSelected()
        compose.onNodeWithText("Start herhaling").performScrollTo().assertIsEnabled()
        val bitmap = compose.onNodeWithTag("repeat_sheet").captureToImage().asAndroidBitmap()
        File(InstrumentationRegistry.getInstrumentation().targetContext.getExternalFilesDir(null), "repeat-panel.png")
            .outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }

    @Test fun invalidAyahRangeCannotStart() {
        show(page = null)
        compose.onNodeWithText("Ayat kiezen").performClick()
        compose.onNodeWithText("Vanaf ayah").performTextReplacement("8")
        compose.onNodeWithText("Tot en met ayah").performTextReplacement("2")
        compose.onNodeWithText("Start herhaling").performScrollTo().assertIsNotEnabled()
    }

    @Test fun pageRangeRequiresOrderedValidPages() {
        show()
        compose.onNodeWithText("Pagina’s kiezen").performClick()
        compose.onNodeWithText("Van pagina").performTextReplacement("10")
        compose.onNodeWithText("Tot en met pagina").performTextReplacement("12")
        compose.onNodeWithText("Start herhaling").performScrollTo().assertIsEnabled()
        compose.onNodeWithText("Tot en met pagina").performScrollTo().performTextReplacement("9")
        compose.onNodeWithText("Start herhaling").performScrollTo().assertIsNotEnabled()
    }

    @Test fun unsupportedLayoutDoesNotOfferPages() {
        show(page = null)
        compose.onNodeWithText("Pagina’s kiezen").assertDoesNotExist()
    }

    @Test fun pageReferencesIncludeEntireRangeWithoutDuplicates() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        for (warsh in listOf(false, true)) {
            val expected = (10..12).flatMap { loadRepeatPageReferences(context, it..it, warsh) }
                .distinct().sortedWith(compareBy({ it.first }, { it.second }))
            org.junit.Assert.assertEquals(expected, loadRepeatPageReferences(context, 10..12, warsh))
        }
    }

    @Test fun warshHasOnlyMatchingReciterAndTranslatedLabels() {
        show(warsh = true, language = "en")
        compose.onNodeWithText("Ibrahim Al-Dosari · Warsh").performScrollTo().assertIsDisplayed()
        compose.onNodeWithText("Mishary Alafasy · Hafs").assertDoesNotExist()
        compose.onNodeWithText("Start repeating").performScrollTo().assertIsDisplayed()
    }

    @Test fun reciterChoiceMatchesReadingTradition() {
        show(warsh = true, language = "nl")
        compose.onNodeWithTag("repeat_reciter_selector").performScrollTo().performClick()
        compose.onNodeWithTag("repeat_reciter_abdulbasit_warsh").assertIsDisplayed().performClick()
        compose.onNodeWithText("Abdul Basit Abdul Samad · Warsh").assertIsDisplayed()
        compose.onNodeWithTag("repeat_reciter_selector").performClick()
        compose.onNodeWithTag("repeat_reciter_maher").assertDoesNotExist()
    }
}
