package com.Ameender.qurantracker.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

/** Separate from history/goals: works offline and requires no account or session. */
class ReadingChecklistStore(context: Context, name: String = "reading_checklist_v1") {
    private val prefs = context.applicationContext.getSharedPreferences(name, Context.MODE_PRIVATE)
    companion object { private val mutex = Mutex() }
    private fun read(): ReadingChecklistState {
        val checked = prefs.getStringSet("verses", emptySet()).orEmpty().mapNotNull { it.toIntOrNull() }
            .filter { it in 0 until ReadingChecklistMapping.total }.toSet()
        val position = runCatching {
            val scope = prefs.getString("position_scope", null) ?: return@runCatching null
            QuranNoteTarget(NoteScope.fromKey(scope), prefs.getInt("position_number", 0)).also { ReadingChecklistMapping.range(it) }
        }.getOrNull()
        return ReadingChecklistState(checked, position)
    }
    suspend fun load() = withContext(Dispatchers.IO) { mutex.withLock { read() } }
    suspend fun update(change: (ReadingChecklistState) -> ReadingChecklistState) = withContext(Dispatchers.IO) {
        mutex.withLock {
            val next = change(read())
            check(prefs.edit().putStringSet("verses", next.readVerses.map { it.toString() }.toSet())
                .putString("position_scope", next.position?.scope?.key)
                .putInt("position_number", next.position?.number ?: 0).commit()) { "Progress could not be saved" }
            next
        }
    }
}
