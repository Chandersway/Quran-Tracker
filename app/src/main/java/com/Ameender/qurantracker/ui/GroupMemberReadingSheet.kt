package com.Ameender.qurantracker.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.Ameender.qurantracker.data.ReadingGroupLeaderboardRow
import com.Ameender.qurantracker.data.ReadingGroupReadingEntry
import com.Ameender.qurantracker.data.NoteScope
import com.Ameender.qurantracker.data.QuranNoteTarget
import com.Ameender.qurantracker.data.QuranStart
import com.Ameender.qurantracker.data.QuranStructure
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

internal fun groupReadingLabel(entry: ReadingGroupReadingEntry, text: AppStrings): String {
    val reference = entry.referenceNumber?.takeIf { it > 0 }
    if (reference != null && entry.amount == 1 && entry.unit in listOf("hizb", "juz", "surah")) {
        return text.t("common.${entry.unit}Number", dailyGoalNumber(reference, text.localeCode))
    }
    val unit = when (entry.unit) {
        "page" -> text.groupUnitOption.pages
        "hizb" -> text.groupUnitOption.hizbs
        "juz" -> text.groupUnitOption.juzs
        "surah" -> text.groupUnitOption.surahs
        else -> text.t("unit.ayah.other")
    }
    return "${dailyGoalNumber(entry.amount, text.localeCode)} $unit"
}

internal fun groupReadingAyahRange(entry: ReadingGroupReadingEntry, text: AppStrings): String? {
    val number = entry.referenceNumber ?: return null
    // A quantity without an exact partition must never imply a particular ayah range.
    if (entry.amount != 1) return null
    val (scope, maximum) = when (entry.unit) {
        "hizb" -> NoteScope.HIZB to 60
        "juz" -> NoteScope.JUZ to 30
        "surah" -> NoteScope.SURAH to 114
        "rub" -> NoteScope.RUB to 240
        else -> return null
    }
    if (number !in 1..maximum) return null
    val start = QuranStructure.start(QuranNoteTarget(scope, number))
    val end = if (number == maximum) QuranStart(114, 6) else {
        val next = QuranStructure.start(QuranNoteTarget(scope, number + 1))
        if (next.ayah > 1) QuranStart(next.surah, next.ayah - 1)
        else QuranStart(next.surah - 1, QuranStructure.verseCounts[next.surah - 2])
    }
    fun label(point: QuranStart): String {
        val surah = ALL_SURAHS.first { it.id == point.surah }
        val name = if (text.localeCode == "ar") surah.arabic else surah.name
        return "$name (${dailyGoalNumber(point.surah, text.localeCode)}:${dailyGoalNumber(point.ayah, text.localeCode)})"
    }
    return text.t("groups.reading.ayahRange", label(start), label(end))
}

internal fun groupReadingDate(value: String, text: AppStrings): String = runCatching {
    val formatted = LocalDate.parse(value).format(DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.forLanguageTag(text.localeCode)))
    if (text.localeCode == "ar") formatted.map {
        if (it in '0'..'9') ('٠'.code + it.code - '0'.code).toChar() else it
    }.joinToString("") else formatted
}.getOrDefault(text.t("groups.reading.unknownDate"))

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun GroupMemberReadingSheet(text: AppStrings, member: ReadingGroupLeaderboardRow, onDismiss: () -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = DarkNavy, contentColor = SoftTextGold) {
        Column(Modifier.fillMaxWidth().fillMaxHeight(0.85f).testTag("group_member_reading")) {
            Row(Modifier.fillMaxWidth().padding(start = 20.dp, end = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(member.label, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    Text(text.t("groups.reading.title"), fontSize = 14.sp)
                }
                IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, text.t("groups.reading.close")) }
            }
            Text(text.t("groups.reading.scope"), Modifier.padding(20.dp), fontSize = 12.sp, color = MutedGold)
            HorizontalDivider(color = BorderNavy)
            LazyColumn(Modifier.weight(1f).fillMaxWidth(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                if (member.readingEntries.isEmpty()) item {
                    Text(text.t("groups.reading.empty"), color = MutedGold)
                }
                member.readingEntries.sortedByDescending { it.occurredOn }.groupBy { it.occurredOn }.forEach { (date, entries) ->
                    item { Text(groupReadingDate(date, text), fontWeight = FontWeight.Bold, color = Gold) }
                    items(entries) { entry ->
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(groupReadingLabel(entry, text), fontSize = 15.sp)
                            groupReadingAyahRange(entry, text)?.let { range ->
                                Text(range, fontSize = 13.sp, color = MutedGold)
                            }
                        }
                    }
                    item { HorizontalDivider(color = BorderNavy) }
                }
            }
        }
    }
}
