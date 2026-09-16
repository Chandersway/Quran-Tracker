package com.Ameender.qurantracker.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.Ameender.qurantracker.data.HizbReadCount
import com.Ameender.qurantracker.data.ReadingMetrics
import com.Ameender.qurantracker.data.ReadingHistory
import com.Ameender.qurantracker.data.ReadingStatsSummary
import com.Ameender.qurantracker.data.SurahReadCount
import com.Ameender.qurantracker.data.TypeCount
import com.Ameender.qurantracker.data.readingStatsSummary
import com.Ameender.qurantracker.viewmodel.QuranViewModel
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.min

private fun statsPieColor(index: Int): Color = PieColors[index % PieColors.size]

private data class RingEntry(val label: String, val count: Int, val color: Color)

@Composable
private fun StatsDistributionRingCard(title: String, entries: List<RingEntry>, language: String) {
    val positiveEntries = entries.filter { it.count > 0 }
    val total = positiveEntries.sumOf { it.count }
    StatsRingPanel(
        title, total.toString(),
        goalText(language, "registraties", "registrations", "تسجيلات"),
        goalText(language, "Alle tijd · aandeel van deze registraties", "All time · share of these registrations", "كل الوقت · حصة من هذه التسجيلات"),
        goalText(language,
            "Elke kleur toont het aandeel van een onderdeel in de getoonde leesregistraties. Herhaald lezen telt mee. Een registratie van een soera, Juz of Hizb is niet dezelfde hoeveelheid tekst; de ring geeft geen percentage van de Quran aan.",
            "Each colour shows an item's share of the displayed reading registrations. Repeated reads count. A surah, Juz and Hizb are different amounts of text; this ring is not a percentage of the Quran.",
            "كل لون يمثل حصة من تسجيلات القراءة المعروضة، وتشمل القراءة المتكررة. السورة والجزء والحزب كميات مختلفة من النص؛ هذه الدائرة ليست نسبة إكمال القرآن."),
        language, positiveEntries
    )
}

@Composable
private fun StatsRingPanel(
    title: String, value: String, centerLabel: String, subtitle: String,
    explanation: String, language: String, entries: List<RingEntry>, showLegend: Boolean = true
) {
    var detailsOpen by remember { mutableStateOf(false) }
    val total = entries.sumOf { it.count }.coerceAtLeast(1)
    val detailLabel = goalText(language, "Bekijk uitleg en details", "View explanation and details", "عرض الشرح والتفاصيل")
    QuranStatisticCard(title = title) {
        Box(
            Modifier.fillMaxWidth().height(174.dp).clickable(onClickLabel = detailLabel) { detailsOpen = true },
            contentAlignment = Alignment.Center
        ) {
            Canvas(Modifier.size(162.dp)) {
                val stroke = 13.dp.toPx()
                val inset = stroke / 2
                val arcSize = Size(size.width - stroke, size.height - stroke)
                drawArc(BorderNavy.copy(alpha = 0.6f), -90f, 360f, false,
                    Offset(inset, inset), arcSize, style = androidx.compose.ui.graphics.drawscope.Stroke(stroke))
                var angle = -90f
                entries.forEach { entry ->
                    val sweep = entry.count.toFloat() / total * 360f
                    if (sweep > 0f) drawArc(entry.color, angle, (sweep - if (entries.size > 1) 1.5f else 0f).coerceAtLeast(0f), false,
                        Offset(inset, inset), arcSize, style = androidx.compose.ui.graphics.drawscope.Stroke(stroke))
                    angle += sweep
                }
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(value, fontSize = 29.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                Text(centerLabel, fontSize = 11.sp, color = MutedGold, textAlign = TextAlign.Center)
            }
        }
        Text(subtitle, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center,
            color = MutedGold, fontSize = 12.sp)
        if (showLegend) {
            Spacer(Modifier.height(10.dp))
            entries.take(6).forEach { entry ->
                LegendRow(entry.color, entry.label, "${entry.count}× · ${String.format(Locale.getDefault(), "%.1f", entry.count * 100.0 / total)}%")
            }
        }
        TextButton(onClick = { detailsOpen = true }, modifier = Modifier.fillMaxWidth()) {
            Text(detailLabel, color = Gold, fontSize = 12.sp)
        }
    }
    if (detailsOpen) {
        AlertDialog(
            onDismissRequest = { detailsOpen = false },
            title = { Text(title) },
            text = {
                Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(subtitle)
                    Text(explanation)
                    if (showLegend) entries.forEach { entry ->
                        Text("${entry.label}: ${entry.count}× (${String.format(Locale.getDefault(), "%.1f", entry.count * 100.0 / total)}%)")
                    }
                }
            },
            confirmButton = { TextButton(onClick = { detailsOpen = false }) {
                Text(goalText(language, "Sluiten", "Close", "إغلاق"))
            } }
        )
    }
}

@Composable
fun StatsScreen(viewModel: QuranViewModel, appLanguage: String = "nl") {
    val text = AppText.strings(appLanguage)
    val mostRead      by viewModel.mostReadSurahs.collectAsState()
    val mostReadHizb  by viewModel.mostReadHizb.collectAsState()
    val recentHistory by viewModel.recentHistory.collectAsState()
    val dayActivity   by viewModel.dayActivity.collectAsState()
    val totalReads    by viewModel.totalReadCount.collectAsState()
    val typeCounts    by viewModel.allTypeCounts.collectAsState()
    val allHistory    by viewModel.allHistory.collectAsState()
    val juzzProgress  by viewModel.juzzProgress.collectAsState()
    val hizbProgress  by viewModel.hizbProgress.collectAsState()
    val rubProgress   by viewModel.rubProgress.collectAsState()

    val summary = remember(allHistory) { readingStatsSummary(allHistory) }
    val streak = summary.currentStreak
    val rubDone = remember(rubProgress) { rubProgress.count { it.isRead } }
    val rubReadPairs = remember(rubProgress) { rubProgress.map { it.id to it.isRead } }
    val completedHizbFromRub = remember(rubReadPairs) {
        completedHizbCountFromRub(rubReadPairs)
    }
    val completedJuzFromRub = remember(rubReadPairs) {
        completedJuzCountFromRub(rubReadPairs)
    }
    val manualHizbDone = remember(hizbProgress) { hizbProgress.count { it.isRead } }
    val manualJuzDone = remember(juzzProgress) { juzzProgress.count { it.isRead } }
    val hizbDone = maxOf(manualHizbDone, completedHizbFromRub)
    val juzzDone = maxOf(manualJuzDone, completedJuzFromRub)

    var showResetDialog by remember { mutableStateOf(false) }
    var historyGroupMode by remember { mutableStateOf(HistoryGroupMode.Day) }
    val expandedHistoryGroups = remember { mutableStateMapOf<String, Boolean>() }
    val historyGroups = remember(allHistory, historyGroupMode) {
        groupReadingHistory(allHistory, historyGroupMode)
    }
    val dayActivityBars = remember(dayActivity) { dayActivity.map { it.dateKey to it.count } }

    if (showResetDialog) {
        QuranAppDialog(
            title = text.t("stats.clearHistoryTitle"),
            message = text.t("stats.clearHistoryMessage"),
            confirmText = text.t("stats.clearHistoryConfirm"),
            dismissText = text.cancel,
            destructive = true,
            onConfirm = {
                viewModel.resetHistory()
                showResetDialog = false
            },
            onDismiss = { showResetDialog = false }
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(DarkNavy),
        contentPadding = PaddingValues(AppSpacing.screen)
    ) {
        // â”€â”€ Header â”€â”€
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = AppSpacing.xxxl),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text.stats, style = AppTextStyle.pageTitle, color = GoldLight)
                    Text(text.t("stats.totalActions", summary.readActions), style = AppTextStyle.bodySmall, color = MutedGold)
                }
                IconButton(
                    onClick = { showResetDialog = true },
                    modifier = Modifier
                        .clip(RoundedCornerShape(AppShape.control))
                        .background(DeleteSurface)
                        .border(AppBorder.thin, StrongDeleteSurface, RoundedCornerShape(AppShape.control))
                ) {
                    Icon(Icons.Default.Delete, contentDescription = text.t("stats.resetHistory"), tint = DeleteRed)
                }
            }
        }

        item {
            StreakStatsCard(streak = streak, text = text)
        }

        item {
            ReadingStatsOverviewCard(
                summary = summary,
                juzzDone = juzzDone,
                hizbDone = hizbDone,
                rubDone = rubDone,
                text = text
            )
        }


        item {
            StatsDistributionRingCard(
                title = text.t("stats.distributionByType"),
                entries = typeCounts.map { RingEntry(statsTypeLabel(it.type, text), it.count,
                    when (it.type) { "surah" -> ReadBlue; "juz" -> DoneGreen; "hizb" -> Gold; else -> MutedGold }) },
                language = appLanguage
            )
        }
        item {
            StatsDistributionRingCard(
                title = text.t("stats.mostReadHizbRub"),
                entries = mostReadHizb.mapIndexed { index, entry ->
                    RingEntry(readableHizbRubNameSafe(entry.surahId, entry.surahName), entry.count, statsPieColor(index))
                },
                language = appLanguage
            )
        }
        item {
            StatsDistributionRingCard(
                title = text.t("stats.mostReadSurahs"),
                entries = mostRead.mapIndexed { index, entry ->
                    RingEntry(entry.surahName, entry.count, statsPieColor(index))
                },
                language = appLanguage
            )
        }
        item {
            val assessed = hizbProgress.filter { it.hasHifzScore && it.progress > 0 }
                .distinctBy { it.referenceId }
            val average = if (assessed.isEmpty()) null else assessed.map { it.progress.coerceIn(1, 100) }.average().toInt()
            val title = goalText(appLanguage, "Hifdh-beheersing", "Hifdh mastery", "إتقان الحفظ")
            val coverage = goalText(appLanguage, "${assessed.size} van 60 hizb beoordeeld",
                "${assessed.size} of 60 hizb assessed", "تم تقييم ${assessed.size} من 60 حزبًا")
            val explanation = goalText(appLanguage,
                "Het gemiddelde van je beoordeelde Hizb-scores. Score 0 betekent nog niet beoordeeld en telt niet mee. Dit percentage geeft beheersing aan, niet hoeveel van de Quran je hebt gememoriseerd.",
                "The average of your assessed Hizb scores. A score of 0 means unassessed and is excluded. This measures mastery, not how much of the Quran you have memorised.",
                "متوسط درجات الأحزاب المقيّمة. الدرجة صفر تعني أن الحزب لم يُقيّم ولا تدخل في المتوسط. هذه النسبة تعبر عن الإتقان وليس مقدار ما حفظته من القرآن.")
            StatsRingPanel(title, average?.let { "$it%" } ?: "—",
                goalText(appLanguage, "gemiddelde score", "average score", "متوسط الدرجات"),
                coverage, explanation, appLanguage,
                listOf(RingEntry(title, average ?: 0, Gold), RingEntry("", 100 - (average ?: 0), BorderNavy)),
                showLegend = false)
        }

        // Weekly activity
        item {
            QuranStatisticCard(title = text.t("stats.weeklyActivity")) {
                if (dayActivity.isEmpty()) {
                    EmptyText(text.t("stats.noWeeklyActivity"))
                } else {
                    BarChart(
                        data = dayActivityBars,
                        modifier = Modifier.fillMaxWidth().height(AppChartSize.barHeight)
                    )
                }
            }
        }

        item {
            Text(
                text.t("stats.recentHistory"),
                style = AppTextStyle.cardTitle,
                color = Gold,
                modifier = Modifier.padding(bottom = AppSpacing.lg)
            )
        }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.lg)) {
                Text(
                    text.t("stats.readingHistory"),
                    style = AppTextStyle.cardTitle,
                    color = Gold
                )
                Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.md), modifier = Modifier.fillMaxWidth()) {
                    HistoryGroupMode.entries.forEach { mode ->
                        StatsFilterChip(
                            label = mode.label(text),
                            selected = historyGroupMode == mode,
                            onClick = { historyGroupMode = mode },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }

        if (allHistory.isEmpty()) {
            item { EmptyText(text.t("stats.noHistory")) }
        } else {
            historyGroups.forEachIndexed { index, group ->
                item(key = "history-${group.key}") {
                    val isExpanded = expandedHistoryGroups[group.key] ?: (index == 0)
                    CollapsibleStatsGroup(
                        title = group.title,
                        subtitle = text.t("stats.actionsCount", group.items.size),
                        expanded = isExpanded,
                        onToggle = { expandedHistoryGroups[group.key] = !isExpanded }
                    ) {
                        group.items.forEach { item ->
                            ReadingHistoryItemRow(item, text)
                        }
                    }
                }
            }
        }

        if (recentHistory.isNotEmpty()) {
            items(recentHistory.take(30)) { history ->
                val dateStr = SimpleDateFormat("dd MMM yyyy · HH:mm", Locale.getDefault())
                    .format(Date(history.timestamp))

                val typeIcon = when {
                    history.type == "juz"              -> text.juz
                    history.type == "hizb"             -> text.t("stats.hizb")
                    history.action == "memorized"      -> text.hifz
                    else                               -> text.surah
                }
                val typeLabel = when {
                    history.type == "juz"              -> text.juz
                    history.type == "hizb"             -> if (history.surahName.hasRubMarker()) text.t("stats.rub") else text.t("stats.hizb")
                    history.action == "memorized"      -> text.hifz
                    else                               -> text.read
                }
                val labelColor = when {
                    history.type == "juz"              -> DoneGreen
                    history.type == "hizb"             -> Gold
                    history.action == "memorized"      -> Gold
                    else                               -> ReadBlue
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = AppSpacing.sm)
                        .clip(RoundedCornerShape(AppShape.tile))
                        .background(MidNavy)
                        .border(AppBorder.thin, BorderNavy, RoundedCornerShape(AppShape.tile))
                        .padding(AppSpacing.list)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(typeIcon, fontSize = 18.sp)
                        Spacer(modifier = Modifier.width(AppSpacing.lg))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                readableHistoryName(history.type, history.surahId, history.surahName),
                                fontSize = 13.sp,
                                color = SoftTextGold,
                                fontWeight = FontWeight.Medium
                            )
                            Text(dateStr, fontSize = 11.sp, color = DimGold)
                        }
                        Text(typeLabel, fontSize = 11.sp, color = labelColor)
                    }
                    // Begin ayah tonen voor hizb
                    if (history.type == "hizb" && history.extraInfo.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(AppSpacing.sm))
                        Text(
                            history.extraInfo,
                            fontSize = 13.sp,
                            color = Gold.copy(alpha = 0.7f),
                            textAlign = TextAlign.End,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(AppShape.smallControl))
                                .background(SubtleGoldSurface)
                                .padding(horizontal = AppSpacing.md, vertical = AppSpacing.xs)
                        )
                    }
                }
            }
        }

        item {
            QuranProgressStatsCard(
                juzzDone = juzzDone,
                hizbDone = hizbDone,
                rubDone = rubDone,
                text = text
            )
        }

        item { Spacer(modifier = Modifier.height(AppSpacing.pageBottom)) }
    }
}

// â”€â”€ Helper composables â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

private enum class HistoryGroupMode {
    Day,
    Week,
    Month;

    fun label(text: AppStrings): String = when (this) {
        Day -> text.t("stats.groupByDay")
        Week -> text.week
        Month -> text.month
    }
}

private data class HistoryGroup(
    val key: String,
    val title: String,
    val items: List<HistoryDisplayItem>
)

private sealed interface HistoryDisplayItem {
    val timestamp: Long
}

private data class SingleHistoryItem(
    val history: ReadingHistory
) : HistoryDisplayItem {
    override val timestamp: Long = history.timestamp
}

private data class HizbDaySummaryItem(
    val hizbNumber: Int,
    val rubNumbers: List<Int>,
    override val timestamp: Long,
    val extraInfo: String
) : HistoryDisplayItem

@Composable
private fun StatsFilterChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Text(
        label,
        modifier = modifier
            .clip(RoundedCornerShape(AppShape.smallControl))
            .background(if (selected) Gold else MidNavy)
            .border(AppBorder.thin, if (selected) GoldLight else BorderNavy, RoundedCornerShape(AppShape.smallControl))
            .clickable(onClick = onClick)
            .heightIn(min = AppComponentDefaults.minTouchTarget)
            .padding(vertical = AppSpacing.md),
        style = AppTextStyle.labelStrong,
        color = if (selected) DarkNavy else GoldLight,
        textAlign = TextAlign.Center
    )
}

@Composable
private fun CollapsibleStatsGroup(
    title: String,
    subtitle: String,
    expanded: Boolean,
    onToggle: () -> Unit,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = AppSpacing.lg)
            .clip(RoundedCornerShape(AppShape.control))
            .background(MidNavy)
            .border(AppBorder.thin, BorderNavy, RoundedCornerShape(AppShape.control))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onToggle)
                .heightIn(min = AppComponentDefaults.minTouchTarget)
                .padding(AppSpacing.list),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(if (expanded) "-" else "+", fontSize = 20.sp, color = Gold, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.width(AppSpacing.lg))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = AppTextStyle.body.copy(fontWeight = FontWeight.Bold), color = GoldLight)
                Text(subtitle, style = AppTextStyle.caption, color = MutedGold)
            }
        }
        if (expanded) {
            HorizontalDivider(color = BorderNavy, thickness = AppBorder.hairline)
            Column(
                modifier = Modifier.padding(AppSpacing.list),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
                content = content
            )
        }
    }
}

@Composable
private fun ReadingHistoryItemRow(item: HistoryDisplayItem, text: AppStrings) {
    when (item) {
        is SingleHistoryItem -> ReadingHistoryRow(item.history, text)
        is HizbDaySummaryItem -> HizbSummaryRow(item, text)
    }
}

@Composable
private fun ReadingHistoryRow(history: ReadingHistory, text: AppStrings) {
    val dateStr = remember(history.timestamp) {
        SimpleDateFormat("dd MMM yyyy · HH:mm", Locale.getDefault())
            .format(Date(history.timestamp))
    }
    val typeIcon = when {
        history.type == "juz" -> "Juz"
        history.type == "hizb" -> "Hizb"
        history.action == "memorized" -> "Hifz"
        else -> "Soera"
    }
    val typeLabel = when {
        history.type == "juz" -> "Juz"
        history.type == "hizb" -> if (history.surahName.hasRubMarker()) "Rub" else "Hizb"
        history.action == "memorized" -> "Hifz"
        else -> text.read
    }
    val labelColor = when {
        history.type == "juz" -> DoneGreen
        history.type == "hizb" -> Gold
        history.action == "memorized" -> Gold
        else -> ReadBlue
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.tile))
            .background(DeepNavy)
            .border(AppBorder.thin, BorderNavy, RoundedCornerShape(AppShape.tile))
            .padding(AppSpacing.list)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(typeIcon, fontSize = 11.sp, color = MutedGold, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.width(AppSpacing.lg))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    readableHistoryName(history.type, history.surahId, history.surahName),
                    fontSize = 13.sp,
                    color = SoftTextGold,
                    fontWeight = FontWeight.Medium
                )
                Text(dateStr, fontSize = 11.sp, color = DimGold)
            }
            Text(typeLabel, fontSize = 11.sp, color = labelColor)
        }
        if (history.type == "hizb" && history.extraInfo.isNotEmpty()) {
            Spacer(modifier = Modifier.height(AppSpacing.sm))
            Text(
                history.extraInfo,
                fontSize = 13.sp,
                color = Gold.copy(alpha = 0.7f),
                textAlign = TextAlign.End,
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(AppShape.smallControl))
                    .background(SubtleGoldSurface)
                    .padding(horizontal = AppSpacing.md, vertical = AppSpacing.xs)
            )
        }
    }
}

@Composable
private fun HizbSummaryRow(item: HizbDaySummaryItem, text: AppStrings) {
    val dateStr = remember(item.timestamp) {
        SimpleDateFormat("dd MMM yyyy · HH:mm", Locale.getDefault())
            .format(Date(item.timestamp))
    }
    val isWholeHizb = item.rubNumbers.size >= 4
    val title = if (isWholeHizb) {
        "Hizb ${item.hizbNumber}"
    } else {
        text.t("stats.hizbRubRead", item.hizbNumber, item.rubNumbers.size)
    }
    val details = if (isWholeHizb) {
        text.t("stats.wholeHizb")
    } else {
        item.rubNumbers.joinToString(", ") { rubNumber ->
            "Rub ${rubFractionLabel(rubNumber)}"
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.tile))
            .background(DeepNavy)
            .border(AppBorder.thin, BorderNavy, RoundedCornerShape(AppShape.tile))
            .padding(AppSpacing.list)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Hizb", fontSize = 11.sp, color = MutedGold, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.width(AppSpacing.lg))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    title,
                    fontSize = 13.sp,
                    color = SoftTextGold,
                    fontWeight = FontWeight.Medium
                )
                Text(dateStr, fontSize = 11.sp, color = DimGold)
            }
                Text(if (isWholeHizb) text.t("stats.hizb") else text.t("stats.rub"), fontSize = 11.sp, color = Gold)
        }
        Spacer(modifier = Modifier.height(AppSpacing.sm))
        Text(
            details,
            fontSize = 12.sp,
            color = Gold.copy(alpha = 0.78f),
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(AppShape.smallControl))
                .background(SubtleGoldSurface)
                .padding(horizontal = AppSpacing.md, vertical = AppSpacing.xs)
        )
        if (item.extraInfo.isNotEmpty()) {
            Spacer(modifier = Modifier.height(AppSpacing.sm))
            Text(
                item.extraInfo,
                fontSize = 13.sp,
                color = Gold.copy(alpha = 0.7f),
                textAlign = TextAlign.End,
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(AppShape.smallControl))
                    .background(SubtleGoldSurface)
                    .padding(horizontal = AppSpacing.md, vertical = AppSpacing.xs)
            )
        }
    }
}

@Composable
fun LegendRow(color: Color, label: String, count: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = AppSpacing.xs),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.size(AppIcon.tiny).clip(RoundedCornerShape(AppShape.marker)).background(color))
        Spacer(modifier = Modifier.width(AppSpacing.md))
        Text(label, style = AppTextStyle.bodySmall, color = SoftTextGold, modifier = Modifier.weight(1f))
        Text(count, style = AppTextStyle.bodySmall.copy(fontWeight = FontWeight.Bold), color = Gold)
    }
}

@Composable
fun EmptyText(text: String) {
    QuranEmptyState(title = text)
}

@Composable
fun StreakStatsCard(streak: Int, text: AppStrings) {
    QuranAppCard(
        modifier = Modifier.padding(bottom = AppSpacing.xxl),
        containerColor = TodayFocusSurface,
        borderColor = TodayFocusBorder
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(AppIcon.touch)
                    .clip(RoundedCornerShape(AppShape.control))
                    .background(StrongGoldSurface),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.LocalFireDepartment,
                    contentDescription = null,
                    tint = Gold,
                    modifier = Modifier.size(AppIcon.xl)
                )
            }
            Spacer(modifier = Modifier.width(AppSpacing.xl))
            Column(modifier = Modifier.weight(1f)) {
                Text(text.t("stats.streakTitle"), style = AppTextStyle.cardTitle, color = GoldLight)
                Text(text.t("home.stats.streakDays", streak), style = AppTextStyle.bodySmall, color = MutedGold)
            }
            Box(
                modifier = Modifier
                    .heightIn(min = AppComponentDefaults.minTouchTarget)
                    .clip(RoundedCornerShape(AppShape.control))
                    .background(DeepNavy)
                    .border(AppBorder.thin, BorderNavy, RoundedCornerShape(AppShape.control))
                    .padding(horizontal = AppSpacing.xl),
                contentAlignment = Alignment.Center
            ) {
                Text("$streak", fontSize = 24.sp, color = GoldLight, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun QuranProgressStatsCard(juzzDone: Int, hizbDone: Int, rubDone: Int, text: AppStrings) {
    QuranProgressCard(title = text.t("home.stats.totalProgress")) {
        QuranProgressBarRow(text.juz, juzzDone.coerceIn(0, 30), 30, DoneGreen, text)
        Spacer(modifier = Modifier.height(AppSpacing.xl))
        QuranProgressBarRow(text.t("stats.hizb"), hizbDone.coerceIn(0, 60), 60, Gold, text)
        Spacer(modifier = Modifier.height(AppSpacing.xl))
        QuranProgressBarRow(text.t("stats.rub"), rubDone.coerceIn(0, 240), 240, ReadBlue, text)
    }
}

@Composable
fun QuranProgressBarRow(label: String, value: Int, total: Int, color: Color, text: AppStrings) {
    val progress = if (total == 0) 0f else value.toFloat() / total.toFloat()
    QuranProgressRow(
        label = label,
        valueText = text.formatCountOfTotal(value, total),
        progress = progress,
        color = color
    )
}

@Composable
fun ReadingStatsOverviewCard(
    summary: ReadingStatsSummary,
    juzzDone: Int,
    hizbDone: Int,
    rubDone: Int,
    text: AppStrings
) {
    QuranProgressCard(title = text.t("stats.overviewTitle")) {
        if (summary.readActions == 0) {
            QuranEmptyState(
                title = text.t("stats.noHistory"),
                message = text.t("stats.overviewEmpty")
            )
            return@QuranProgressCard
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)
        ) {
            StatMiniTile(
                label = text.t("stats.pagesRead"),
                value = summary.pageEquivalent.toString(),
                detail = text.t("stats.ayahEquivalent", summary.ayahEquivalent),
                color = ReadBlue,
                modifier = Modifier.weight(1f)
            )
            StatMiniTile(
                label = text.points,
                value = summary.points.toString(),
                detail = text.t("stats.pointsExplain"),
                color = Gold,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(AppSpacing.xl))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)
        ) {
            StatMiniTile(
                label = text.t("stats.surahsRead"),
                value = summary.surahReads.toString(),
                detail = text.formatCountOfTotal(summary.surahReads.coerceAtMost(114), 114),
                color = DoneGreen,
                modifier = Modifier.weight(1f)
            )
            StatMiniTile(
                label = text.t("stats.rub"),
                value = rubDone.coerceIn(0, 240).toString(),
                detail = text.formatCountOfTotal(rubDone.coerceIn(0, 240), 240),
                color = ReadBlue,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(AppSpacing.xl))
        QuranProgressBarRow(text.juz, juzzDone.coerceIn(0, 30), 30, DoneGreen, text)
        Spacer(modifier = Modifier.height(AppSpacing.xl))
        QuranProgressBarRow(text.t("stats.hizb"), hizbDone.coerceIn(0, 60), 60, Gold, text)

        Spacer(modifier = Modifier.height(AppSpacing.xl))
        Text(
            text.t(
                "stats.periodEquivalent",
                ReadingMetrics.pageEquivalent(summary.todayAyahEquivalent),
                ReadingMetrics.pageEquivalent(summary.weekAyahEquivalent),
                ReadingMetrics.pageEquivalent(summary.monthAyahEquivalent)
            ),
            style = AppTextStyle.caption,
            color = DimGold
        )
    }
}

@Composable
private fun StatMiniTile(
    label: String,
    value: String,
    detail: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(AppShape.tile))
            .background(PeriodItemSurface)
            .border(AppBorder.thin, PeriodAccentSurface, RoundedCornerShape(AppShape.tile))
            .padding(AppSpacing.list),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(label, style = AppTextStyle.caption, color = MutedGold, maxLines = 1)
        Text(value, style = AppTextStyle.pageTitle, color = color, fontWeight = FontWeight.Bold)
        Text(detail, style = AppTextStyle.caption, color = DimGold, maxLines = 2, textAlign = TextAlign.Center)
    }
}

fun calculateStatsStreak(history: List<ReadingHistory>): Int {
    val activeDateKeys = history
        .filter { it.action == "read" || it.action == "memorized" }
        .mapNotNull { historyDateKey(it) }
        .toSet()
    if (activeDateKeys.isEmpty()) return 0

    val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val calendar = Calendar.getInstance()
    var currentKey = formatter.format(calendar.time)
    if (!activeDateKeys.contains(currentKey)) {
        calendar.add(Calendar.DAY_OF_YEAR, -1)
        currentKey = formatter.format(calendar.time)
    }

    var streak = 0
    while (activeDateKeys.contains(currentKey)) {
        streak++
        calendar.add(Calendar.DAY_OF_YEAR, -1)
        currentKey = formatter.format(calendar.time)
    }
    return streak
}

private fun historyDateKey(history: ReadingHistory): String? {
    if (history.dateKey.isNotBlank()) return history.dateKey
    if (history.timestamp <= 0L) return null
    return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(history.timestamp))
}

private fun groupReadingHistory(
    history: List<ReadingHistory>,
    mode: HistoryGroupMode
): List<HistoryGroup> {
    val sorted = history.sortedByDescending { it.timestamp }
    val locale = Locale("nl")
    val keyFormatter = SimpleDateFormat(
        when (mode) {
            HistoryGroupMode.Day -> "yyyy-MM-dd"
            HistoryGroupMode.Week -> "YYYY-'W'ww"
            HistoryGroupMode.Month -> "yyyy-MM"
        },
        locale
    )
    val titleFormatter = SimpleDateFormat(
        when (mode) {
            HistoryGroupMode.Day -> "EEEE d MMMM yyyy"
            HistoryGroupMode.Week -> "'Week' ww, YYYY"
            HistoryGroupMode.Month -> "MMMM yyyy"
        },
        locale
    )

    return sorted
        .groupBy { keyFormatter.format(Date(it.timestamp)) }
        .map { (key, items) ->
            HistoryGroup(
                key = key,
                title = titleFormatter.format(Date(items.maxOf { it.timestamp })),
                items = buildHistoryDisplayItems(items)
            )
        }
        .sortedByDescending { it.key }
}

private fun buildHistoryDisplayItems(items: List<ReadingHistory>): List<HistoryDisplayItem> {
    val rubEntries = items
        .filter { it.action == "read" && it.type == "hizb" }
        .mapNotNull { history ->
            val rubNumber = rubNumberFromHistoryNameSafe(history.surahName) ?: return@mapNotNull null
            RubHistoryEntry(history, rubNumber)
        }
    val rubHistoryIds = rubEntries.map { it.history.id }.toSet()
    val singleItems = items
        .filterNot { it.id in rubHistoryIds }
        .map { SingleHistoryItem(it) }

    val summarizedRubItems = rubEntries
        .groupBy { "${historyDateKey(it.history).orEmpty()}-${it.history.surahId}" }
        .map { (_, entries) ->
            val newest = entries.maxBy { it.history.timestamp }
            HizbDaySummaryItem(
                hizbNumber = newest.history.surahId,
                rubNumbers = entries.map { it.rubNumber }.distinct().sorted(),
                timestamp = newest.history.timestamp,
                extraInfo = entries.firstNotNullOfOrNull { it.history.extraInfo.takeIf(String::isNotBlank) }.orEmpty()
            )
        }

    return (singleItems + summarizedRubItems).sortedByDescending { it.timestamp }
}

private data class RubHistoryEntry(
    val history: ReadingHistory,
    val rubNumber: Int
)

private fun statsTypeLabel(type: String, text: AppStrings): String = when (type) {
    "surah" -> text.surah
    "juz" -> text.juz
    "hizb" -> text.hizbRub
    "rub" -> text.t("stats.rub")
    else -> type.replaceFirstChar { it.uppercase() }
}

private fun readableHistoryName(type: String, number: Int, name: String): String = when (type) {
    "juz" -> "Juz $number"
    "hizb" -> readableHizbRubNameSafe(number, name)
    else -> name
}

private fun readableHizbRubNameSafe(hizbNumber: Int, name: String): String {
    val rubLabel = when (rubNumberFromHistoryNameSafe(name)) {
        1 -> "Rub 1/4"
        2 -> "Rub 2/4"
        3 -> "Rub 3/4"
        4 -> "Rub 4/4"
        else -> null
    }
    return if (rubLabel == null) "Hizb $hizbNumber" else "Hizb $hizbNumber - $rubLabel"
}

private fun rubNumberFromHistoryNameSafe(name: String): Int? = when {
    name.contains("(1/4)") || name.contains("(Â¼)") || name.contains("(Ã‚Â¼)") -> 1
    name.contains("(1/2)") || name.contains("(Â½)") || name.contains("(Ã‚Â½)") -> 2
    name.contains("(3/4)") || name.contains("(Â¾)") || name.contains("(Ã‚Â¾)") -> 3
    name.contains("(1)") -> 4
    else -> null
}

private fun rubFractionLabel(rubNumber: Int): String = when (rubNumber) {
    1 -> "1/4"
    2 -> "2/4"
    3 -> "3/4"
    else -> "4/4"
}

private fun readableHizbRubName(hizbNumber: Int, name: String): String {
    val rubLabel = when {
        name.contains("(Â¼)") -> "Rub 1/4"
        name.contains("(Â½)") -> "Rub 2/4"
        name.contains("(Â¾)") -> "Rub 3/4"
        name.contains("(1)") -> "Rub 4/4"
        else -> null
    }
    return if (rubLabel == null) "Hizb $hizbNumber" else "Hizb $hizbNumber - $rubLabel"
}

private fun String.hasRubMarker(): Boolean =
    contains("(Â¼)") || contains("(Â½)") || contains("(Â¾)") || contains("(1)")

// â”€â”€ Taartgrafieken â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@Composable
fun TypePieChart(data: List<TypeCount>, modifier: Modifier = Modifier) {
    val total = data.sumOf { it.count }.toFloat()
    val anim  = remember { Animatable(0f) }
    LaunchedEffect(data) { anim.animateTo(1f, tween(800, easing = EaseOutCubic)) }
    Canvas(modifier = modifier) {
        val r = min(size.width, size.height) / 2f * 0.85f
        val c = Offset(size.width / 2f, size.height / 2f)
        var angle = -90f
        data.forEachIndexed { i, item ->
            val sweep = (item.count / total) * 360f * anim.value
            drawArc(statsPieColor(i), angle, sweep, true,
                Offset(c.x - r, c.y - r), Size(r * 2, r * 2))
            drawArc(DarkNavy, angle, 1.5f, true,
                Offset(c.x - r, c.y - r), Size(r * 2, r * 2))
            angle += sweep
        }
        drawCircle(MidNavy, r * 0.45f, c)
    }
}

@Composable
fun HizbPieChart(data: List<HizbReadCount>, modifier: Modifier = Modifier) {
    val total = data.sumOf { it.count }.toFloat()
    val anim  = remember { Animatable(0f) }
    LaunchedEffect(data) { anim.animateTo(1f, tween(800, easing = EaseOutCubic)) }
    Canvas(modifier = modifier) {
        val r = min(size.width, size.height) / 2f * 0.85f
        val c = Offset(size.width / 2f, size.height / 2f)
        var angle = -90f
        data.forEachIndexed { i, item ->
            val sweep = (item.count / total) * 360f * anim.value
            drawArc(statsPieColor(i), angle, sweep, true,
                Offset(c.x - r, c.y - r), Size(r * 2, r * 2))
            drawArc(DarkNavy, angle, 1.5f, true,
                Offset(c.x - r, c.y - r), Size(r * 2, r * 2))
            angle += sweep
        }
        drawCircle(MidNavy, r * 0.45f, c)
    }
}

@Composable
fun SurahPieChart(data: List<SurahReadCount>, modifier: Modifier = Modifier) {
    val total = data.sumOf { it.count }.toFloat()
    val anim  = remember { Animatable(0f) }
    LaunchedEffect(data) { anim.animateTo(1f, tween(800, easing = EaseOutCubic)) }
    Canvas(modifier = modifier) {
        val r = min(size.width, size.height) / 2f * 0.85f
        val c = Offset(size.width / 2f, size.height / 2f)
        var angle = -90f
        data.forEachIndexed { i, item ->
            val sweep = (item.count / total) * 360f * anim.value
            drawArc(statsPieColor(i), angle, sweep, true,
                Offset(c.x - r, c.y - r), Size(r * 2, r * 2))
            drawArc(DarkNavy, angle, 1.5f, true,
                Offset(c.x - r, c.y - r), Size(r * 2, r * 2))
            angle += sweep
        }
        drawCircle(MidNavy, r * 0.45f, c)
    }
}

// â”€â”€ Staafgrafiek â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@Composable
fun BarChart(data: List<Pair<String, Int>>, modifier: Modifier = Modifier) {
    val maxVal = data.maxOfOrNull { it.second } ?: 1
    val anim   = remember { Animatable(0f) }
    LaunchedEffect(data) { anim.animateTo(1f, tween(700)) }

    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
        verticalAlignment = Alignment.Bottom
    ) {
        data.forEach { (date, count) ->
            val heightFraction = if (maxVal > 0) (count.toFloat() / maxVal) * anim.value else 0f
            val dayLabel = try {
                val d = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(date)
                SimpleDateFormat("EEE", Locale("nl")).format(d!!)
            } catch (e: Exception) { date.takeLast(2) }

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.weight(1f).fillMaxHeight()
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentAlignment = Alignment.BottomCenter
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Bottom
                    ) {
                        Text("$count", style = AppTextStyle.caption, color = Gold, modifier = Modifier.padding(bottom = AppSpacing.xs))
                        Box(
                            modifier = Modifier
                                .width(AppChartSize.barWidth)
                                .fillMaxHeight(if (count > 0) heightFraction.coerceAtLeast(0.04f) else 0f)
                                .clip(RoundedCornerShape(topStart = AppShape.bar, topEnd = AppShape.bar))
                                .background(if (count == maxVal) Gold else ReadBlue.copy(alpha = 0.7f))
                        )
                    }
                }
                Text(
                    dayLabel,
                    style = AppTextStyle.caption,
                    color = DimGold,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().padding(top = AppSpacing.xs)
                )
            }
        }
    }
}
