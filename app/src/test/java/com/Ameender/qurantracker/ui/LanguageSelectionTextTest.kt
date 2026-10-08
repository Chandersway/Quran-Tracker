package com.Ameender.qurantracker.ui

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class LanguageSelectionTextTest {
    @Test fun allScreenCopyIsTranslated() {
        for (language in listOf("nl", "en", "ar")) {
            val text = AppText.strings(language)
            for (key in listOf("title", "description", "continue")) {
                val value = text.t("onboarding.language.$key")
                assertFalse(value.isBlank())
                assertFalse(value.startsWith("onboarding."))
            }
        }
        assertEquals("Choose your language", AppText.strings("en").t("onboarding.language.title"))
        assertEquals("اختر لغتك", AppText.strings("ar").t("onboarding.language.title"))
    }
}
