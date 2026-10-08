package com.Ameender.qurantracker.ui

import org.junit.Assert.*
import org.junit.Test

class ReaderMenuTextTest {
    private val keys = listOf("menu", "readText", "fontSize", "smallerFont", "backToSurahs",
        "pageBookmarks", "ayahBookmarks", "hideCard", "showCard", "showWordByWord", "showMushaf")

    @Test fun everyMenuLabelHasItsOwnTranslation() {
        for (key in keys.map { "reader.$it" }) {
            val values = listOf("nl", "en", "ar").map { AppText.strings(it).t(key) }
            values.forEach { assertTrue(it.isNotBlank()); assertNotEquals(key, it) }
            assertEquals("Missing distinct translation for $key", 3, values.toSet().size)
        }
    }

    @Test fun dynamicMenuLabelsFormatInAllLanguages() {
        for (language in listOf("nl", "en", "ar")) {
            val text = AppText.strings(language)
            for (key in listOf("fontSize", "pageBookmarks", "ayahBookmarks")) {
                val label = text.t("reader.$key", 24)
                assertTrue(label.contains("24"))
                assertFalse(label.contains("%s"))
            }
            assertTrue(text.t("reader.showMushaf", "Warsh - Maknoon").contains("Warsh - Maknoon"))
        }
        assertEquals("Read text", AppText.strings("en").t("reader.readText"))
        assertEquals("قراءة النص", AppText.strings("ar").t("reader.readText"))
    }
}
