package com.Ameender.qurantracker.data

/** Canonical verse coverage keeps surah/hizb/rub checkmarks consistent without rounding. */
object ReadingChecklistMapping {
    val total = QuranStructure.verseCounts.sum()
    fun index(point: QuranStart): Int = QuranStructure.verseCounts.take(point.surah - 1).sum() + point.ayah - 1
    fun point(index: Int): QuranStart {
        require(index in 0 until total)
        var remaining = index
        QuranStructure.verseCounts.forEachIndexed { surah, count ->
            if (remaining < count) return QuranStart(surah + 1, remaining + 1)
            remaining -= count
        }
        error("Invalid verse")
    }
    fun maximum(scope: NoteScope) = when (scope) {
        NoteScope.RUB -> 240; NoteScope.HIZB -> 60; NoteScope.JUZ -> 30; NoteScope.SURAH -> 114
        else -> error("Checklist supports partitions, not individual ayahs")
    }
    fun range(target: QuranNoteTarget): IntRange {
        target.validate()
        val max = maximum(target.scope)
        val start = index(QuranStructure.start(target))
        val end = if (target.number == max) total else index(QuranStructure.start(target.copy(number = target.number + 1)))
        return start until end
    }
    fun hizbAt(point: QuranStart): Int = (1..60).last { index(QuranStructure.start(QuranNoteTarget(NoteScope.HIZB, it))) <= index(point) }
}

data class ReadingChecklistState(
    val readVerses: Set<Int> = emptySet(),
    val position: QuranNoteTarget? = null
) {
    fun clearPosition() = copy(position = null)
    fun clearChecklist() = copy(readVerses = emptySet())
    fun completed(target: QuranNoteTarget) = ReadingChecklistMapping.range(target).all { it in readVerses }
    fun partial(target: QuranNoteTarget) = !completed(target) && ReadingChecklistMapping.range(target).any { it in readVerses }
    fun check(target: QuranNoteTarget, checked: Boolean): ReadingChecklistState {
        val range = ReadingChecklistMapping.range(target)
        return copy(readVerses = if (checked) readVerses + range else readVerses - range.toSet())
    }
    // Saving a position is explicit and never modifies checklist coverage.
    fun stopAt(target: QuranNoteTarget): ReadingChecklistState {
        ReadingChecklistMapping.range(target)
        return copy(position = target)
    }
    val next: QuranStart? get() {
        val nextIndex = position?.let { ReadingChecklistMapping.range(it).last + 1 } ?: 0
        return if (nextIndex < ReadingChecklistMapping.total) ReadingChecklistMapping.point(nextIndex) else null
    }
}
