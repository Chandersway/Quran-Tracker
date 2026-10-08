package com.Ameender.qurantracker.ui

import java.util.Locale

internal data class RepeatReciter(val id: String, val name: String, val directory: String, val warsh: Boolean) {
    fun ayahUrl(surah: Int, ayah: Int): String =
        "https://everyayah.com/data/$directory/" + String.format(Locale.ROOT, "%03d%03d.mp3", surah, ayah)

    fun displayName(): String = "$name · ${if (warsh) "Warsh" else "Hafs"}"
}

// EveryAyah directories checked for individual 001001, 002001 and 114006 MP3 files.
internal val repeatReciters = listOf(
    RepeatReciter("alafasy", "Mishary Alafasy", "Alafasy_128kbps", false),
    RepeatReciter("husary_teacher", "Mahmoud Al-Husary (Muallim)", "Husary_Muallim_128kbps", false),
    RepeatReciter("maher", "Maher Al-Muaiqly", "MaherAlMuaiqly128kbps", false),
    RepeatReciter("minshawy", "Mohamed Al-Minshawi", "Minshawy_Murattal_128kbps", false),
    RepeatReciter("aldosari_warsh", "Ibrahim Al-Dosari", "warsh/warsh_ibrahim_aldosary_128kbps", true),
    RepeatReciter("abdulbasit_warsh", "Abdul Basit Abdul Samad", "warsh/warsh_Abdul_Basit_128kbps", true),
    RepeatReciter("yassin_warsh", "Yassin al-Jazaery", "warsh/warsh_yassin_al_jazaery_64kbps", true)
)

internal fun repeatReciterOptions(warsh: Boolean): List<RepeatReciter> = repeatReciters.filter { it.warsh == warsh }
