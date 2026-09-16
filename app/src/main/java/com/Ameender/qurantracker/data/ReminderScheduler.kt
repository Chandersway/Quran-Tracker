package com.Ameender.qurantracker.data

import android.content.Context
import com.Ameender.qurantracker.cancelPlanningReminder
import com.Ameender.qurantracker.scheduleDailyReminder
import com.Ameender.qurantracker.schedulePlanningReminder

interface ReminderScheduler {
    fun scheduleDaily(hour: Int, minute: Int)
    fun schedulePlanning(item: PlanningItem, hour: Int, minute: Int)
    fun cancelPlanning(itemId: Int)
}

class AndroidReminderScheduler(
    private val context: Context
) : ReminderScheduler {
    override fun scheduleDaily(hour: Int, minute: Int) {
        scheduleDailyReminder(context, hour, minute)
    }

    override fun schedulePlanning(item: PlanningItem, hour: Int, minute: Int) {
        schedulePlanningReminder(
            context = context,
            itemId = item.id,
            date = item.date,
            hour = hour,
            minute = minute,
            displayName = item.displayName,
            arabicText = item.arabicText
        )
    }

    override fun cancelPlanning(itemId: Int) {
        cancelPlanningReminder(context, itemId)
    }
}
