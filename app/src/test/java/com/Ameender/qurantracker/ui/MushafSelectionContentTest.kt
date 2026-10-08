package com.Ameender.qurantracker.ui

import org.junit.Assert.*
import org.junit.Test

class MushafSelectionContentTest {
    private fun words(ayah: Int) = WordByWordAyah(
        ayah, listOf(QuranWord(1, "word-$ayah", "translation-$ayah", "transliteration-$ayah")), "grammar-$ayah"
    )

    @Test fun shiftedReferenceIsUsedForBothTextAndWords() {
        // Al-Baqarah Warsh 200 maps to the app's 202, not 200.
        val content = resolveMushafSelection(listOf(202), { "text-$it" }, ::words)
        assertEquals(202, content.ayahNumber)
        assertEquals("text-202", content.text)
        assertEquals(202, content.wordInfo?.ayah)
        assertEquals("word-202", content.wordInfo?.words?.single()?.arabic)
    }

    @Test fun mergedWarshVerseIncludesBothAppVerses() {
        // The first Warsh ayah contains both Hafs 2:1 and 2:2.
        val content = resolveMushafSelection(listOf(1, 2), { "text-$it" }, ::words)
        assertEquals(1, content.ayahNumber)
        assertEquals("text-1\ntext-2", content.text)
        assertEquals(listOf("word-1", "word-2"), content.wordInfo?.words?.map { it.arabic })
        assertEquals(listOf(1, 2), content.wordInfo?.words?.map { it.position })
        assertEquals("grammar-1\n\ngrammar-2", content.wordInfo?.e3rab)
    }

    @Test fun missingWordDataDoesNotDisplayOnlyPartOfTheSelection() {
        assertNull(resolveMushafSelection(listOf(1, 2), { "text-$it" }, { if (it == 1) words(it) else null }).wordInfo)
    }

    @Test fun hafsIdentityReferenceStaysUnchanged() {
        val content = resolveMushafSelection(listOf(255), { "text-$it" }, ::words)
        assertEquals("text-255", content.text)
        assertEquals(words(255), content.wordInfo)
    }
}
