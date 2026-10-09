package com.Ameender.qurantracker.data

import org.junit.Assert.assertEquals
import org.junit.Test

class GroupAuthorNameTest {
    @Test fun currentProfileReplacesOldOfficialName() {
        assertEquals("Mijn profiel", resolveGroupAuthorName("Mijn profiel", "Official name"))
    }
    @Test fun explicitGroupNameAlsoWins() {
        assertEquals("قارئ", resolveGroupAuthorName(" قارئ ", "Previous name"))
    }
    @Test fun absentMemberKeepsHistoricalAttribution() {
        assertEquals("Previous name", resolveGroupAuthorName(null, "Previous name"))
        assertEquals("Lid", resolveGroupAuthorName(" ", null))
    }
}
