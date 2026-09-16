package com.Ameender.qurantracker.data

import org.junit.Assert.*
import org.junit.Test

class QuranNoteTargetTest {
    @Test fun allBoundariesAreOrderedAndValid() {
        val starts = (1..240).map { QuranStructure.start(QuranNoteTarget(NoteScope.RUB,it)) }
        starts.forEach { assertTrue(it.ayah in 1..QuranStructure.verseCounts[it.surah-1]) }
        assertEquals(240,starts.distinct().size)
        starts.zipWithNext().forEach { (a,b) -> assertTrue(a.surah < b.surah || a.surah == b.surah && a.ayah < b.ayah) }
        (1..60).forEach { assertEquals(starts[(it-1)*4],QuranStructure.start(QuranNoteTarget(NoteScope.HIZB,it))) }
        (1..30).forEach { assertEquals(starts[(it-1)*8],QuranStructure.start(QuranNoteTarget(NoteScope.JUZ,it))) }
    }
    @Test fun knownReferencesAndQuarterNumberingAreCorrect() {
        assertEquals(QuranStart(2,142),QuranStructure.start(QuranNoteTarget(NoteScope.HIZB,3)))
        assertEquals(QuranStart(9,93),QuranStructure.start(QuranNoteTarget(NoteScope.HIZB,21)))
        assertEquals(QuranStart(78,1),QuranStructure.start(QuranNoteTarget(NoteScope.JUZ,30)))
        assertEquals(QuranStart(4,1),QuranStructure.start(QuranNoteTarget(NoteScope.RUB,31)))
        val rub=QuranNoteTarget(NoteScope.RUB,71)
        assertEquals(18,rub.hizbNumber)
        assertEquals(3,rub.quarter)
    }
    @Test fun nonAyahNotesHaveNoArtificialAyah() {
        val original=AyahNote(surahId=12,ayahNumber=23,note="Reflection")
        val surah=original.withTarget(QuranNoteTarget(NoteScope.SURAH,12))
        assertNull(surah.ayahNumber)
        assertEquals(12,surah.surahId)
        val hizb=surah.withTarget(QuranNoteTarget(NoteScope.HIZB,18))
        assertNull(hizb.surahId)
        assertNull(hizb.ayahNumber)
        assertEquals(18,hizb.hizbNumber)
        hizb.validateTarget()
    }
    @Test fun invalidOrConflictingFieldsAreRejected() {
        listOf(QuranNoteTarget(NoteScope.JUZ,31),QuranNoteTarget(NoteScope.HIZB,0),
            QuranNoteTarget(NoteScope.RUB,241),QuranNoteTarget(NoteScope.AYAH,12),
            QuranNoteTarget(NoteScope.AYAH,12,112),QuranNoteTarget(NoteScope.SURAH,12,1)
        ).forEach { assertTrue(runCatching { it.validate() }.isFailure) }
        assertTrue(runCatching {
            AyahNote(scopeType="hizb",hizbNumber=18,surahId=7,ayahNumber=171,note="Wrong").validateTarget()
        }.isFailure)
    }
    @Test fun parentFiltersKeepOwnAndChildNotesDistinct() {
        val surah=QuranNoteTarget(NoteScope.SURAH,12)
        assertTrue(surah.includes(QuranNoteTarget(NoteScope.AYAH,12,23)))
        assertFalse(surah.includes(QuranNoteTarget(NoteScope.AYAH,13,23)))
        assertTrue(QuranNoteTarget(NoteScope.HIZB,18).includes(QuranNoteTarget(NoteScope.RUB,71)))
        assertFalse(QuranNoteTarget(NoteScope.HIZB,17).includes(QuranNoteTarget(NoteScope.RUB,71)))
    }
}
