package com.Ameender.qurantracker.data

import androidx.room.withTransaction
import com.Ameender.qurantracker.domain.deriveDailyGoalFromJourney
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlin.math.ceil

interface GoalDataSource {
    val dailyGoal: Flow<DailyGoal>
    val goals: Flow<List<DailyGoal>>
    val days: Flow<List<GoalDayProgress>>
    val sessions: Flow<List<PlanningItem>>
    val readingJourney: Flow<ReadingJourney>
    val todayCount: Flow<Int>
    val streak: Flow<Int>
    suspend fun refreshDays()
    suspend fun saveGoal(unit: String, target: Int, hour: Int, minute: Int)
    suspend fun saveGoalDefinition(goal: DailyGoal)
    suspend fun record(goalId: Int, date: String, amount: Int, unit: String, source: String, content: GoalSessionContent)
    suspend fun resolve(day: GoalDay, mode: String)
    suspend fun schedule(goal: DailyGoal, date: String, amount: Int, content: GoalSessionContent)
    suspend fun saveReadingJourney(enabled: Boolean, totalDays: Int, startDate: String, autoDailyGoal: Boolean)
}

class GoalRepository(
    private val database: QuranDatabase,
    private val reminderScheduler: ReminderScheduler
) : GoalDataSource {
    private val goalDao = database.dailyGoalDao()
    private val historyDao = database.readingHistoryDao()
    private val journeyDao = database.readingJourneyDao()
    private val dayDao = database.goalDayDao()
    override val sessions = database.planningItemDao().getAll()
    private val calendar = flow {
        while (true) { emit(LocalDate.now().toString()); delay(30_000) }
    }.distinctUntilChanged()

    override val goals = goalDao.getGoals().map { rows ->
        (1..3).map { id -> rows.find { it.id == id } ?: defaultGoal(id) }
    }
    private val readingDefinition = goals.map { it.first() }
    override val dailyGoal = combine(readingDefinition, dayDao.observe(), calendar) { goal, saved, today ->
        val day = saved.find { it.goalId == 1 && it.date == today }
        goal.copy(target = day?.let { it.target + it.extra } ?: goal.target)
    }
    override val days = combine(dayDao.observe(), historyDao.getAll(), goals, calendar) { saved, history, definitions, today ->
        val projected = (0..7).flatMap { offset ->
            val date = LocalDate.parse(today).plusDays(offset.toLong()).toString()
            definitions.filter { it.target > 0 }.map { goal ->
                saved.find { it.goalId == goal.id && it.date == date }
                    ?: GoalDay(goal.id, date, goal.unit, goal.target)
            }
        }
        (saved + projected).distinctBy { it.goalId to it.date }
            .map { goalProgress(it, history) }.sortedWith(compareBy({ it.day.date }, { it.day.goalId }))
    }
    override val readingJourney = combine(journeyDao.getJourney(), readingDefinition, historyDao.getAll(), calendar) { stored, goal, history, today ->
        val journey = stored ?: ReadingJourney(startDate = today)
        if (!journey.enabled || goal.unit == "minutes" || goal.target <= 0) journey else {
            val start = runCatching { LocalDate.parse(journey.startDate) }.getOrDefault(LocalDate.parse(today))
            val elapsed = ChronoUnit.DAYS.between(start, LocalDate.parse(today)).coerceAtLeast(0).toInt()
            val completed = journeyFraction(history.filter { it.dateKey >= start.toString() })
            val pace = unitQuranFraction(goal.unit) * goal.target
            val remainingDays = ceil((1.0 - completed).coerceAtLeast(0.0) / pace).toInt()
            journey.copy(totalDays = (elapsed + remainingDays).coerceAtLeast(1))
        }
    }
    override val todayCount = combine(dailyGoal, historyDao.getAll(), calendar) { goal, history, today ->
        goalProgress(GoalDay(1, today, goal.unit, goal.target), history).done
    }
    override val streak = combine(historyDao.getAll(), calendar) { history, today ->
        val dates = history.filter { it.action == "read" }.map { it.dateKey }.toSet()
        var cursor = LocalDate.parse(today)
        if (cursor.toString() !in dates) cursor = cursor.minusDays(1)
        var count = 0
        while (cursor.toString() in dates) { count++; cursor = cursor.minusDays(1) }
        count
    }

    override suspend fun refreshDays() = database.withTransaction {
        val today = LocalDate.now()
        val definitions = goalDao.getGoalsOnce().toMutableList()
        if (definitions.none { it.id == 1 }) {
            definitions.add(defaultGoal(1)); goalDao.upsertGoal(defaultGoal(1))
        }
        val saved = dayDao.all()
        for (goal in definitions.filter { it.target > 0 }) {
            val latest = saved.filter { it.goalId == goal.id && it.date <= today.toString() }.maxByOrNull { it.date }
            var date = latest?.let { LocalDate.parse(it.date).plusDays(1) } ?: today
            while (date <= today) {
                if (saved.none { it.goalId == goal.id && it.date == date.toString() })
                    dayDao.save(GoalDay(goal.id, date.toString(), goal.unit, goal.target))
                date = date.plusDays(1)
            }
        }
    }

    override suspend fun saveGoal(unit: String, target: Int, hour: Int, minute: Int) =
        saveGoalDefinition(DailyGoal(unit = unit, target = target, reminderHour = hour, reminderMinute = minute))

    override suspend fun saveGoalDefinition(goal: DailyGoal) {
        require(goal.id in 1..3 && goal.unit in goalUnits)
        require(goal.target in 0..10000 && goal.reminderHour in 0..23 && goal.reminderMinute in 0..59)
        refreshDays()
        database.withTransaction {
            goalDao.upsertGoal(goal)
            val today = LocalDate.now().toString()
            val affected = dayDao.all().filter { it.goalId == goal.id && it.date >= today }
            (affected + GoalDay(goal.id, today, goal.unit, goal.target)).distinctBy { it.date }.forEach { day ->
                require(day.extra == 0 || day.unit == goal.unit) { "Werk eerst de doorgeschoven hoeveelheid af voordat je de eenheid wijzigt." }
                dayDao.save(day.copy(unit = goal.unit, target = goal.target))
            }
        }
        if (goal.id == 1) reminderScheduler.scheduleDaily(goal.reminderHour, goal.reminderMinute)
    }

    override suspend fun record(
        goalId: Int,
        date: String,
        amount: Int,
        unit: String,
        source: String,
        content: GoalSessionContent
    ) {
        require(goalId in 1..3 && amount in 1..10000 && LocalDate.parse(date) <= LocalDate.now())
        require(unit in goalUnits || unit == "surah")
        requireValidContent(content)
        refreshDays()
        database.withTransaction {
        val planId = source.removePrefix("planning:").toIntOrNull().takeIf { source.startsWith("planning:") }
        val plan = planId?.let { database.planningItemDao().getOnce(it) }
        if (planId != null) {
            require(plan != null && plan.goalId == goalId && plan.measurementUnit == unit && plan.amount == amount)
            require(plan.type == content.type && plan.referenceId == content.referenceId && plan.subId == content.subId)
            if (plan.historyLogged) return@withTransaction
        }
        historyDao.insertOnce(ReadingHistory(
            surahId = content.referenceId, surahName = content.displayName, type = unit, action = goalAction(goalId),
            dateKey = date, amount = amount, sourceKey = source,
            contentType = content.type,
            timestamp = LocalDate.parse(date).atTime(java.time.LocalTime.now()).atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli()
        ))
        if (plan != null) {
            database.planningItemDao().setDoneAndHistoryLogged(plan.id, true, true)
            database.planningItemDao().setReminder(plan.id, null, null)
            reminderScheduler.cancelPlanning(plan.id)
        }
        }
    }

    override suspend fun schedule(goal: DailyGoal, date: String, amount: Int, content: GoalSessionContent) {
        require(amount in 1..10000 && LocalDate.parse(date) >= LocalDate.now())
        requireValidContent(content)
        val label = when(goal.id) { 2 -> "Hifdh"; 3 -> "Murājaʿah"; else -> "Lezen" }
        database.planningItemDao().insert(PlanningItem(
            date = date,
            type = content.type,
            referenceId = content.referenceId,
            subId = content.subId,
            displayName = "$label · ${content.displayName}",
            goalId = goal.id,
            amount = amount,
            measurementUnit = content.type
        ))
    }

    override suspend fun resolve(day: GoalDay, mode: String) = database.withTransaction {
        require(mode in listOf("carry", "spread", "skip") && day.date < LocalDate.now().toString())
        val rows = dayDao.all()
        val current = rows.find { it.goalId == day.goalId && it.date == day.date } ?: return@withTransaction
        if (current.resolution.isNotEmpty()) return@withTransaction
        val remaining = goalProgress(current, historyDao.getAllOnce()).remaining
        val definition = goalDao.getGoalsOnce().find { it.id == day.goalId } ?: return@withTransaction
        require(current.unit == definition.unit || mode == "skip") { "De eenheid is gewijzigd. Je kunt dit oude doel bewust overslaan." }
        val count = if (mode == "spread") 3 else if (mode == "carry") 1 else 0
        repeat(count) { index ->
            val date = LocalDate.now().plusDays(index.toLong()).toString()
            val target = rows.find { it.goalId == day.goalId && it.date == date }
                ?: GoalDay(day.goalId, date, definition.unit, definition.target)
            val extra = remaining / count + if (index < remaining % count) 1 else 0
            dayDao.save(target.copy(extra = target.extra + extra))
        }
        dayDao.save(current.copy(resolution = mode))
    }

    override suspend fun saveReadingJourney(enabled: Boolean, totalDays: Int, startDate: String, autoDailyGoal: Boolean) {
        refreshDays()
        database.withTransaction {
            val previous = journeyDao.getJourneyOnce()
            journeyDao.upsertJourney(ReadingJourney(enabled = enabled, totalDays = totalDays.coerceIn(1, 10000),
                startDate = previous?.startDate?.takeIf { it.isNotBlank() } ?: startDate,
                autoDailyGoal = true))
        }
        if (enabled && autoDailyGoal) {
            val derived = deriveDailyGoalFromJourney(totalDays)
            saveGoalDefinition((goalDao.getGoalOnce() ?: DailyGoal()).copy(unit = derived.first, target = derived.second))
        }
    }
}

private fun requireValidContent(content: GoalSessionContent) {
    val range = when (content.type) {
        "surah" -> 1..114
        "hizb" -> 1..60
        "juz" -> 1..30
        else -> IntRange.EMPTY
    }
    require(content.referenceId in range && content.displayName.isNotBlank()) { "Kies een geldige soera, hizb of juz." }
}

val goalUnits = listOf("pages", "ayahs", "rub", "hizb", "juz", "minutes")

fun defaultGoal(id: Int) = when (id) {
    2 -> DailyGoal(id = 2, unit = "ayahs", target = 0)
    3 -> DailyGoal(id = 3, unit = "hizb", target = 0)
    else -> DailyGoal()
}

fun unitQuranFraction(unit: String): Double = when (unit) {
    "pages", "page" -> 1.0 / 604
    "hizb" -> 1.0 / 60
    "juz" -> 1.0 / 30
    "rub" -> 1.0 / 240
    "minutes" -> 0.0
    else -> 1.0 / 6236
}

fun historyQuranFraction(it: ReadingHistory): Double =
    if (it.type == "surah") ReadingMetrics.surahAyahCount(it.surahId) * it.amount / 6236.0
    else if (it.type == "hizb" && it.surahName.contains("(")) it.amount / 240.0
    else unitQuranFraction(it.type) * it.amount

fun journeyFraction(history: List<ReadingHistory>): Double = history.filter { it.action == "read" }
    .sumOf { historyQuranFraction(it) }.coerceIn(0.0, 1.0)
