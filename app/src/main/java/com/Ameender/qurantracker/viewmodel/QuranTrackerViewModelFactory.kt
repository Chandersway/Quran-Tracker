package com.Ameender.qurantracker.viewmodel

import android.app.Application
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.Ameender.qurantracker.data.AndroidReminderScheduler
import com.Ameender.qurantracker.data.AyahNoteRepository
import com.Ameender.qurantracker.data.GoalRepository
import com.Ameender.qurantracker.data.PlanningRepository
import com.Ameender.qurantracker.data.QuranDatabase
import com.Ameender.qurantracker.data.QuranProgressRepository

class QuranTrackerViewModelFactory(
    private val application: Application
) : ViewModelProvider.Factory {
    private val database by lazy { QuranDatabase.getDatabase(application) }
    private val reminderScheduler by lazy { AndroidReminderScheduler(application) }
    private val quranProgressRepository by lazy {
        QuranProgressRepository(
            progressDao = database.quranDao(),
            historyDao = database.readingHistoryDao(),
            database = database,
            surahName = { id -> com.Ameender.qurantracker.ui.ALL_SURAHS.find { it.id == id }?.name ?: "Surah $id" }
        )
    }
    private val goalRepository by lazy {
        GoalRepository(
            database = database,
            reminderScheduler = reminderScheduler
        )
    }
    private val planningRepository by lazy {
        PlanningRepository(
            planDao = database.planningItemDao(),
            historyDao = database.readingHistoryDao(),
            goalDao = database.dailyGoalDao(),
            reminderScheduler = reminderScheduler,
            goals = goalRepository,
            database = database
        )
    }
    private val ayahNoteRepository by lazy {
        AyahNoteRepository(database.ayahNoteDao())
    }

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(QuranViewModel::class.java) ->
                QuranViewModel(quranProgressRepository) as T
            modelClass.isAssignableFrom(GoalViewModel::class.java) ->
                GoalViewModel(goalRepository) as T
            modelClass.isAssignableFrom(PlanningViewModel::class.java) ->
                PlanningViewModel(planningRepository) as T
            modelClass.isAssignableFrom(AyahNoteViewModel::class.java) ->
                AyahNoteViewModel(ayahNoteRepository) as T
            else -> throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}
