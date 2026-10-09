package com.Ameender.qurantracker.ui

import org.junit.Assert.*
import org.junit.Test

class IrabTextTest {
    @Test fun asbabStringsAreAvailable() {
        for (lang in listOf("nl", "en", "ar")) {
            for (key in listOf("title", "menuSubtitle", "notice", "empty")) {
                val value = AppText.strings(lang).t("asbab.$key")
                assertTrue(value.isNotBlank())
                assertFalse(value.startsWith("asbab."))
            }
        }
    }
    @Test fun screenStringsExistInEveryLanguage() {
        val keys = listOf("title", "menuSubtitle", "close", "notice", "source", "load",
            "loading", "error", "rateLimit", "empty", "excerpt", "credit")
        for (language in listOf("nl", "en", "ar")) {
            val text = AppText.strings(language)
            keys.forEach { key ->
                val value = text.t("irab.$key")
                assertTrue(value.isNotBlank())
                assertFalse(value.startsWith("irab."))
            }
            assertTrue(text.t("irab.ayah", 286).contains("286"))
            assertTrue(text.t("irab.reference", "3", "88").contains("88"))
        }
    }
}
