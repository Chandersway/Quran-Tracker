package com.Ameender.qurantracker.ui

import android.app.TimePickerDialog
import android.widget.DatePicker
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.Espresso.pressBack
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.*
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ReadingPlanDatePickerTest {
    @get:Rule val compose = createComposeRule()

    @Test fun endDateOpensConfirmsAndReopensInEveryLanguage() {
        val language = mutableStateOf("nl")
        compose.setContent { MaterialTheme { ReadingPlanScreen(emptyList(), language.value) } }
        for (locale in listOf("nl", "en", "ar", "fr")) {
            compose.runOnIdle { language.value = locale }
            compose.onNodeWithTag("reading_plan_end_date").performScrollTo().performClick()
            onView(isAssignableFrom(DatePicker::class.java)).check(matches(isDisplayed()))
            onView(withId(android.R.id.button1)).perform(click())
            compose.onNodeWithTag("reading_plan_end_date").performScrollTo().performClick()
            onView(isAssignableFrom(DatePicker::class.java)).check(matches(isDisplayed()))
            pressBack()
        }
        // Deliberately do not save the plan: the user's stored settings stay unchanged.
    }

    @Test fun localizedTimeDialogRetainsActivityWindowInEveryLanguage() {
        lateinit var context: android.content.Context
        compose.setContent { context = LocalContext.current }
        compose.runOnIdle {
            for (language in listOf("nl", "en", "ar", "fr")) {
                val localized = localizedDialogContext(context, language)
                assertEquals(language, localized.resources.configuration.locales[0].language)
                val dialog = TimePickerDialog(localized, { _, _, _ -> }, 19, 0, true)
                try { dialog.show(); assertTrue(dialog.isShowing) } finally { dialog.dismiss() }
            }
        }
    }
}
