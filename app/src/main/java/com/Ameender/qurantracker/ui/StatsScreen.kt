package com.Ameender.qurantracker.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
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
import com.Ameender.qurantracker.data.SurahReadCount
import com.Ameender.qurantracker.data.TypeCount
import com.Ameender.qurantracker.viewmodel.QuranViewModel
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.min

@Composable
fun StatsScreen(viewModel: QuranViewModel) {
    val mostRead      by viewModel.mostReadSurahs.collectAsState()
    val mostReadHizb  by viewModel.mostReadHizb.collectAsState()
    val recentHistory by viewModel.recentHistory.collectAsState()
    val dayActivity   by viewModel.dayActivity.collectAsState()
    val totalReads    by viewModel.totalReadCount.collectAsState()
    val typeCounts    by viewModel.allTypeCounts.collectAsState()

    var showResetDialog by remember { mutableStateOf(false) }

    if (showResetDialog) {
        AlertDialog(
            onDismissRequest  = { showResetDialog = false },
            containerColor    = MidNavy,
            titleContentColor = GoldLight,
            textContentColor  = LabelGold,
            title = { Text("Geschiedenis wissen?") },
            text  = { Text("Weet je zeker dat je alle leesgeschiedenis wilt verwijderen?") },
            confirmButton = {
                TextButton(onClick = { viewModel.resetHistory(); showResetDialog = false }) {
                    Text("Wissen", color = DeleteRed)
                }
            },
            dismissButton = {
                TextButton(onClick = { showResetDialog = false }) {
                    Text("Annuleren", color = Gold)
                }
            }
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(DarkNavy),
        contentPadding = PaddingValues(AppSpacing.screen)
    ) {
        // ── Header ──
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("📊 Statistieken", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    Text("$totalReads acties totaal", fontSize = 12.sp, color = MutedGold)
                }
                IconButton(
                    onClick = { showResetDialog = true },
                    modifier = Modifier
                        .clip(RoundedCornerShape(AppShape.control))
                        .background(DeleteSurface)
                        .border(1.dp, StrongDeleteSurface, RoundedCornerShape(AppShape.control))
                ) {
                    Icon(Icons.Default.Delete, contentDescription = "Reset", tint = DeleteRed)
                }
            }
        }

        // ── Taartgrafiek 1: Soera / Juz / Hizb / Rub verdeling ──
        item {
            StatsCard(title = "🥧 Verdeling per onderdeel") {
                if (typeCounts.isEmpty()) {
                    EmptyText("Nog geen geschiedenis. Begin met lezen!")
                } else {
                    TypePieChart(data = typeCounts, modifier = Modifier.fillMaxWidth().height(200.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    typeCounts.forEachIndexed { i, item ->
                        LegendRow(
                            color = PieColors[i % PieColors.size],
                            label = statsTypeLabel(item.type),
                            count = "${item.count}x"
                        )
                    }
                }
            }
        }

        // ── Taartgrafiek 2: Meest gelezen Hizb/Rub (met begin ayah) ──
        item {
            StatsCard(title = "📿 Meest gelezen Hizb/Rub") {
                if (mostReadHizb.isEmpty()) {
                    EmptyText("Nog geen Hizb of Rub gelezen.")
                } else {
                    HizbPieChart(data = mostReadHizb, modifier = Modifier.fillMaxWidth().height(200.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    mostReadHizb.take(6).forEachIndexed { i, item ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(12.dp)
                                    .clip(RoundedCornerShape(AppShape.marker))
                                    .background(PieColors[i % PieColors.size])
                                    .padding(top = 3.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    readableHizbRubName(item.surahId, item.surahName),
                                    fontSize = 13.sp,
                                    color = GoldLight,
                                    fontWeight = FontWeight.Bold
                                )
                                // Begin ayah tekst
                                if (item.extraInfo.isNotEmpty()) {
                                    Text(
                                        item.extraInfo.take(40) + if (item.extraInfo.length > 40) "…" else "",
                                        fontSize = 12.sp,
                                        color = Gold.copy(alpha = 0.8f),
                                        textAlign = TextAlign.End,
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("${item.count}x", fontSize = 13.sp, color = Gold, fontWeight = FontWeight.Bold)
                        }
                        if (i < mostReadHizb.size - 1) {
                            HorizontalDivider(color = BorderNavy, thickness = 0.5.dp, modifier = Modifier.padding(vertical = 2.dp))
                        }
                    }
                }
            }
        }

        // ── Taartgrafiek 3: Meest gelezen soera's ──
        item {
            StatsCard(title = "📖 Meest gelezen soera's") {
                if (mostRead.isEmpty()) {
                    EmptyText("Nog geen soera's gelezen.")
                } else {
                    SurahPieChart(data = mostRead, modifier = Modifier.fillMaxWidth().height(200.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    mostRead.take(6).forEachIndexed { i, item ->
                        LegendRow(
                            color = PieColors[i % PieColors.size],
                            label = item.surahName,
                            count = "${item.count}x"
                        )
                    }
                }
            }
        }

        // ── Staafgrafiek: activiteit per dag ──
        item {
            StatsCard(title = "📅 Activiteit afgelopen 7 dagen") {
                if (dayActivity.isEmpty()) {
                    EmptyText("Nog geen activiteit deze week.")
                } else {
                    BarChart(
                        data = dayActivity.map { it.dateKey to it.count },
                        modifier = Modifier.fillMaxWidth().height(140.dp)
                    )
                }
            }
        }

        // ── Recente geschiedenis ──
        item {
            Text(
                "🕐 Recente geschiedenis",
                fontSize = 15.sp, color = Gold,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(bottom = 10.dp)
            )
        }

        if (recentHistory.isEmpty()) {
            item { EmptyText("Nog geen geschiedenis.") }
        } else {
            items(recentHistory.take(30)) { history ->
                val dateStr = SimpleDateFormat("dd MMM yyyy · HH:mm", Locale("nl"))
                    .format(Date(history.timestamp))

                val typeIcon = when {
                    history.type == "juz"              -> "📜"
                    history.type == "hizb"             -> "📿"
                    history.action == "memorized"      -> "🧠"
                    else                               -> "📖"
                }
                val typeLabel = when {
                    history.type == "juz"              -> "Juz"
                    history.type == "hizb"             -> if (history.surahName.hasRubMarker()) "Rub" else "Hizb"
                    history.action == "memorized"      -> "Hifz"
                    else                               -> "Gelezen"
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
                        .padding(bottom = 6.dp)
                        .clip(RoundedCornerShape(AppShape.tile))
                        .background(MidNavy)
                        .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.tile))
                        .padding(AppSpacing.list)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(typeIcon, fontSize = 18.sp)
                        Spacer(modifier = Modifier.width(10.dp))
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
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            history.extraInfo,
                            fontSize = 13.sp,
                            color = Gold.copy(alpha = 0.7f),
                            textAlign = TextAlign.End,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(AppShape.smallControl))
                                .background(SubtleGoldSurface)
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(80.dp)) }
    }
}

// ── Helper composables ────────────────────────────────────

@Composable
fun StatsCard(title: String, content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(bottom = 14.dp),
        colors = CardDefaults.cardColors(containerColor = MidNavy),
        shape = RoundedCornerShape(AppShape.card)
    ) {
        Column(modifier = Modifier.padding(AppSpacing.card)) {
            Text(title, fontSize = 15.sp, color = Gold, fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(bottom = 12.dp))
            content()
        }
    }
}

@Composable
fun LegendRow(color: Color, label: String, count: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.size(12.dp).clip(RoundedCornerShape(AppShape.marker)).background(color))
        Spacer(modifier = Modifier.width(8.dp))
        Text(label, fontSize = 13.sp, color = SoftTextGold, modifier = Modifier.weight(1f))
        Text(count, fontSize = 13.sp, color = Gold, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun EmptyText(text: String) {
    Text(
        text, fontSize = 13.sp, color = DimGold,
        textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp)
    )
}

private fun statsTypeLabel(type: String): String = when (type) {
    "surah" -> "📖 Soera"
    "juz" -> "📜 Juz"
    "hizb" -> "📿 Hizb/Rub"
    "rub" -> "🔹 Rub"
    else -> type.replaceFirstChar { it.uppercase() }
}

private fun readableHistoryName(type: String, number: Int, name: String): String = when (type) {
    "juz" -> "Juz $number"
    "hizb" -> readableHizbRubName(number, name)
    else -> name
}

private fun readableHizbRubName(hizbNumber: Int, name: String): String {
    val rubLabel = when {
        name.contains("(¼)") -> "Rub 1/4"
        name.contains("(½)") -> "Rub 2/4"
        name.contains("(¾)") -> "Rub 3/4"
        name.contains("(1)") -> "Rub 4/4"
        else -> null
    }
    return if (rubLabel == null) "Hizb $hizbNumber" else "Hizb $hizbNumber - $rubLabel"
}

private fun String.hasRubMarker(): Boolean =
    contains("(¼)") || contains("(½)") || contains("(¾)") || contains("(1)")

// ── Taartgrafieken ────────────────────────────────────────

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
            drawArc(PieColors[i % PieColors.size], angle, sweep, true,
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
            drawArc(PieColors[i % PieColors.size], angle, sweep, true,
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
            drawArc(PieColors[i % PieColors.size], angle, sweep, true,
                Offset(c.x - r, c.y - r), Size(r * 2, r * 2))
            drawArc(DarkNavy, angle, 1.5f, true,
                Offset(c.x - r, c.y - r), Size(r * 2, r * 2))
            angle += sweep
        }
        drawCircle(MidNavy, r * 0.45f, c)
    }
}

// ── Staafgrafiek ──────────────────────────────────────────

@Composable
fun BarChart(data: List<Pair<String, Int>>, modifier: Modifier = Modifier) {
    val maxVal = data.maxOfOrNull { it.second } ?: 1
    val anim   = remember { Animatable(0f) }
    LaunchedEffect(data) { anim.animateTo(1f, tween(700)) }

    Column(modifier = modifier) {
        Row(
            modifier = Modifier.weight(1f).fillMaxWidth(),
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            data.forEach { (date, count) ->
                val h = (count.toFloat() / maxVal) * anim.value
                val dayLabel = try {
                    val d = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(date)
                    SimpleDateFormat("EEE", Locale("nl")).format(d!!)
                } catch (e: Exception) { date.takeLast(2) }

                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                    Text("$count", fontSize = 10.sp, color = Gold, modifier = Modifier.padding(bottom = 3.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.7f)
                            .fillMaxHeight(h.coerceAtLeast(0.02f))
                            .clip(RoundedCornerShape(topStart = AppShape.bar, topEnd = AppShape.bar))
                            .background(if (count == maxVal) Gold else ReadBlue.copy(alpha = 0.7f))
                    )
                }
            }
        }
        Row(
            modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            data.forEach { (date, _) ->
                val dayLabel = try {
                    val d = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(date)
                    SimpleDateFormat("EEE", Locale("nl")).format(d!!)
                } catch (e: Exception) { date.takeLast(2) }
                Text(dayLabel, fontSize = 10.sp, color = DimGold,
                    textAlign = TextAlign.Center, modifier = Modifier.weight(1f))
            }
        }
    }
}
