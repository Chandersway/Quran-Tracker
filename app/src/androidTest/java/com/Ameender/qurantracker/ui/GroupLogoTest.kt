package com.Ameender.qurantracker.ui

import android.graphics.Bitmap
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.dp
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import java.io.File

class GroupLogoTest {
    @get:Rule val compose = createComposeRule()

    @Test fun overviewLogoLoadsPerGroupAndDoesNotInterceptOpeningGroup() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val file = File(context.cacheDir, "group-logo-test.png")
        val bitmap = Bitmap.createBitmap(8, 8, Bitmap.Config.ARGB_8888)
        bitmap.eraseColor(android.graphics.Color.GREEN)
        file.outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        bitmap.recycle()
        val code = mutableStateOf("AAA-0001")
        val requests = mutableListOf<String>()
        var opened = 0
        compose.setContent {
            QuranTrackerTheme("dark") {
                Box(Modifier.testTag("group_card").clickable { opened++ }) {
                    GroupLogo(code.value, false, AppText.strings("nl"), size = 54.dp, loadLogo = {
                        requests.add(it)
                        when (it) {
                            "AAA-0001" -> file.toURI().toString()
                            "BBB-0002" -> null
                            else -> error("Network unavailable")
                        }
                    })
                }
            }
        }
        compose.waitUntil { compose.onAllNodesWithTag("group_logo_AAA-0001", useUnmergedTree = true).fetchSemanticsNodes().isNotEmpty() }
        compose.onNodeWithTag("group_logo_AAA-0001", useUnmergedTree = true).assertIsDisplayed()
        compose.onNodeWithTag("group_card").performTouchInput { click(center) }
        compose.runOnIdle { assertEquals(1, opened); code.value = "BBB-0002" }
        compose.onNodeWithTag("group_logo_AAA-0001", useUnmergedTree = true).assertDoesNotExist()
        compose.runOnIdle { code.value = "CCC-0003" }
        compose.waitForIdle()
        compose.onNodeWithTag("group_logo_CCC-0003", useUnmergedTree = true).assertDoesNotExist()
        compose.runOnIdle { assertTrue(requests.containsAll(listOf("AAA-0001", "BBB-0002", "CCC-0003"))) }
    }
}
