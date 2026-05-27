package com.Ameender.qurantracker.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.Ameender.qurantracker.cancelPlanningReminder
import com.Ameender.qurantracker.data.*
import com.Ameender.qurantracker.schedulePlanningReminder
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class PlanningViewModel(application: Application) : AndroidViewModel(application) {

    private val db          = QuranDatabase.getDatabase(application)
    private val planDao     = db.planningItemDao()
    private val historyDao  = db.readingHistoryDao()
    private val goalDao     = db.dailyGoalDao()

    val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    // Alle items vanaf vandaag
    val allItems = planDao.getFromDate(sdf.format(Date()))
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Datums met items (voor kalender highlights)
    val datesWithItems = planDao.getDatesWithItems(sdf.format(Date()))
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Huidig doel
    val dailyGoal = goalDao.getGoal()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), DailyGoal())

    // Vandaag afgetikt
    val todayDoneCount = allItems.map { items ->
        val today = sdf.format(Date())
        items.count { it.date == today && it.isDone }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    // Items voor specifieke datum
    fun getItemsForDate(date: String): Flow<List<PlanningItem>> =
        planDao.getForDate(date)

    // Item toevoegen
    fun addItem(
        date: String,
        type: String,
        referenceId: Int,
        subId: Int = 0,
        displayName: String,
        arabicText: String = ""
    ) {
        viewModelScope.launch {
            planDao.insert(
                PlanningItem(
                    date        = date,
                    type        = type,
                    referenceId = referenceId,
                    subId       = subId,
                    displayName = displayName,
                    arabicText  = arabicText
                )
            )
        }
    }

    // Item afvinken → ook naar geschiedenis
    fun addKhatmaPlan(startDate: String, days: Int) {
        viewModelScope.launch {
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
                val displayName = "Khatma dag $dayNumber - $rangeLabel"
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
                            displayName = displayName,
                            arabicText = "Lees $rangeLabel"
                        )
                    )
                }
            }
        }
    }

    fun toggleDone(item: PlanningItem) {
        viewModelScope.launch {
            val newDone = !item.isDone
            val shouldLogHistory = newDone && !item.historyLogged
            planDao.setDoneAndHistoryLogged(
                id = item.id,
                done = newDone,
                historyLogged = item.historyLogged || shouldLogHistory
            )
            if (newDone) {
                planDao.setReminder(item.id, null, null)
                cancelPlanningReminder(getApplication(), item.id)
            }

            // Alleen loggen als we aanvinken (niet uitvinken)
            if (shouldLogHistory) {
                val dateKey = item.date
                historyDao.insert(
                    ReadingHistory(
                        surahId   = item.referenceId,
                        surahName = item.displayName,
                        type      = item.type,
                        action    = "read",
                        dateKey   = dateKey,
                        extraInfo = item.arabicText,
                        timestamp = System.currentTimeMillis()
                    )
                )
            }
        }
    }

    // Item verwijderen
    fun deleteItem(id: Int) {
        viewModelScope.launch {
            planDao.deleteById(id)
            cancelPlanningReminder(getApplication(), id)
        }
    }

    fun setReminder(item: PlanningItem, hour: Int?, minute: Int?) {
        viewModelScope.launch {
            planDao.setReminder(item.id, hour, minute)
            if (hour == null || minute == null) {
                cancelPlanningReminder(getApplication(), item.id)
            } else {
                schedulePlanningReminder(
                    context = getApplication(),
                    itemId = item.id,
                    date = item.date,
                    hour = hour,
                    minute = minute,
                    displayName = item.displayName,
                    arabicText = item.arabicText
                )
            }
        }
    }

    // Doel opslaan
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
        }
    }

    fun unitLabel(unit: String) = when (unit) {
        "rub"   -> "rub"
        "hizb"  -> "hizb"
        "juz"   -> "juz"
        "pages" -> "pagina's"
        "ayahs" -> "ayahs"
        else    -> ""
    }

    fun typeIcon(type: String) = when (type) {
        "rub", "hizb" -> "📿"
        "juz"         -> "📜"
        "surah"       -> "📖"
        else          -> "📌"
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
