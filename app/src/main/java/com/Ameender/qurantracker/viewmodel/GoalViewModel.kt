package com.Ameender.qurantracker.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.Ameender.qurantracker.data.DailyGoal
import com.Ameender.qurantracker.data.QuranDatabase
import com.Ameender.qurantracker.data.ReadingJourney
import com.Ameender.qurantracker.scheduleDailyReminder
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class GoalViewModel(application: Application) : AndroidViewModel(application) {

    private val db          = QuranDatabase.getDatabase(application)
    private val goalDao     = db.dailyGoalDao()
    private val historyDao  = db.readingHistoryDao()
    private val journeyDao  = db.readingJourneyDao()

    // Huidig doel
    val dailyGoal = goalDao.getGoal()
        .map { it ?: DailyGoal() }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), DailyGoal())

    val readingJourney = journeyDao.getJourney()
        .map { it ?: ReadingJourney(startDate = todayKey()) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), ReadingJourney(startDate = todayKey()))

    // Geschiedenis van vandaag
    private val todayHistory = historyDao.getRecent()
        .map { history ->
            val todayKey = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            history.filter { it.dateKey == todayKey && it.action == "read" }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Hoeveel vandaag gelezen (in gekozen eenheid)
    val todayCount = combine(dailyGoal, todayHistory) { goal, history ->
        when (goal.unit) {
            "rub"   -> history.count { it.type == "hizb" }
            "hizb"  -> history.count { it.type == "hizb" } / 4
            "juz"   -> history.count { it.type == "juz" }
            "pages" -> history.count { it.type == "surah" } * 2
            "ayahs" -> history.count { it.type == "surah" } * 10
            else    -> history.size
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    // Streak — hoeveel dagen op rij doel gehaald
    val streak = historyDao.getAll()
        .map { allHistory ->
            var streak = 0
            val sdf    = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val cal    = Calendar.getInstance()

            // Check elke dag terug
            repeat(365) {
                val dayKey   = sdf.format(cal.time)
                val dayItems = allHistory.filter { it.dateKey == dayKey && it.action == "read" }
                if (dayItems.isNotEmpty()) {
                    streak++
                    cal.add(Calendar.DAY_OF_YEAR, -1)
                } else {
                    return@map streak
                }
            }
            streak
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    // Doel opslaan en herinnering plannen
    fun saveGoal(unit: String, target: Int, hour: Int, minute: Int) {
        viewModelScope.launch {
            goalDao.upsertGoal(
                DailyGoal(
                    unit           = unit,
                    target         = target,
                    reminderHour   = hour,
                    reminderMinute = minute
                )
            )
            // Plan herinnering opnieuw
            scheduleDailyReminder(getApplication(), hour, minute)
        }
    }

    fun saveReadingJourney(enabled: Boolean, totalDays: Int, startDate: String, autoDailyGoal: Boolean) {
        viewModelScope.launch {
            val safeDays = totalDays.coerceIn(1, 240)
            journeyDao.upsertJourney(
                ReadingJourney(
                    enabled = enabled,
                    totalDays = safeDays,
                    startDate = startDate.ifBlank { todayKey() },
                    autoDailyGoal = autoDailyGoal,
                    updatedAt = System.currentTimeMillis()
                )
            )
            if (enabled && autoDailyGoal) {
                val currentGoal = goalDao.getGoalOnce() ?: DailyGoal()
                val derived = deriveDailyGoalFromJourney(safeDays)
                goalDao.upsertGoal(
                    currentGoal.copy(
                        unit = derived.first,
                        target = derived.second
                    )
                )
            }
        }
    }

    // Eenheid label
    fun unitLabel(unit: String): String = when (unit) {
        "rub"   -> "rub"
        "hizb"  -> "hizb"
        "juz"   -> "juz"
        "pages" -> "pagina's"
        "ayahs" -> "ayahs"
        else    -> ""
    }
}

fun deriveDailyGoalFromJourney(totalDays: Int): Pair<String, Int> {
    val partsPerDay = kotlin.math.ceil(240.0 / totalDays.coerceIn(1, 240)).toInt().coerceAtLeast(1)
    return when {
        partsPerDay % 8 == 0 -> "juz" to (partsPerDay / 8).coerceAtLeast(1)
        partsPerDay % 4 == 0 -> "hizb" to (partsPerDay / 4).coerceAtLeast(1)
        else -> "rub" to partsPerDay
    }
}

private fun todayKey(): String =
    SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
