package com.Ameender.qurantracker.data

enum class NoteScope(val key: String) {
    JUZ("juz"), HIZB("hizb"), RUB("rub"), SURAH("surah"), AYAH("ayah");
    companion object { fun fromKey(key: String) = entries.first { it.key == key } }
}

/** RUB uses its global 1..240 number; its Hizb and quarter are derived. */
data class QuranNoteTarget(val scope: NoteScope, val number: Int, val ayah: Int? = null) {
    val hizbNumber: Int? get() = when (scope) {
        NoteScope.HIZB -> number
        NoteScope.RUB -> (number - 1) / 4 + 1
        else -> null
    }
    val quarter: Int? get() = if (scope == NoteScope.RUB) (number - 1) % 4 + 1 else null
    fun validate() {
        val range = when (scope) {
            NoteScope.JUZ -> 1..30
            NoteScope.HIZB -> 1..60
            NoteScope.RUB -> 1..240
            NoteScope.SURAH, NoteScope.AYAH -> 1..114
        }
        require(number in range) { "Invalid ${scope.key} number" }
        if (scope == NoteScope.AYAH) require(ayah != null && ayah in 1..QuranStructure.verseCounts[number - 1])
        else require(ayah == null) { "An ayah is only valid for an ayah note" }
    }
    fun includes(child: QuranNoteTarget): Boolean {
        if (this == child) return true
        return when (scope) {
            NoteScope.SURAH -> child.scope == NoteScope.AYAH && child.number == number
            NoteScope.HIZB -> child.scope == NoteScope.RUB && child.hizbNumber == number
            NoteScope.JUZ -> when (child.scope) {
                NoteScope.HIZB -> (child.number + 1) / 2 == number
                NoteScope.RUB -> (child.number - 1) / 8 + 1 == number
                else -> false
            }
            else -> false
        }
    }
}

data class QuranStart(val surah: Int, val ayah: Int)

/**
 * Partition boundaries derived from Tanzil Quran Metadata v1.0 (CC BY).
 * https://tanzil.net/docs/Quran_Metadata
 * https://tanzil.net/res/text/metadata/quran-data.xml
 * Arabic text is read from the app's existing Quran database.
 */
object QuranStructure {
    val verseCounts = listOf(7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6)
    private val quarterStarts = listOf(
        QuranStart(1, 1),
        QuranStart(2, 26),
        QuranStart(2, 44),
        QuranStart(2, 60),
        QuranStart(2, 75),
        QuranStart(2, 92),
        QuranStart(2, 106),
        QuranStart(2, 124),
        QuranStart(2, 142),
        QuranStart(2, 158),
        QuranStart(2, 177),
        QuranStart(2, 189),
        QuranStart(2, 203),
        QuranStart(2, 219),
        QuranStart(2, 233),
        QuranStart(2, 243),
        QuranStart(2, 253),
        QuranStart(2, 263),
        QuranStart(2, 272),
        QuranStart(2, 283),
        QuranStart(3, 15),
        QuranStart(3, 33),
        QuranStart(3, 52),
        QuranStart(3, 75),
        QuranStart(3, 93),
        QuranStart(3, 113),
        QuranStart(3, 133),
        QuranStart(3, 153),
        QuranStart(3, 171),
        QuranStart(3, 186),
        QuranStart(4, 1),
        QuranStart(4, 12),
        QuranStart(4, 24),
        QuranStart(4, 36),
        QuranStart(4, 58),
        QuranStart(4, 74),
        QuranStart(4, 88),
        QuranStart(4, 100),
        QuranStart(4, 114),
        QuranStart(4, 135),
        QuranStart(4, 148),
        QuranStart(4, 163),
        QuranStart(5, 1),
        QuranStart(5, 12),
        QuranStart(5, 27),
        QuranStart(5, 41),
        QuranStart(5, 51),
        QuranStart(5, 67),
        QuranStart(5, 82),
        QuranStart(5, 97),
        QuranStart(5, 109),
        QuranStart(6, 13),
        QuranStart(6, 36),
        QuranStart(6, 59),
        QuranStart(6, 74),
        QuranStart(6, 95),
        QuranStart(6, 111),
        QuranStart(6, 127),
        QuranStart(6, 141),
        QuranStart(6, 151),
        QuranStart(7, 1),
        QuranStart(7, 31),
        QuranStart(7, 47),
        QuranStart(7, 65),
        QuranStart(7, 88),
        QuranStart(7, 117),
        QuranStart(7, 142),
        QuranStart(7, 156),
        QuranStart(7, 171),
        QuranStart(7, 189),
        QuranStart(8, 1),
        QuranStart(8, 22),
        QuranStart(8, 41),
        QuranStart(8, 61),
        QuranStart(9, 1),
        QuranStart(9, 19),
        QuranStart(9, 34),
        QuranStart(9, 46),
        QuranStart(9, 60),
        QuranStart(9, 75),
        QuranStart(9, 93),
        QuranStart(9, 111),
        QuranStart(9, 122),
        QuranStart(10, 11),
        QuranStart(10, 26),
        QuranStart(10, 53),
        QuranStart(10, 71),
        QuranStart(10, 90),
        QuranStart(11, 6),
        QuranStart(11, 24),
        QuranStart(11, 41),
        QuranStart(11, 61),
        QuranStart(11, 84),
        QuranStart(11, 108),
        QuranStart(12, 7),
        QuranStart(12, 30),
        QuranStart(12, 53),
        QuranStart(12, 77),
        QuranStart(12, 101),
        QuranStart(13, 5),
        QuranStart(13, 19),
        QuranStart(13, 35),
        QuranStart(14, 10),
        QuranStart(14, 28),
        QuranStart(15, 1),
        QuranStart(15, 50),
        QuranStart(16, 1),
        QuranStart(16, 30),
        QuranStart(16, 51),
        QuranStart(16, 75),
        QuranStart(16, 90),
        QuranStart(16, 111),
        QuranStart(17, 1),
        QuranStart(17, 23),
        QuranStart(17, 50),
        QuranStart(17, 70),
        QuranStart(17, 99),
        QuranStart(18, 17),
        QuranStart(18, 32),
        QuranStart(18, 51),
        QuranStart(18, 75),
        QuranStart(18, 99),
        QuranStart(19, 22),
        QuranStart(19, 59),
        QuranStart(20, 1),
        QuranStart(20, 55),
        QuranStart(20, 83),
        QuranStart(20, 111),
        QuranStart(21, 1),
        QuranStart(21, 29),
        QuranStart(21, 51),
        QuranStart(21, 83),
        QuranStart(22, 1),
        QuranStart(22, 19),
        QuranStart(22, 38),
        QuranStart(22, 60),
        QuranStart(23, 1),
        QuranStart(23, 36),
        QuranStart(23, 75),
        QuranStart(24, 1),
        QuranStart(24, 21),
        QuranStart(24, 35),
        QuranStart(24, 53),
        QuranStart(25, 1),
        QuranStart(25, 21),
        QuranStart(25, 53),
        QuranStart(26, 1),
        QuranStart(26, 52),
        QuranStart(26, 111),
        QuranStart(26, 181),
        QuranStart(27, 1),
        QuranStart(27, 27),
        QuranStart(27, 56),
        QuranStart(27, 82),
        QuranStart(28, 12),
        QuranStart(28, 29),
        QuranStart(28, 51),
        QuranStart(28, 76),
        QuranStart(29, 1),
        QuranStart(29, 26),
        QuranStart(29, 46),
        QuranStart(30, 1),
        QuranStart(30, 31),
        QuranStart(30, 54),
        QuranStart(31, 22),
        QuranStart(32, 11),
        QuranStart(33, 1),
        QuranStart(33, 18),
        QuranStart(33, 31),
        QuranStart(33, 51),
        QuranStart(33, 60),
        QuranStart(34, 10),
        QuranStart(34, 24),
        QuranStart(34, 46),
        QuranStart(35, 15),
        QuranStart(35, 41),
        QuranStart(36, 28),
        QuranStart(36, 60),
        QuranStart(37, 22),
        QuranStart(37, 83),
        QuranStart(37, 145),
        QuranStart(38, 21),
        QuranStart(38, 52),
        QuranStart(39, 8),
        QuranStart(39, 32),
        QuranStart(39, 53),
        QuranStart(40, 1),
        QuranStart(40, 21),
        QuranStart(40, 41),
        QuranStart(40, 66),
        QuranStart(41, 9),
        QuranStart(41, 25),
        QuranStart(41, 47),
        QuranStart(42, 13),
        QuranStart(42, 27),
        QuranStart(42, 51),
        QuranStart(43, 24),
        QuranStart(43, 57),
        QuranStart(44, 17),
        QuranStart(45, 12),
        QuranStart(46, 1),
        QuranStart(46, 21),
        QuranStart(47, 10),
        QuranStart(47, 33),
        QuranStart(48, 18),
        QuranStart(49, 1),
        QuranStart(49, 14),
        QuranStart(50, 27),
        QuranStart(51, 31),
        QuranStart(52, 24),
        QuranStart(53, 26),
        QuranStart(54, 9),
        QuranStart(55, 1),
        QuranStart(56, 1),
        QuranStart(56, 75),
        QuranStart(57, 16),
        QuranStart(58, 1),
        QuranStart(58, 14),
        QuranStart(59, 11),
        QuranStart(60, 7),
        QuranStart(62, 1),
        QuranStart(63, 4),
        QuranStart(65, 1),
        QuranStart(66, 1),
        QuranStart(67, 1),
        QuranStart(68, 1),
        QuranStart(69, 1),
        QuranStart(70, 19),
        QuranStart(72, 1),
        QuranStart(73, 20),
        QuranStart(75, 1),
        QuranStart(76, 19),
        QuranStart(78, 1),
        QuranStart(80, 1),
        QuranStart(82, 1),
        QuranStart(84, 1),
        QuranStart(87, 1),
        QuranStart(90, 1),
        QuranStart(94, 1),
        QuranStart(100, 9)
    )
    fun start(target: QuranNoteTarget): QuranStart {
        target.validate()
        return when (target.scope) {
            NoteScope.JUZ -> quarterStarts[(target.number - 1) * 8]
            NoteScope.HIZB -> quarterStarts[(target.number - 1) * 4]
            NoteScope.RUB -> quarterStarts[target.number - 1]
            NoteScope.SURAH -> QuranStart(target.number, 1)
            NoteScope.AYAH -> QuranStart(target.number, target.ayah!!)
        }
    }
}
fun AyahNote.target(): QuranNoteTarget = when (NoteScope.fromKey(scopeType)) {
    NoteScope.JUZ -> QuranNoteTarget(NoteScope.JUZ, requireNotNull(juzNumber))
    NoteScope.HIZB -> QuranNoteTarget(NoteScope.HIZB, requireNotNull(hizbNumber))
    NoteScope.RUB -> QuranNoteTarget(NoteScope.RUB, requireNotNull(rubNumber))
    NoteScope.SURAH -> QuranNoteTarget(NoteScope.SURAH, requireNotNull(surahId))
    NoteScope.AYAH -> QuranNoteTarget(NoteScope.AYAH, requireNotNull(surahId), requireNotNull(ayahNumber))
}
fun AyahNote.withTarget(target: QuranNoteTarget): AyahNote {
    target.validate()
    return copy(scopeType = target.scope.key,
        juzNumber = target.number.takeIf { target.scope == NoteScope.JUZ },
        hizbNumber = target.number.takeIf { target.scope == NoteScope.HIZB },
        rubNumber = target.number.takeIf { target.scope == NoteScope.RUB },
        surahId = target.number.takeIf { target.scope == NoteScope.SURAH || target.scope == NoteScope.AYAH },
        ayahNumber = target.ayah.takeIf { target.scope == NoteScope.AYAH })
}
fun AyahNote.validateTarget() {
    val target = target()
    target.validate()
    require(withTarget(target).let {
        it.juzNumber == juzNumber && it.hizbNumber == hizbNumber && it.rubNumber == rubNumber &&
            it.surahId == surahId && it.ayahNumber == ayahNumber
    }) { "Irrelevant scope fields must be null" }
}

