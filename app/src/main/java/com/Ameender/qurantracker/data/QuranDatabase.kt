package com.Ameender.qurantracker.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        QuranProgress::class,
        ReadingHistory::class,
        DailyGoal::class,
        PlanningItem::class,
        ReadingJourney::class
    ],
    version = 10,
    exportSchema = false
)
abstract class QuranDatabase : RoomDatabase() {

    abstract fun quranDao(): QuranDao
    abstract fun readingHistoryDao(): ReadingHistoryDao
    abstract fun dailyGoalDao(): DailyGoalDao
    abstract fun planningItemDao(): PlanningItemDao
    abstract fun readingJourneyDao(): ReadingJourneyDao

    companion object {
        @Volatile
        private var INSTANCE: QuranDatabase? = null

        fun getDatabase(context: Context): QuranDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    QuranDatabase::class.java,
                    "quran_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
