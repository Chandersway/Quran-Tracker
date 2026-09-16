package com.Ameender.qurantracker.data

import androidx.room.Dao
import androidx.room.ColumnInfo
import androidx.room.Delete
import androidx.room.Entity
import androidx.room.Index
import androidx.room.Insert
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Entity(
    tableName = "ayah_notes",
    indices = [Index(value = ["surahId", "ayahNumber"]),
        Index(value = ["scopeType", "juzNumber"]),
        Index(value = ["scopeType", "hizbNumber"]),
        Index(value = ["scopeType", "rubNumber"]),
        Index(value = ["scopeType", "surahId"])]
)
data class AyahNote(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val surahId: Int? = null,
    val surahName: String = "",
    val ayahNumber: Int? = null,
    @ColumnInfo(defaultValue = "'ayah'") val scopeType: String = "ayah",
    val juzNumber: Int? = null,
    val hizbNumber: Int? = null,
    val rubNumber: Int? = null,
    val title: String = "",
    val note: String,
    val folder: String = "",
    val tags: String = "",
    val fontSize: Int = 16,
    val headingLevel: Int = 0,
    val isBold: Boolean = false,
    val isItalic: Boolean = false,
    val isUnderline: Boolean = false,
    val isStrike: Boolean = false,
    val listMode: String = "none",
    val textColorKey: String = "gold",
    val formatSpans: String = "",
    val isPinned: Boolean = false,
    val updatedAt: Long = System.currentTimeMillis()
)

@Dao
interface AyahNoteDao {
    @Query("SELECT * FROM ayah_notes ORDER BY isPinned DESC, updatedAt DESC")
    fun getAll(): Flow<List<AyahNote>>

    @Query("SELECT * FROM ayah_notes WHERE scopeType = 'ayah' AND surahId = :surahId AND ayahNumber = :ayahNumber ORDER BY updatedAt DESC LIMIT 1")
    fun getNote(surahId: Int, ayahNumber: Int): Flow<AyahNote?>

    @Insert
    suspend fun insert(note: AyahNote)

    @Update
    suspend fun update(note: AyahNote)

    @Query("DELETE FROM ayah_notes WHERE scopeType = 'ayah' AND surahId = :surahId AND ayahNumber = :ayahNumber")
    suspend fun deleteForAyah(surahId: Int, ayahNumber: Int)

    @Delete
    suspend fun delete(note: AyahNote)
}
