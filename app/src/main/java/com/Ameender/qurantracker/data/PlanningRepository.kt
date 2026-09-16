package com.Ameender.qurantracker.data

import com.Ameender.qurantracker.domain.QuranAction
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import androidx.room.withTransaction
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

interface PlanningDataSource {
    val allItems: Flow<List<PlanningItem>>
    val datesWithItems: Flow<List<String>>
    val dailyGoal: Flow<DailyGoal>
    val todayDoneCount: Flow<Int>

    fun getItemsForDate(date: String): Flow<List<PlanningItem>>
    suspend fun addItem(date: String, type: String, referenceId: Int, subId: Int, displayName: String, arabicText: String)
    suspend fun addKhatmaPlan(startDate: String, days: Int)
    suspend fun toggleDone(item: PlanningItem)
    suspend fun deleteItem(id: Int)
    suspend fun setReminder(item: PlanningItem, hour: Int?, minute: Int?)
    suspend fun saveGoal(unit: String, target: Int, hour: Int, minute: Int)
}

class PlanningRepository(
    private val planDao: PlanningItemDao,
    private val historyDao: ReadingHistoryDao,
    private val goalDao: DailyGoalDao,
    private val reminderScheduler: ReminderScheduler,
    private val goals: GoalDataSource? = null,
    private val database: QuranDatabase? = null
) : PlanningDataSource {
    private val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    override val allItems = planDao.getAll()

    override val datesWithItems = planDao.getDatesWithItems(sdf.format(Date()))

    override val dailyGoal = goalDao.getGoal()
        .map { it ?: DailyGoal() }

    override val todayDoneCount = allItems.map { items ->
        val today = sdf.format(Date())
        items.count { it.date == today && it.isDone }
    }

    override fun getItemsForDate(date: String): Flow<List<PlanningItem>> =
        planDao.getForDate(date)

    override suspend fun addItem(
        date: String,
        type: String,
        referenceId: Int,
        subId: Int,
        displayName: String,
        arabicText: String
    ) {
        planDao.insert(
            PlanningItem(
                date = date,
                type = type,
                referenceId = referenceId,
                subId = subId,
                displayName = displayName,
                arabicText = arabicText
            )
        )
    }

    override suspend fun addKhatmaPlan(startDate: String, days: Int) {
        val safeDays = days.coerceIn(1, 240)
        val start = sdf.parse(startDate) ?: Date()
        repeat(safeDays) { index ->
            val dayNumber = index + 1
            val partStart = ((index * 240) / safeDays) + 1
            val partEnd = (((index + 1) * 240) / safeDays).coerceAtLeast(partStart)
            val cal = Calendar.getInstance().apply {
                time = start
                add(Calendar.DAY_OF_YEAR, index)
            }
            val date = sdf.format(cal.time)
            val rangeLabel = khatmaPartRangeLabel(partStart, partEnd)
            val duplicateCount = planDao.countDuplicate(
                date = date,
                type = "khatma",
                referenceId = partStart,
                subId = partEnd
            )
            if (duplicateCount == 0) {
                planDao.insert(
                    PlanningItem(
                        date = date,
                        type = "khatma",
                        referenceId = partStart,
                        subId = partEnd,
                        displayName = "Khatma dag $dayNumber - $rangeLabel",
                        arabicText = "Lees $rangeLabel"
                    )
                )
            }
        }
    }

    private val completionLock = Mutex()
    override suspend fun toggleDone(item: PlanningItem) = completionLock.withLock {
        val work: suspend () -> Unit = {
            val current = planDao.getOnce(item.id)
            if (current != null && current.isDone == item.isDone) complete(current)
        }
        if (database != null) database.withTransaction { work() } else work()
    }

    private suspend fun complete(item: PlanningItem) {
        val newDone = !item.isDone
        val removed = if (!newDone) historyDao.deleteSource("planning:${item.id}") > 0 else false
        val shouldLogHistory = newDone && !item.historyLogged
        planDao.setDoneAndHistoryLogged(
            id = item.id,
            done = newDone,
            historyLogged = if (removed) false else item.historyLogged || shouldLogHistory
        )
        if (newDone) {
            planDao.setReminder(item.id, null, null)
            reminderScheduler.cancelPlanning(item.id)
        }

        if (shouldLogHistory) {
            historyDao.insert(
                ReadingHistory(
                    surahId = item.referenceId,
                    surahName = item.displayName,
                    type = item.measurementUnit.ifBlank { if (item.type == "khatma") "rub" else item.type },
                    action = goalAction(item.goalId),
                    dateKey = java.time.LocalDate.now().toString(),
                    amount = if (item.type == "khatma") (item.subId - item.referenceId + 1).coerceIn(1, 240) else item.amount,
                    sourceKey = "planning:${item.id}",
                    contentType = item.type,
                    extraInfo = item.arabicText,
                    timestamp = System.currentTimeMillis()
                )
            )
        }
    }

    override suspend fun deleteItem(id: Int) {
        planDao.deleteById(id)
        reminderScheduler.cancelPlanning(id)
    }

    override suspend fun setReminder(item: PlanningItem, hour: Int?, minute: Int?) {
        planDao.setReminder(item.id, hour, minute)
        if (hour == null || minute == null) {
            reminderScheduler.cancelPlanning(item.id)
        } else {
            reminderScheduler.schedulePlanning(item, hour, minute)
        }
    }

    override suspend fun saveGoal(unit: String, target: Int, hour: Int, minute: Int) {
        if (goals != null) {
            goals.saveGoal(unit, target, hour, minute)
            return
        }
        goalDao.upsertGoal(
            DailyGoal(
                unit = unit,
                target = target,
                reminderHour = hour,
                reminderMinute = minute
            )
        )
    }
}

private fun khatmaPartRangeLabel(startPart: Int, endPart: Int): String {
    val safeStart = startPart.coerceIn(1, 240)
    val safeEnd = endPart.coerceIn(safeStart, 240)
    val startJuz = ((safeStart - 1) / 8) + 1
    val endJuz = ((safeEnd - 1) / 8) + 1
    val startRubInJuz = ((safeStart - 1) % 8) + 1
    val endRubInJuz = ((safeEnd - 1) % 8) + 1
    if (startRubInJuz == 1 && endRubInJuz == 8) {
        return if (startJuz == endJuz) "Juz $startJuz" else "Juz $startJuz-$endJuz"
    }

    val startHizb = ((safeStart - 1) / 4) + 1
    val endHizb = ((safeEnd - 1) / 4) + 1
    val startRub = ((safeStart - 1) % 4) + 1
    val endRub = ((safeEnd - 1) % 4) + 1
    return when {
        safeStart == safeEnd -> "Hizb $startHizb Rub $startRub"
        startHizb == endHizb -> "Hizb $startHizb Rub $startRub-$endRub"
        else -> "Hizb $startHizb Rub $startRub t/m Hizb $endHizb Rub $endRub"
    }
}
