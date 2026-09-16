package com.Ameender.qurantracker.data

import com.Ameender.qurantracker.domain.QuranAction
import com.Ameender.qurantracker.domain.QuranProgressType
import com.Ameender.qurantracker.domain.hizbProgressId
import com.Ameender.qurantracker.domain.juzProgressId
import com.Ameender.qurantracker.domain.rubProgressId
import com.Ameender.qurantracker.domain.surahProgressId
import com.Ameender.qurantracker.domain.todayDateKey
import kotlinx.coroutines.flow.Flow

interface QuranProgressDataSource {
    val allProgress: Flow<List<QuranProgress>>
    val juzzProgress: Flow<List<QuranProgress>>
    val hizbProgress: Flow<List<QuranProgress>>
    val rubProgress: Flow<List<QuranProgress>>
    val surahProgress: Flow<List<QuranProgress>>
    val recentHistory: Flow<List<ReadingHistory>>
    val allHistory: Flow<List<ReadingHistory>>
    val mostReadSurahs: Flow<List<SurahReadCount>>
    val mostReadHizb: Flow<List<HizbReadCount>>
    val totalReadCount: Flow<Int>
    val allTypeCounts: Flow<List<TypeCount>>

    fun dayActivitySince(since: Long): Flow<List<DayActivity>>
    suspend fun markJuzRead(juzNumber: Int)
    suspend fun removeJuz(juzNumber: Int)
    suspend fun markRubRead(hizbNumber: Int, rubNumber: Int)
    suspend fun removeRub(hizbNumber: Int, rubNumber: Int)
    suspend fun markSurah(surahId: Int, surahName: String, field: String)
    suspend fun removeSurah(surahId: Int, field: String)
    suspend fun updateHifzScore(type: String, number: Int, score: Int)
    suspend fun updateHifzScoreRange(type: String, from: Int, to: Int, score: Int)
    suspend fun resetHistory()
}

class QuranProgressRepository(
    private val progressDao: QuranDao,
    private val historyDao: ReadingHistoryDao
) : QuranProgressDataSource {
    override val allProgress = progressDao.getAllProgress()
    override val juzzProgress = progressDao.getByType(QuranProgressType.JUZ)
    override val hizbProgress = progressDao.getByType(QuranProgressType.HIZB)
    override val rubProgress = progressDao.getByType(QuranProgressType.RUB)
    override val surahProgress = progressDao.getByType(QuranProgressType.SURAH)

    override val recentHistory = historyDao.getRecent()
    override val allHistory = historyDao.getAll()
    override val mostReadSurahs = historyDao.getMostRead()
    override val mostReadHizb = historyDao.getMostReadHizb()
    override val totalReadCount = historyDao.getTotalReadCount()
    override val allTypeCounts = historyDao.getAllTypeCounts()

    override fun dayActivitySince(since: Long) = historyDao.getActivityPerDay(since)

    override suspend fun markJuzRead(juzNumber: Int) {
        val existing = progressDao.getById(juzProgressId(juzNumber))
        progressDao.upsertProgress(
            existing?.copy(isRead = true, readCount = existing.readCount + 1) ?: QuranProgress(
                id = juzProgressId(juzNumber),
                type = QuranProgressType.JUZ,
                referenceId = juzNumber,
                isRead = true,
                readCount = (existing?.readCount ?: 0) + 1
            )
        )
        historyDao.insert(
            ReadingHistory(
                surahId = juzNumber,
                surahName = "Juz $juzNumber",
                type = QuranProgressType.JUZ,
                action = QuranAction.READ,
                dateKey = todayDateKey()
            )
        )
    }

    override suspend fun removeJuz(juzNumber: Int) {
        val existing = progressDao.getById(juzProgressId(juzNumber)) ?: return
        progressDao.upsertProgress(
            existing.copy(isRead = false, readCount = 0)
        )
    }

    override suspend fun markRubRead(hizbNumber: Int, rubNumber: Int) {
        val existing = progressDao.getById(rubProgressId(hizbNumber, rubNumber))
        progressDao.upsertProgress(
            QuranProgress(
                id = rubProgressId(hizbNumber, rubNumber),
                type = QuranProgressType.RUB,
                referenceId = hizbNumber,
                subId = rubNumber,
                isRead = true,
                readCount = (existing?.readCount ?: 0) + 1
            )
        )

        val hizbInfo = getHizbInfo(hizbNumber)
        val rubLabel = when (rubNumber) {
            1 -> "1/4"
            2 -> "1/2"
            3 -> "3/4"
            else -> "1"
        }
        val richName = if (hizbInfo != null) {
            "Hizb $hizbNumber ($rubLabel) - ${hizbInfo.startText.take(30)}"
        } else {
            "Hizb $hizbNumber ($rubLabel)"
        }

        historyDao.insert(
            ReadingHistory(
                surahId = hizbNumber,
                surahName = richName,
                type = QuranProgressType.RUB,
                action = QuranAction.READ,
                dateKey = todayDateKey(),
                extraInfo = hizbInfo?.startText ?: ""
            )
        )
    }

    override suspend fun removeRub(hizbNumber: Int, rubNumber: Int) {
        progressDao.upsertProgress(
            QuranProgress(
                id = rubProgressId(hizbNumber, rubNumber),
                type = QuranProgressType.RUB,
                referenceId = hizbNumber,
                subId = rubNumber,
                isRead = false,
                readCount = 0
            )
        )
        val markers = rubHistoryMarkers(rubNumber)
        historyDao.deleteRubReadForDay(
            hizbNumber = hizbNumber,
            dateKey = todayDateKey(),
            markerA = markers[0],
            markerB = markers[1],
            markerC = markers[2]
        )
    }

    override suspend fun markSurah(surahId: Int, surahName: String, field: String) {
        val existing = progressDao.getById(surahProgressId(surahId))
        val updated = existing?.copy(
            isRead = if (field == QuranAction.READ) true else existing.isRead,
            isMemorized = if (field == QuranAction.MEMORIZED) true else existing.isMemorized,
            readCount = if (field == QuranAction.READ) existing.readCount + 1 else existing.readCount
        ) ?: QuranProgress(
            id = surahProgressId(surahId),
            type = QuranProgressType.SURAH,
            referenceId = surahId,
            isRead = field == QuranAction.READ,
            isMemorized = field == QuranAction.MEMORIZED,
            readCount = if (field == QuranAction.READ) 1 else 0
        )
        progressDao.upsertProgress(updated)

        historyDao.insert(
            ReadingHistory(
                surahId = surahId,
                surahName = surahName,
                type = QuranProgressType.SURAH,
                action = field,
                dateKey = todayDateKey(),
                extraInfo = ""
            )
        )
    }

    override suspend fun removeSurah(surahId: Int, field: String) {
        val existing = progressDao.getById(surahProgressId(surahId)) ?: return
        progressDao.upsertProgress(
            existing.copy(
                isRead = if (field == QuranAction.READ) false else existing.isRead,
                isMemorized = if (field == QuranAction.MEMORIZED) false else existing.isMemorized,
                readCount = if (field == QuranAction.READ) 0 else existing.readCount
            )
        )
    }

    override suspend fun updateHifzScore(type: String, number: Int, score: Int) {
        require(number in 1..hifzScopeLimit(type)) { "Ongeldig Qur'an-onderdeel voor een hifz-score." }
        val safeScore = score.coerceIn(0, 100)
        val id = progressId(type, number)
        val existing = progressDao.getById(id)
        val updated = existing?.copy(
            progress = safeScore,
            hasHifzScore = safeScore > 0,
            lastUpdated = System.currentTimeMillis()
        ) ?: QuranProgress(
            id = id,
            type = type,
            referenceId = number,
            progress = safeScore,
            hasHifzScore = safeScore > 0
        )
        progressDao.upsertProgress(updated)
    }

    override suspend fun updateHifzScoreRange(type: String, from: Int, to: Int, score: Int) {
        val maxValue = hifzScopeLimit(type)
        val start = from.coerceIn(1, maxValue)
        val end = to.coerceIn(1, maxValue)
        val range = if (start <= end) start..end else end..start
        range.forEach { number -> updateHifzScore(type, number, score) }
    }

    override suspend fun resetHistory() {
        historyDao.deleteAll()
    }

    private fun progressId(type: String, number: Int): String = when (type) {
        QuranProgressType.JUZ -> juzProgressId(number)
        QuranProgressType.HIZB -> hizbProgressId(number)
        QuranProgressType.SURAH -> surahProgressId(number)
        else -> "${type}_$number"
    }

    private fun rubHistoryMarkers(rubNumber: Int): List<String> = when (rubNumber) {
        1 -> listOf("(1/4)", "(¼)", "(Â¼)")
        2 -> listOf("(1/2)", "(½)", "(Â½)")
        3 -> listOf("(3/4)", "(¾)", "(Â¾)")
        else -> listOf("(1)", "(4/4)", "(1)")
    }
}

internal fun hifzScopeLimit(type: String): Int = when (type) {
    QuranProgressType.JUZ -> 30
    QuranProgressType.HIZB -> 60
    QuranProgressType.SURAH -> 114
    else -> throw IllegalArgumentException("Ongeldig type voor een hifz-score.")
}
