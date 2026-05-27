package com.Ameender.qurantracker.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.Ameender.qurantracker.data.*
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class QuranViewModel(application: Application) : AndroidViewModel(application) {

    private val db         = QuranDatabase.getDatabase(application)
    private val dao        = db.quranDao()
    private val historyDao = db.readingHistoryDao()

    // ── Voortgang ─────────────────────────────────────────
    val allProgress = dao.getAllProgress()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val juzzProgress = dao.getByType("juz")
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val hizbProgress = dao.getByType("hizb")
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val rubProgress = dao.getByType("rub")
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val surahProgress = dao.getByType("surah")
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // ── Geschiedenis & Statistieken ───────────────────────
    val recentHistory = historyDao.getRecent()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allHistory = historyDao.getAll()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val mostReadSurahs = historyDao.getMostRead()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val mostReadHizb = historyDao.getMostReadHizb()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val totalReadCount = historyDao.getTotalReadCount()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val dayActivity = historyDao.getActivityPerDay(
        since = System.currentTimeMillis() - 7L * 24 * 60 * 60 * 1000
    ).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allTypeCounts = historyDao.getAllTypeCounts()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // ── Juz optellen ──────────────────────────────────────

    fun confirmToggleJuz(juzNumber: Int, currentValue: Boolean) {
        viewModelScope.launch {
            val existing = dao.getById("juz_$juzNumber")
            val newCount = (existing?.readCount ?: 0) + 1
            dao.upsertProgress(
                QuranProgress(
                    id          = "juz_$juzNumber",
                    type        = "juz",
                    referenceId = juzNumber,
                    isRead      = true,
                    readCount   = newCount
                )
            )
            val dateKey = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            historyDao.insert(
                ReadingHistory(
                    surahId   = juzNumber,
                    surahName = "Juz $juzNumber",
                    type      = "juz",
                    action    = "read",
                    dateKey   = dateKey
                )
            )
        }
    }

    fun confirmToggleJuz(juzNumber: Int) = confirmToggleJuz(juzNumber, false)

    // ── Juz verwijderen ───────────────────────────────────

    fun removeJuz(juzNumber: Int) {
        viewModelScope.launch {
            dao.upsertProgress(
                QuranProgress(
                    id          = "juz_$juzNumber",
                    type        = "juz",
                    referenceId = juzNumber,
                    isRead      = false,
                    readCount   = 0
                )
            )
        }
    }

    // ── Hizb / Rub optellen ───────────────────────────────

    fun confirmToggleRub(hizbNumber: Int, rubNumber: Int, currentValue: Boolean) {
        viewModelScope.launch {
            val existing  = dao.getById("rub_${hizbNumber}_$rubNumber")
            val newCount  = (existing?.readCount ?: 0) + 1
            dao.upsertProgress(
                QuranProgress(
                    id          = "rub_${hizbNumber}_$rubNumber",
                    type        = "rub",
                    referenceId = hizbNumber,
                    subId       = rubNumber,
                    isRead      = true,
                    readCount   = newCount
                )
            )
            // Hizb info ophalen voor rijke naam
            val hizbInfo  = getHizbInfo(hizbNumber)
            val rubLabel  = when (rubNumber) { 1 -> "¼"; 2 -> "½"; 3 -> "¾"; else -> "1" }
            val richName  = if (hizbInfo != null)
                "حزب $hizbNumber ($rubLabel) — ${hizbInfo.startText.take(30)}"
            else
                "Hizb $hizbNumber ($rubLabel)"

            val dateKey = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            historyDao.insert(
                ReadingHistory(
                    surahId   = hizbNumber,
                    surahName = richName,
                    type      = "hizb",
                    action    = "read",
                    dateKey   = dateKey,
                    extraInfo = hizbInfo?.startText ?: ""
                )
            )
        }
    }

    // ── Hizb / Rub verwijderen ────────────────────────────

    fun removeRub(hizbNumber: Int, rubNumber: Int) {
        viewModelScope.launch {
            dao.upsertProgress(
                QuranProgress(
                    id          = "rub_${hizbNumber}_$rubNumber",
                    type        = "rub",
                    referenceId = hizbNumber,
                    subId       = rubNumber,
                    isRead      = false,
                    readCount   = 0
                )
            )
        }
    }

    // ── Soera optellen ────────────────────────────────────

    fun confirmToggleSurah(surahId: Int, surahName: String, field: String, currentValue: Boolean) {
        viewModelScope.launch {
            val existing     = dao.getById("surah_$surahId")
            val newReadCount = if (field == "read") (existing?.readCount ?: 0) + 1
            else existing?.readCount ?: 0
            val updated = existing?.copy(
                isRead      = if (field == "read")      true else existing.isRead,
                isMemorized = if (field == "memorized") true else existing.isMemorized,
                readCount   = newReadCount
            ) ?: QuranProgress(
                id          = "surah_$surahId",
                type        = "surah",
                referenceId = surahId,
                isRead      = field == "read",
                isMemorized = field == "memorized",
                readCount   = if (field == "read") 1 else 0
            )
            dao.upsertProgress(updated)

            val dateKey = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            historyDao.insert(
                ReadingHistory(
                    surahId   = surahId,
                    surahName = surahName,
                    type      = "surah",
                    action    = field,
                    dateKey   = dateKey,
                    extraInfo = ""
                )
            )
        }
    }

    // ── Soera verwijderen ─────────────────────────────────

    fun removeSurah(surahId: Int, surahName: String, field: String) {
        viewModelScope.launch {
            val existing = dao.getById("surah_$surahId")
            if (existing != null) {
                val updated = existing.copy(
                    isRead      = if (field == "read")      false else existing.isRead,
                    isMemorized = if (field == "memorized") false else existing.isMemorized,
                    readCount   = if (field == "read")      0     else existing.readCount
                )
                dao.upsertProgress(updated)
            }
        }
    }

    // ── Reset geschiedenis ────────────────────────────────

    fun updateSurahHifzScore(surahId: Int, score: Int) {
        viewModelScope.launch {
            val existing = dao.getById("surah_$surahId")
            val updated = existing?.copy(
                progress = score.coerceIn(0, 100),
                hasHifzScore = true,
                lastUpdated = System.currentTimeMillis()
            ) ?: QuranProgress(
                id = "surah_$surahId",
                type = "surah",
                referenceId = surahId,
                progress = score.coerceIn(0, 100),
                hasHifzScore = true
            )
            dao.upsertProgress(updated)
        }
    }

    fun updateJuzHifzScore(juzNumber: Int, score: Int) {
        viewModelScope.launch {
            val existing = dao.getById("juz_$juzNumber")
            val updated = existing?.copy(
                progress = score.coerceIn(0, 100),
                hasHifzScore = true,
                lastUpdated = System.currentTimeMillis()
            ) ?: QuranProgress(
                id = "juz_$juzNumber",
                type = "juz",
                referenceId = juzNumber,
                progress = score.coerceIn(0, 100),
                hasHifzScore = true
            )
            dao.upsertProgress(updated)
        }
    }

    fun updateHizbHifzScore(hizbNumber: Int, score: Int) {
        viewModelScope.launch {
            val existing = dao.getById("hizb_$hizbNumber")
            val updated = existing?.copy(
                progress = score.coerceIn(0, 100),
                hasHifzScore = true,
                lastUpdated = System.currentTimeMillis()
            ) ?: QuranProgress(
                id = "hizb_$hizbNumber",
                type = "hizb",
                referenceId = hizbNumber,
                progress = score.coerceIn(0, 100),
                hasHifzScore = true
            )
            dao.upsertProgress(updated)
        }
    }

    fun updateHifzScoreRange(type: String, from: Int, to: Int, score: Int) {
        viewModelScope.launch {
            val safeScore = score.coerceIn(0, 100)
            val maxValue = when (type) {
                "juz" -> 30
                "hizb" -> 60
                else -> 114
            }
            val start = from.coerceIn(1, maxValue)
            val end = to.coerceIn(1, maxValue)
            val range = if (start <= end) start..end else end..start

            range.forEach { number ->
                val id = "${type}_$number"
                val existing = dao.getById(id)
                val updated = existing?.copy(
                    progress = safeScore,
                    hasHifzScore = true,
                    lastUpdated = System.currentTimeMillis()
                ) ?: QuranProgress(
                    id = id,
                    type = type,
                    referenceId = number,
                    progress = safeScore,
                    hasHifzScore = true
                )
                dao.upsertProgress(updated)
            }
        }
    }

    fun resetHistory() {
        viewModelScope.launch {
            historyDao.deleteAll()
        }
    }
}
