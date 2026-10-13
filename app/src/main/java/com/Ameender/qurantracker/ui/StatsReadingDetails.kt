package com.Ameender.qurantracker.ui

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp

internal fun statsReadingPeriodLabel(period: StatsReadingPeriod, language: String): String = when (period) {
    StatsReadingPeriod.All -> goalText(language, "Alle tijd", "All time", "كل الوقت")
    StatsReadingPeriod.Week -> goalText(language, "7 dagen", "7 days", "٧ أيام")
    StatsReadingPeriod.Month -> goalText(language, "30 dagen", "30 days", "٣٠ يوما")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun StatsReadingDetailsSheet(
    title: String, entries: List<RingEntry>, selectedKey: String?, periodLabel: String, language: String,
    onSelect: (String?) -> Unit, onDismiss: () -> Unit
) {
    val text = AppText.strings(language)
    val selected = entries.firstOrNull { it.key == selectedKey }
    val rows = (if (selectedKey == null) entries.flatMap { it.rows } else selected?.rows.orEmpty())
        .sortedWith(compareByDescending<com.Ameender.qurantracker.data.ReadingHistory> { it.timestamp }.thenByDescending { it.id })
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = DarkNavy, contentColor = GoldLight,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)) {
        Column(Modifier.fillMaxHeight(0.9f).padding(horizontal = 20.dp)) {
            Text(title, style = MaterialTheme.typography.titleLarge)
            Text("$periodLabel · ${rows.size} " + if (rows.size == 1)
                goalText(language, "registratie", "registration", "تسجيل")
                else goalText(language, "registraties", "registrations", "تسجيلات"),
                modifier = Modifier.testTag("stats-detail-count"), color = MutedGold)
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = selectedKey == null, onClick = { onSelect(null) },
                    modifier = Modifier.testTag("stats-detail-all"),
                    label = { Text(goalText(language, "Alles", "All", "الكل")) })
                entries.forEach { entry ->
                    FilterChip(selected = selectedKey == entry.key, onClick = { onSelect(entry.key) },
                        modifier = Modifier.testTag("stats-detail-filter-${entry.key}"),
                        label = { Text("${entry.label} (${entry.count})") })
                }
            }
            selected?.supportingText?.let { opening ->
                Text(opening, modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    style = MaterialTheme.typography.bodyLarge, color = GoldLight,
                    textAlign = androidx.compose.ui.text.style.TextAlign.End)
            }
            Text(goalText(language,
                "Nieuwste eerst. De ring telt registraties; het aantal per registratie staat hieronder.",
                "Newest first. The ring counts registrations; each registration's amount is shown below.",
                "الأحدث أولا. الدائرة تحسب التسجيلات؛ وتظهر كمية كل تسجيل أدناه."),
                style = MaterialTheme.typography.bodySmall, color = MutedGold)
            Spacer(Modifier.height(8.dp))
            LazyColumn(Modifier.weight(1f).fillMaxWidth().testTag("stats-detail-list"),
                verticalArrangement = Arrangement.spacedBy(6.dp), contentPadding = PaddingValues(bottom = 16.dp)) {
                if (rows.isEmpty()) item {
                    Text(goalText(language, "Geen registraties in deze selectie.", "No registrations in this selection.", "لا توجد تسجيلات في هذا التحديد."))
                }
                items(rows, key = { it.id }) { history ->
                    Column {
                        ReadingHistoryRow(history, text)
                        Text(goalText(language, "Aantal", "Amount", "الكمية") + ": ${history.amount}",
                            style = MaterialTheme.typography.bodySmall, color = MutedGold,
                            modifier = Modifier.padding(start = 12.dp, top = 2.dp))
                    }
                }
            }
            TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                Text(goalText(language, "Sluiten", "Close", "إغلاق"), color = Gold)
            }
        }
    }
}
