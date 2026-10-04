package com.Ameender.qurantracker.ui
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
internal fun Modifier.quickCheckTypeTag(type: String) = testTag("quick_check_$type")
