package com.Ameender.qurantracker.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.Ameender.qurantracker.data.DailyGoal
import com.Ameender.qurantracker.data.GoalDataSource
import com.Ameender.qurantracker.data.ReadingJourney
import com.Ameender.qurantracker.data.GoalDay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class GoalViewModel(
    private val repository: GoalDataSource
) : ViewModel() {
    val goals = repository.goals.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val days = repository.days.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val sessions = repository.sessions.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val message = MutableStateFlow<String?>(null)
    init {
        viewModelScope.launch {
            while (true) {
                runCatching { repository.refreshDays() }.onFailure { message.value = it.message }
                delay(30_000)
            }
        }
    }
    fun saveDefinition(goal: DailyGoal) = perform { repository.saveGoalDefinition(goal) }
    fun saveJourneyPlan(enabled: Boolean, goal: DailyGoal, start: String, onResult: (String?) -> Unit) {
        viewModelScope.launch {
            val result = runCatching {
                repository.saveGoalDefinition(goal)
                repository.saveReadingJourney(enabled, 30, start, false)
            }
            onResult(result.exceptionOrNull()?.message)
        }
    }
    fun record(id: Int, date: String, amount: Int, unit: String, source: String, content: com.Ameender.qurantracker.data.GoalSessionContent) =
        perform { repository.record(id, date, amount, unit, source, content) }
    fun resolve(day: GoalDay, mode: String) = perform { repository.resolve(day, mode) }
    fun schedule(goal: DailyGoal, date: String, amount: Int, content: com.Ameender.qurantracker.data.GoalSessionContent) =
        perform { repository.schedule(goal, date, amount, content) }
    private fun perform(block: suspend () -> Unit) {
        viewModelScope.launch {
            runCatching { block() }.onSuccess { message.value = "Opgeslagen" }
                .onFailure { message.value = it.message ?: "Opslaan is niet gelukt" }
        }
    }
    val dailyGoal = repository.dailyGoal
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), DailyGoal())

    val readingJourney = repository.readingJourney
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), ReadingJourney())

    val todayCount = repository.todayCount
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val streak = repository.streak
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    fun saveGoal(unit: String, target: Int, hour: Int, minute: Int) {
        perform {
            repository.saveGoal(unit, target, hour, minute)
        }
    }

    fun saveReadingJourney(enabled: Boolean, totalDays: Int, startDate: String, autoDailyGoal: Boolean) {
        perform {
            repository.saveReadingJourney(enabled, totalDays, startDate, autoDailyGoal)
        }
    }

    fun unitLabel(unit: String): String = when (unit) {
        "rub" -> "rub"
        "hizb" -> "hizb"
        "juz" -> "juz"
        "pages" -> "pagina's"
        "ayahs" -> "ayahs"
        else -> ""
    }
}

fun deriveDailyGoalFromJourney(totalDays: Int): Pair<String, Int> =
    com.Ameender.qurantracker.domain.deriveDailyGoalFromJourney(totalDays)
