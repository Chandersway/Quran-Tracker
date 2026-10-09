package com.Ameender.qurantracker.ui

import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.test.platform.app.InstrumentationRegistry
import com.Ameender.qurantracker.data.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class ReadingChecklistUiTest {
    @get:Rule val compose = createComposeRule()
    @Test fun clearActionsRequireConfirmationAndKeepOtherState() {
        val target = QuranNoteTarget(NoteScope.HIZB,1)
        var state by mutableStateOf(ReadingChecklistState().check(target,true).stopAt(target))
        compose.setContent {
            QuranTrackerTheme("light") {
                ReadingChecklistContent(state,"en","hizb",0,false,false,{}, {}, { _,_ -> }, {}, {},
                    onClearPosition={state=state.clearPosition()}, onClearChecklist={state=state.clearChecklist()})
            }
        }
        compose.onNodeWithContentDescription("Manage").performClick()
        compose.onNodeWithText("Clear reading position").performClick()
        compose.onNodeWithText("Cancel").performClick()
        compose.runOnIdle { assertEquals(target,state.position) }
        compose.onNodeWithContentDescription("Manage").performClick()
        compose.onNodeWithText("Clear reading position").performClick()
        compose.onNodeWithText("Clear",useUnmergedTree=true).performClick()
        compose.runOnIdle { assertNull(state.position); assertTrue(state.completed(target)) }
        compose.onNodeWithContentDescription("Manage").performClick()
        compose.onNodeWithText("Clear checklist").performClick()
        compose.onNodeWithText("Clear",useUnmergedTree=true).performClick()
        compose.runOnIdle { assertTrue(state.readVerses.isEmpty()) }
    }
    @Test fun resumeAtHizbBoundaryAndCheckDoesNotMovePosition() {
        var state by mutableStateOf(ReadingChecklistState().stopAt(QuranNoteTarget(NoteScope.HIZB, 2)))
        var read: QuranStart? = null
        compose.setContent {
            var expanded by remember { mutableStateOf(0) }
            QuranTrackerTheme("light") {
                ReadingChecklistContent(state,"en","hizb",expanded,false,false,{}, { expanded=it },
                    { target, value -> state=state.check(target,value) }, { state=state.stopAt(it) }, { read=it })
            }
        }
        compose.onNodeWithTag("part-hizb-2").assertIsDisplayed()
        compose.onNodeWithContentDescription("Mark as read: Ḥizb 2").performClick()
        compose.runOnIdle { assertEquals(QuranNoteTarget(NoteScope.HIZB,2),state.position); assertTrue(state.completed(QuranNoteTarget(NoteScope.RUB,8))) }
        compose.onNodeWithText("Continue reading").performClick()
        compose.runOnIdle { assertEquals(QuranStructure.start(QuranNoteTarget(NoteScope.JUZ,2)),read) }
        compose.onNodeWithContentDescription("Uncheck: Ḥizb 2").performClick()
        compose.runOnIdle { assertEquals(QuranNoteTarget(NoteScope.HIZB,2),state.position); assertTrue(state.readVerses.isEmpty()) }
    }
    @Test fun arabicRtlShowsLocalizedNumbersAndCanSavePosition() {
        var state by mutableStateOf(ReadingChecklistState())
        compose.setContent {
            var expanded by remember { mutableStateOf(0) }
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                QuranTrackerTheme("dark") {
                    ReadingChecklistContent(state,"ar","hizb",expanded,false,false,{}, { expanded=it },
                        { target,value -> state=state.check(target,value) }, { state=state.stopAt(it) }, {})
                }
            }
        }
        compose.onNodeWithText("حزب ١", substring = false).assertIsDisplayed()
        compose.onAllNodesWithText("توقفت هنا").onFirst().performClick()
        compose.runOnIdle { assertEquals(QuranNoteTarget(NoteScope.HIZB,1),state.position); assertTrue(state.readVerses.isEmpty()) }
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val file = java.io.File(context.getExternalFilesDir(null), "checklist-preview.png")
        file.outputStream().use { compose.onRoot().captureToImage().asAndroidBitmap().compress(android.graphics.Bitmap.CompressFormat.PNG,100,it) }
    }
}
