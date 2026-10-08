package com.Ameender.qurantracker.ui

import org.junit.Assert.*
import org.junit.Test

class RepeatRecitersTest {
    @Test fun reciterSetsAndAyahUrls() {
        val hafs = repeatReciterOptions(false)
        val warsh = repeatReciterOptions(true)
        assertTrue(hafs.size > 1)
        assertTrue(warsh.size > 1)
        assertTrue(hafs.all { !it.warsh })
        assertTrue(warsh.all { it.warsh && it.directory.startsWith("warsh/") })
        assertEquals("https://everyayah.com/data/warsh/warsh_Abdul_Basit_128kbps/114006.mp3",
            warsh.first { it.id == "abdulbasit_warsh" }.ayahUrl(114, 6))
        assertEquals("https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3",
            hafs.first { it.id == "husary_teacher" }.ayahUrl(1, 1))
    }
}
