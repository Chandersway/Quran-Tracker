package com.Ameender.qurantracker.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.text.KeyboardOptions
import com.Ameender.qurantracker.data.ALL_HIZB
import com.Ameender.qurantracker.data.PlanningItem
import com.Ameender.qurantracker.data.ReadingHistory
import com.Ameender.qurantracker.data.ReadingJourney
import com.Ameender.qurantracker.viewmodel.GoalViewModel
import com.Ameender.qurantracker.viewmodel.PlanningViewModel
import com.Ameender.qurantracker.viewmodel.QuranViewModel
import java.util.Calendar
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun DashboardScreen(
    viewModel: QuranViewModel,
    goalViewModel: GoalViewModel,
    planningViewModel: PlanningViewModel
) {
    val allProgress   by viewModel.allProgress.collectAsState()
    val juzzProgress  by viewModel.juzzProgress.collectAsState()
    val hizbProgress  by viewModel.hizbProgress.collectAsState()
    val rubProgress   by viewModel.rubProgress.collectAsState()
    val surahProgress by viewModel.surahProgress.collectAsState()
    val goal          by goalViewModel.dailyGoal.collectAsState()
    val readingJourney by goalViewModel.readingJourney.collectAsState()
    val todayCount    by goalViewModel.todayCount.collectAsState()
    val streak        by goalViewModel.streak.collectAsState()
    val allHistory    by viewModel.allHistory.collectAsState()
    val planningItems by planningViewModel.allItems.collectAsState()
    val todayKey = remember { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()) }
    val todayItems = remember(planningItems, todayKey) {
        planningItems.filter { it.date == todayKey }
    }
    val todayDoneItems = todayItems.count { it.isDone }

    val completedHizbFromRub = remember(rubProgress) { completedHizbCountFromRub(rubProgress.map { it.id to it.isRead }) }
    val completedJuzFromRub = remember(rubProgress) { completedJuzCountFromRub(rubProgress.map { it.id to it.isRead }) }
    val manualJuzDone = juzzProgress.count { it.isRead }
    val manualHizbDone = hizbProgress.count { it.isRead }
    val juzzDone  = maxOf(manualJuzDone, completedJuzFromRub)
    val hizbDone  = maxOf(manualHizbDone, completedHizbFromRub)
    val rubDone   = rubProgress.count  { it.isRead }
    val surahMem  = surahProgress.count { it.isMemorized }
    val journeyProgress = remember(readingJourney, rubProgress, hizbProgress, juzzProgress, planningItems) {
        calculateReadingJourneyProgress(
            journey = readingJourney,
            rubDone = rubDone,
            hizbDone = hizbDone,
            juzDone = juzzDone,
            planningItems = planningItems
        )
    }

    val progress    = if (goal.target > 0)
        (todayCount.toFloat() / goal.target).coerceIn(0f, 1f)
    else 0f
    val goalReached = todayCount >= goal.target && goal.target > 0
    val unitLabel   = goalViewModel.unitLabel(goal.unit)
    val periodStats = remember(allHistory) { calculatePeriodStats(allHistory) }
    val hifzOverview = remember(surahProgress, hizbProgress, juzzProgress) {
        calculateHifzOverview(
            surahScores = surahProgress.map { HifzRawScore(it.referenceId, it.progress, it.hasHifzScore, it.lastUpdated) },
            hizbScores = hizbProgress.map { HifzRawScore(it.referenceId, it.progress, it.hasHifzScore, it.lastUpdated) },
            juzScores = juzzProgress.map { HifzRawScore(it.referenceId, it.progress, it.hasHifzScore, it.lastUpdated) }
        )
    }
    var quickCheckInOpen by remember { mutableStateOf(false) }

    if (quickCheckInOpen) {
        QuickCheckInDialog(
            onDismiss = { quickCheckInOpen = false },
            onSave = { type, number, subNumber ->
                when (type) {
                    "surah" -> {
                        val surah = ALL_SURAHS.find { it.id == number }
                        viewModel.confirmToggleSurah(number, surah?.name ?: "Soera $number", "read", false)
                    }
                    "juz" -> viewModel.confirmToggleJuz(number, false)
                    "hizb" -> {
                        (1..4).forEach { rub ->
                            viewModel.confirmToggleRub(number, rub, false)
                        }
                    }
                    else -> viewModel.confirmToggleRub(number, subNumber, false)
                }
                quickCheckInOpen = false
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkNavy)
            .verticalScroll(rememberScrollState())
            .padding(AppSpacing.screen)
    ) {
        // ── Header ──
        Text("﷽", fontSize = 26.sp, color = GoldLight,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth())
        Text("Quran Tracker", fontSize = 20.sp, fontWeight = FontWeight.Bold,
            color = GoldLight, textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth())
        Text("متتبع القرآن الكريم", fontSize = 12.sp, color = Gold,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().padding(bottom = 20.dp))

        TodayFocusCard(
            todayCount = todayCount,
            goalTarget = goal.target,
            unitLabel = unitLabel,
            progress = progress,
            goalReached = goalReached,
            todayItems = todayItems,
            todayDoneItems = todayDoneItems,
            onTogglePlan = planningViewModel::toggleDone,
            onQuickCheckIn = { quickCheckInOpen = true }
        )

        ReadingJourneyCard(progress = journeyProgress)

        PeriodProgressCard(
            todayReads = periodStats.todayReads,
            weekReads = periodStats.weekReads,
            monthReads = periodStats.monthReads,
            activeDaysThisWeek = periodStats.activeDaysThisWeek,
            streak = streak
        )

        HifzOverviewCard(overview = hifzOverview)

        ReviewDueCard(
            items = hifzOverview.reviewItems,
            plannedItems = planningItems,
            onAddToAgenda = { item ->
                planningViewModel.addItem(
                    date = reviewDateKey(item.daysUntilReview),
                    type = item.type,
                    referenceId = item.id,
                    displayName = item.name,
                    arabicText = "${item.typeLabel} · Hifz herhaling"
                )
            }
        )
/*

        // ── Dagelijks doel cirkel ──
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            colors   = CardDefaults.cardColors(containerColor = MidNavy),
            shape    = RoundedCornerShape(AppShape.card)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("Vandaag", fontSize = 13.sp, color = MutedGold,
                    modifier = Modifier.padding(bottom = 12.dp))

                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .align(Alignment.CenterHorizontally)
                        .size(180.dp)
                ) {
                    val animProgress = remember { Animatable(0f) }
                    LaunchedEffect(progress) {
                        animProgress.animateTo(progress, tween(800, easing = EaseOutCubic))
                    }

                    androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
                        val stroke = 18.dp.toPx()
                        val inset  = stroke / 2
                        val arcSize = Size(size.width - stroke, size.height - stroke)
                        val topLeft = Offset(inset, inset)

                        // Achtergrond ring
                        drawArc(
                            color = BorderNavy,
                            startAngle = -90f, sweepAngle = 360f,
                            useCenter = false,
                            style = Stroke(stroke, cap = StrokeCap.Round),
                            topLeft = topLeft, size = arcSize
                        )
                        // Voortgang ring
                        if (animProgress.value > 0f) {
                            drawArc(
                                color = if (goalReached) DoneGreen else Gold,
                                startAngle = -90f,
                                sweepAngle = 360f * animProgress.value,
                                useCenter = false,
                                style = Stroke(stroke, cap = StrokeCap.Round),
                                topLeft = topLeft, size = arcSize
                            )
                        }
                    }

                    // Midden: doel tekst
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        if (goalReached) {
                            Text("✅", fontSize = 32.sp)
                            Text("Gehaald!", fontSize = 12.sp, color = DoneGreen,
                                fontWeight = FontWeight.Bold)
                        } else {
                            Text(
                                "$todayCount",
                                fontSize = 36.sp,
                                fontWeight = FontWeight.Bold,
                                color = GoldLight
                            )
                            Text(
                                "/ ${goal.target}",
                                fontSize = 14.sp,
                                color = MutedGold
                            )
                            Text(
                                unitLabel,
                                fontSize = 12.sp,
                                color = Gold,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // MashaAllah tekst
                if (goalReached) {
                    Text("MashaAllah! 🌙 Barakallah feek!",
                        fontSize = 13.sp, color = DoneGreen,
                        fontWeight = FontWeight.Medium)
                } else {
                    Text(
                        "Nog ${goal.target - todayCount} $unitLabel te gaan",
                        fontSize = 12.sp, color = MutedGold
                    )
                }
            }
        }

*/
        // ── Streak ──
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            colors   = CardDefaults.cardColors(containerColor = GoldSurface),
            shape    = RoundedCornerShape(AppShape.card)
        ) {
            Row(
                modifier = Modifier.padding(AppSpacing.card),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("🔥", fontSize = 36.sp)
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text("$streak dagen op rij",
                        fontSize = 20.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    Text(
                        when {
                            streak == 0  -> "Begin vandaag!"
                            streak < 7   -> "Goed bezig! Blijf doorgaan!"
                            streak < 30  -> "Geweldige streak! 💪"
                            else         -> "MashaAllah! Ongelooflijk! 🌟"
                        },
                        fontSize = 12.sp, color = MutedGold
                    )
                }
            }
        }

        // ── Statistieken grid ──
        Text("📊 Voortgang", fontSize = 15.sp, color = Gold,
            fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 10.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatCard(Modifier.weight(1f), "📜", "Juz",       juzzDone,  30,  DoneGreen)
            StatCard(Modifier.weight(1f), "📿", "Hizb",      hizbDone,  60,  Gold)
        }
        Spacer(modifier = Modifier.height(10.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatCard(Modifier.weight(1f), "🔹", "Rub",       rubDone,   240, ReadBlue)
            StatCard(Modifier.weight(1f), "🧠", "Hifz",      surahMem,  114, DeleteRed)
        }

        Spacer(modifier = Modifier.height(16.dp))

        // ── Voortgangsbalken ──
        Text("✨ Totale voortgang", fontSize = 15.sp, color = Gold,
            fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 10.dp))

        Card(
            colors = CardDefaults.cardColors(containerColor = MidNavy),
            shape  = RoundedCornerShape(AppShape.card),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(AppSpacing.card)) {
                ProgressBar("Rub",          rubDone,  240, ReadBlue)
                Spacer(modifier = Modifier.height(10.dp))
                ProgressBar("Hizb",         hizbDone, 60,  Gold)
                Spacer(modifier = Modifier.height(10.dp))
                ProgressBar("Juz",          juzzDone, 30,  DoneGreen)
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
        Text("بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
            fontSize = 12.sp, color = DarkGold,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(20.dp))
    }
}

@Composable
fun TodayFocusCard(
    todayCount: Int,
    goalTarget: Int,
    unitLabel: String,
    progress: Float,
    goalReached: Boolean,
    todayItems: List<PlanningItem>,
    todayDoneItems: Int,
    onTogglePlan: (PlanningItem) -> Unit,
    onQuickCheckIn: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp),
        colors = CardDefaults.cardColors(containerColor = TodayFocusSurface),
        shape = RoundedCornerShape(AppShape.card),
        border = androidx.compose.foundation.BorderStroke(1.dp, TodayFocusBorder)
    ) {
        Column(modifier = Modifier.padding(AppSpacing.card)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Vandaag", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    Text(
                        if (goalReached) "Dagdoel gehaald" else "Nog ${(goalTarget - todayCount).coerceAtLeast(0)} $unitLabel te gaan",
                        fontSize = 12.sp,
                        color = if (goalReached) DoneGreen else MutedGold
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(AppShape.tile))
                    .background(PeriodItemSurface)
                    .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.tile))
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                TodayGoalPie(
                    progress = progress,
                    todayCount = todayCount,
                    goalTarget = goalTarget,
                    unitLabel = unitLabel,
                    goalReached = goalReached
                )
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        if (goalReached) "Voltooid" else "Dagelijks doel",
                        fontSize = 13.sp,
                        color = MutedGold,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        "$todayCount van $goalTarget",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (goalReached) DoneGreen else GoldLight
                    )
                    Text(unitLabel, fontSize = 12.sp, color = Gold)
                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = onQuickCheckIn,
                        modifier = Modifier.fillMaxWidth().height(36.dp),
                        shape = RoundedCornerShape(AppShape.control),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Gold,
                            contentColor = DarkNavy
                        )
                    ) {
                        Text("Snelle check-in", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
            Text(
                "Planning vandaag ${if (todayItems.isNotEmpty()) "$todayDoneItems/${todayItems.size}" else ""}",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = LabelGold
            )
            Spacer(modifier = Modifier.height(8.dp))

            if (todayItems.isEmpty()) {
                Text(
                    "Geen items gepland voor vandaag.",
                    fontSize = 12.sp,
                    color = MutedGold
                )
            } else {
                todayItems.take(4).forEach { item ->
                    TodayPlanRow(item = item, onToggle = { onTogglePlan(item) })
                    Spacer(modifier = Modifier.height(6.dp))
                }
                if (todayItems.size > 4) {
                    Text(
                        "+${todayItems.size - 4} meer in Agenda",
                        fontSize = 11.sp,
                        color = MutedGold,
                        modifier = Modifier.align(Alignment.End)
                    )
                }
            }
        }
    }
}

@Composable
fun TodayGoalPie(
    progress: Float,
    todayCount: Int,
    goalTarget: Int,
    unitLabel: String,
    goalReached: Boolean
) {
    val animProgress = remember { Animatable(0f) }
    LaunchedEffect(progress) {
        animProgress.animateTo(progress, tween(800, easing = EaseOutCubic))
    }

    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier.size(116.dp)
    ) {
        androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
            val inset = 4.dp.toPx()
            val pieSize = Size(size.width - inset * 2, size.height - inset * 2)
            val topLeft = Offset(inset, inset)

            drawArc(
                color = DeepNavy,
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = true,
                topLeft = topLeft,
                size = pieSize
            )
            drawArc(
                color = if (goalReached) DoneGreen else Gold,
                startAngle = -90f,
                sweepAngle = 360f * animProgress.value,
                useCenter = true,
                topLeft = topLeft,
                size = pieSize
            )
            drawCircle(
                color = PeriodItemSurface,
                radius = size.minDimension * 0.31f,
                center = center
            )
            drawCircle(
                color = BorderNavy,
                radius = size.minDimension * 0.48f,
                center = center,
                style = Stroke(width = 1.2.dp.toPx())
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                "$todayCount",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = if (goalReached) DoneGreen else GoldLight
            )
            Text(
                "/$goalTarget",
                fontSize = 11.sp,
                color = MutedGold
            )
            Text(
                unitLabel,
                fontSize = 9.sp,
                color = Gold,
                maxLines = 1
            )
        }
    }
}

@Composable
fun ReadingJourneyCard(progress: ReadingJourneyProgress) {
    if (!progress.enabled) return

    val statusColor = when (progress.status) {
        JourneyStatus.AHEAD -> DoneGreen
        JourneyStatus.BEHIND -> DeleteRed
        else -> Gold
    }
    val statusText = when (progress.status) {
        JourneyStatus.AHEAD -> "voor op schema"
        JourneyStatus.BEHIND -> "${progress.behindParts} rub achter"
        JourneyStatus.ON_TRACK -> "op schema"
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp),
        colors = CardDefaults.cardColors(containerColor = TodayFocusSurface),
        shape = RoundedCornerShape(AppShape.card),
        border = androidx.compose.foundation.BorderStroke(1.dp, TodayFocusBorder)
    ) {
        Column(modifier = Modifier.padding(AppSpacing.card)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Leesreis", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    Text("Hele Quran in ${progress.totalDays} dagen", fontSize = 12.sp, color = MutedGold)
                }
                Text(
                    "${progress.percentDone}%",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = statusColor
                )
            }

            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(AppShape.tile))
                    .background(PeriodItemSurface)
                    .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.tile))
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                JourneyProgressPie(
                    doneProgress = progress.doneProgress,
                    plannedProgress = progress.plannedProgress,
                    centerText = "${progress.percentDone}%",
                    statusColor = statusColor
                )
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        statusText,
                        fontSize = 13.sp,
                        color = statusColor,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "${progress.doneParts} van 240 rub-delen",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = GoldLight
                    )
                    Text("gedaan", fontSize = 12.sp, color = Gold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Gepland tot vandaag: ${progress.plannedParts}/240",
                        fontSize = 11.sp,
                        color = MutedGold
                    )
                    Text(
                        "Groene ring is gedaan, lichte ring is planning.",
                        fontSize = 10.sp,
                        color = DimGold
                    )
                }
            }
        }
    }
}

@Composable
fun JourneyProgressPie(
    doneProgress: Float,
    plannedProgress: Float,
    centerText: String,
    statusColor: Color
) {
    val doneAnim = remember { Animatable(0f) }
    val plannedAnim = remember { Animatable(0f) }
    LaunchedEffect(doneProgress, plannedProgress) {
        doneAnim.animateTo(doneProgress, tween(800, easing = EaseOutCubic))
        plannedAnim.animateTo(plannedProgress, tween(800, easing = EaseOutCubic))
    }

    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(116.dp)) {
        androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
            val stroke = 12.dp.toPx()
            val inset = stroke / 2
            val arcSize = Size(size.width - stroke, size.height - stroke)
            val topLeft = Offset(inset, inset)

            drawArc(
                color = DeepNavy,
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = Stroke(stroke, cap = StrokeCap.Round)
            )
            drawArc(
                color = Gold.copy(alpha = 0.28f),
                startAngle = -90f,
                sweepAngle = 360f * plannedAnim.value,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = Stroke(stroke, cap = StrokeCap.Round)
            )
            drawArc(
                color = statusColor,
                startAngle = -90f,
                sweepAngle = 360f * doneAnim.value,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = Stroke(stroke * 0.68f, cap = StrokeCap.Round)
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(centerText, fontSize = 22.sp, color = GoldLight, fontWeight = FontWeight.Bold)
            Text("gedaan", fontSize = 10.sp, color = MutedGold)
        }
    }
}

@Composable
fun TodayPlanRow(item: PlanningItem, onToggle: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.smallControl))
            .background(if (item.isDone) TodayDoneSurface else DeepNavy)
            .border(
                1.dp,
                if (item.isDone) DoneGreen else BorderNavy,
                RoundedCornerShape(AppShape.smallControl)
            )
            .padding(horizontal = 10.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                item.displayName,
                fontSize = 12.sp,
                color = if (item.isDone) DoneGreen else SoftTextGold,
                fontWeight = FontWeight.Medium,
                maxLines = 1
            )
            if (item.arabicText.isNotBlank()) {
                Text(
                    item.arabicText,
                    fontSize = 10.sp,
                    color = MutedGold,
                    maxLines = 1
                )
            }
        }
        Button(
            onClick = onToggle,
            modifier = Modifier.height(30.dp),
            shape = RoundedCornerShape(AppShape.smallControl),
            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (item.isDone) DoneGreen else Gold,
                contentColor = DarkNavy
            )
        ) {
            Text(if (item.isDone) "Klaar" else "Gedaan", fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun QuickCheckInDialog(
    onDismiss: () -> Unit,
    onSave: (type: String, number: Int, subNumber: Int) -> Unit
) {
    var selectedType by remember { mutableStateOf("surah") }
    var number by remember { mutableIntStateOf(1) }
    var subNumber by remember { mutableIntStateOf(1) }

    val maxNumber = when (selectedType) {
        "juz" -> 30
        "hizb", "rub" -> 60
        else -> 114
    }
    val title = when (selectedType) {
        "juz" -> "Juz"
        "hizb", "rub" -> "Hizb"
        else -> "Soera"
    }
    val selectedSurah = remember(selectedType, number) {
        if (selectedType == "surah") ALL_SURAHS.find { it.id == number } else null
    }
    val selectedHizb = remember(selectedType, number) {
        if (selectedType == "hizb" || selectedType == "rub") ALL_HIZB.find { it.hizbNumber == number } else null
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        titleContentColor = GoldLight,
        textContentColor = LabelGold,
        title = { Text("Snelle check-in") },
        text = {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf("surah" to "Soera", "juz" to "Juz", "hizb" to "Hizb", "rub" to "Rub").forEach { (type, label) ->
                        val selected = selectedType == type
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(AppShape.smallControl))
                                .background(if (selected) StrongGoldSurface else DeepNavy)
                                .border(1.dp, if (selected) Gold else BorderNavy, RoundedCornerShape(AppShape.smallControl))
                                .padding(vertical = 8.dp)
                                .clickable {
                                    selectedType = type
                                    number = number.coerceIn(1, when (type) {
                                        "juz" -> 30
                                        "hizb", "rub" -> 60
                                        else -> 114
                                    })
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(label, fontSize = 11.sp, color = if (selected) GoldLight else DimGold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                QuickCheckStepper(
                    label = title,
                    value = number,
                    min = 1,
                    max = maxNumber,
                    onChange = { number = it }
                )

                QuickCheckSelectedInfo(
                    selectedType = selectedType,
                    surah = selectedSurah,
                    hizb = selectedHizb
                )

                if (selectedType == "rub") {
                    Spacer(modifier = Modifier.height(8.dp))
                    QuickCheckStepper(
                        label = "Rub",
                        value = subNumber,
                        min = 1,
                        max = 4,
                        onChange = { subNumber = it }
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = { onSave(selectedType, number, subNumber) }) {
                Text("Opslaan als gelezen", color = Gold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Annuleren", color = MutedGold)
            }
        }
    )
}

@Composable
fun QuickCheckSelectedInfo(
    selectedType: String,
    surah: Surah?,
    hizb: com.Ameender.qurantracker.data.HizbInfo?
) {
    val title = when (selectedType) {
        "surah" -> surah?.let { "${it.id}. ${it.name}" }
        "hizb", "rub" -> hizb?.let { "Hizb ${it.hizbNumber} - ${it.surahArabic} ${it.surahNumber}:${it.ayahNumber}" }
        else -> null
    }
    val subtitle = when (selectedType) {
        "surah" -> surah?.arabic
        "hizb", "rub" -> hizb?.startText
        else -> null
    }
    if (title != null) {
        Spacer(modifier = Modifier.height(8.dp))
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(AppShape.control))
                .background(PeriodItemSurface)
                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                .padding(horizontal = 10.dp, vertical = 8.dp)
        ) {
            Text(title, fontSize = 12.sp, color = GoldLight, fontWeight = FontWeight.Bold)
            if (subtitle != null) {
                Text(subtitle, fontSize = 11.sp, color = Gold, maxLines = 2)
            }
        }
    }
}

@Composable
fun QuickCheckStepper(
    label: String,
    value: Int,
    min: Int,
    max: Int,
    onChange: (Int) -> Unit
) {
    var input by remember(value) { mutableStateOf(value.toString()) }
    Column {
        Text(label, fontSize = 11.sp, color = MutedGold)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(AppShape.control))
                .background(DeepNavy)
                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control)),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clickable { onChange((value - 1).coerceAtLeast(min)) },
                contentAlignment = Alignment.Center
            ) {
                Text("-", fontSize = 16.sp, color = GoldLight)
            }
            OutlinedTextField(
                value = input,
                onValueChange = { raw ->
                    val digits = raw.filter { it.isDigit() }.take(3)
                    input = digits
                    digits.toIntOrNull()?.let { onChange(it.coerceIn(min, max)) }
                },
                singleLine = true,
                textStyle = LocalTextStyle.current.copy(
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = GoldLight,
                    textAlign = TextAlign.Center
                ),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier
                    .weight(1f)
                    .height(52.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Gold,
                    unfocusedBorderColor = Color.Transparent,
                    focusedContainerColor = DeepNavy,
                    unfocusedContainerColor = DeepNavy,
                    cursorColor = Gold
                )
            )
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clickable { onChange((value + 1).coerceAtMost(max)) },
                contentAlignment = Alignment.Center
            ) {
                Text("+", fontSize = 16.sp, color = GoldLight)
            }
        }
        Text("Bereik: $min-$max", fontSize = 10.sp, color = DimGold, modifier = Modifier.padding(top = 3.dp))
    }
}

@Composable
fun PeriodProgressCard(
    todayReads: Int,
    weekReads: Int,
    monthReads: Int,
    activeDaysThisWeek: Int,
    streak: Int
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp),
        colors = CardDefaults.cardColors(containerColor = PeriodSurface),
        shape = RoundedCornerShape(AppShape.card),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy)
    ) {
        Column(modifier = Modifier.padding(AppSpacing.card)) {
            Text(
                "Progressie",
                fontSize = 15.sp,
                color = Gold,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 10.dp)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                PeriodStatTile(
                    modifier = Modifier.weight(1f),
                    label = "Vandaag",
                    value = todayReads,
                    detail = "acties",
                    color = Gold
                )
                PeriodStatTile(
                    modifier = Modifier.weight(1f),
                    label = "Week",
                    value = weekReads,
                    detail = "$activeDaysThisWeek/7 dagen",
                    color = ReadBlue
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                PeriodStatTile(
                    modifier = Modifier.weight(1f),
                    label = "Maand",
                    value = monthReads,
                    detail = "acties",
                    color = DoneGreen
                )
                PeriodStatTile(
                    modifier = Modifier.weight(1f),
                    label = "Streak",
                    value = streak,
                    detail = "dagen",
                    color = DeleteRed
                )
            }
        }
    }
}

@Composable
fun PeriodStatTile(
    modifier: Modifier,
    label: String,
    value: Int,
    detail: String,
    color: Color
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(AppShape.tile))
            .background(PeriodItemSurface)
            .border(1.dp, PeriodAccentSurface, RoundedCornerShape(AppShape.tile))
            .padding(horizontal = 10.dp, vertical = 9.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(label, fontSize = 11.sp, color = MutedGold)
        Text(
            "$value",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = color
        )
        Text(detail, fontSize = 10.sp, color = DimGold, maxLines = 1)
    }
}

@Composable
fun HifzOverviewCard(overview: HifzOverview) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp),
        colors = CardDefaults.cardColors(containerColor = HifzDashboardSurface),
        shape = RoundedCornerShape(AppShape.card),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy)
    ) {
        Column(modifier = Modifier.padding(AppSpacing.card)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Hifz-overzicht", fontSize = 15.sp, color = Gold, fontWeight = FontWeight.Bold)
                    Text(
                        "${overview.scoredCount} scores · ${overview.surahCount} soera · ${overview.hizbCount} hizb · ${overview.juzCount} juz",
                        fontSize = 11.sp,
                        color = MutedGold
                    )
                }
                Text(
                    "${overview.averageScore}/100",
                    fontSize = 22.sp,
                    color = if (overview.averageScore > 0) hifzScoreBorder(overview.averageScore) else MutedGold,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(10.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(AppShape.bar))
                    .background(BorderNavy)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth((overview.averageScore / 100f).coerceIn(0f, 1f))
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(AppShape.bar))
                        .background(if (overview.averageScore > 0) hifzScoreBorder(overview.averageScore) else BorderNavy)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (overview.scoredCount == 0) {
                Text(
                    "Nog geen Hifz-scores. Stel een bereik in of houd een item lang vast.",
                    fontSize = 12.sp,
                    color = MutedGold
                )
            } else {
                HifzRecommendationSection(
                    title = "Herhaal eerst",
                    items = overview.weakest,
                    emptyText = "Geen lage scores gevonden."
                )
                Spacer(modifier = Modifier.height(10.dp))
                HifzRecommendationSection(
                    title = "Sterk",
                    items = overview.strongest,
                    emptyText = "Nog geen sterke scores."
                )
            }
        }
    }
}

@Composable
fun HifzRecommendationSection(
    title: String,
    items: List<HifzScoreItem>,
    emptyText: String
) {
    Text(title, fontSize = 12.sp, color = LabelGold, fontWeight = FontWeight.Bold)
    Spacer(modifier = Modifier.height(6.dp))
    if (items.isEmpty()) {
        Text(emptyText, fontSize = 11.sp, color = MutedGold)
    } else {
        items.forEach { item ->
            HifzScoreRow(item)
            Spacer(modifier = Modifier.height(5.dp))
        }
    }
}

@Composable
fun HifzScoreRow(item: HifzScoreItem) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.smallControl))
            .background(HifzDashboardItem)
            .border(
                1.dp,
                if (item.score > 0) hifzScoreBorder(item.score) else BorderNavy,
                RoundedCornerShape(AppShape.smallControl)
            )
            .padding(horizontal = 10.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(item.name, fontSize = 12.sp, color = SoftTextGold, fontWeight = FontWeight.Medium)
            Text("${item.typeLabel} · ${item.arabic}", fontSize = 11.sp, color = Gold)
        }
        Text(
            "${item.score}",
            fontSize = 16.sp,
            color = if (item.score > 0) hifzScoreBorder(item.score) else MutedGold,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun ReviewDueCard(
    items: List<ReviewDueItem>,
    plannedItems: List<PlanningItem>,
    onAddToAgenda: (ReviewDueItem) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp),
        colors = CardDefaults.cardColors(containerColor = HifzDashboardSurface),
        shape = RoundedCornerShape(AppShape.card),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy)
    ) {
        Column(modifier = Modifier.padding(AppSpacing.card)) {
            Text("Te herhalen", fontSize = 15.sp, color = Gold, fontWeight = FontWeight.Bold)
            Text(
                "Gebaseerd op Hifz-score en laatste scoremoment",
                fontSize = 11.sp,
                color = MutedGold,
                modifier = Modifier.padding(top = 2.dp, bottom = 10.dp)
            )

            if (items.isEmpty()) {
                Text(
                    "Nog geen herhaaladvies. Geef eerst Hifz-scores.",
                    fontSize = 12.sp,
                    color = MutedGold
                )
            } else {
                items.take(5).forEach { item ->
                    val targetDate = reviewDateKey(item.daysUntilReview)
                    val isPlanned = plannedItems.any { planned ->
                        planned.date == targetDate &&
                            planned.type == item.type &&
                            planned.referenceId == item.id &&
                            planned.arabicText.contains("Hifz herhaling")
                    }
                    ReviewDueRow(
                        item = item,
                        isPlanned = isPlanned,
                        onAddToAgenda = { if (!isPlanned) onAddToAgenda(item) }
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                }
            }
        }
    }
}

@Composable
fun ReviewDueRow(
    item: ReviewDueItem,
    isPlanned: Boolean,
    onAddToAgenda: () -> Unit
) {
    val rowColor = when {
        item.daysUntilReview <= 0 -> ReviewDueSurface
        item.daysUntilReview <= 2 -> ReviewSoonSurface
        else -> ReviewLaterSurface
    }
    val label = when {
        item.daysUntilReview < 0 -> "${-item.daysUntilReview} dagen te laat"
        item.daysUntilReview == 0 -> "vandaag"
        item.daysUntilReview == 1 -> "morgen"
        else -> "over ${item.daysUntilReview} dagen"
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.smallControl))
            .background(rowColor)
            .border(1.dp, if (item.score > 0) hifzScoreBorder(item.score) else BorderNavy, RoundedCornerShape(AppShape.smallControl))
            .padding(horizontal = 10.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(item.name, fontSize = 12.sp, color = SoftTextGold, fontWeight = FontWeight.Medium)
            Text("${item.typeLabel} · score ${item.score}/100", fontSize = 10.sp, color = MutedGold)
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(label, fontSize = 11.sp, color = if (item.daysUntilReview <= 0) DeleteRed else Gold, fontWeight = FontWeight.Bold)
            Button(
                onClick = onAddToAgenda,
                enabled = !isPlanned,
                modifier = Modifier
                    .height(28.dp)
                    .padding(top = 4.dp),
                shape = RoundedCornerShape(AppShape.smallControl),
                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Gold,
                    contentColor = DarkNavy
                )
            ) {
                Text(if (isPlanned) "Gepland" else "Agenda", fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

data class HifzOverview(
    val scoredCount: Int,
    val surahCount: Int,
    val hizbCount: Int,
    val juzCount: Int,
    val averageScore: Int,
    val weakest: List<HifzScoreItem>,
    val strongest: List<HifzScoreItem>,
    val reviewItems: List<ReviewDueItem>
)

data class HifzScoreItem(
    val id: Int,
    val type: String,
    val typeLabel: String,
    val name: String,
    val arabic: String,
    val score: Int,
    val lastUpdated: Long
)

data class ReviewDueItem(
    val id: Int,
    val type: String,
    val typeLabel: String,
    val name: String,
    val score: Int,
    val daysUntilReview: Int
)

data class HifzRawScore(
    val id: Int,
    val score: Int,
    val hasScore: Boolean,
    val lastUpdated: Long
)

fun calculateHifzOverview(
    surahScores: List<HifzRawScore>,
    hizbScores: List<HifzRawScore>,
    juzScores: List<HifzRawScore>
): HifzOverview {
    val surahItems = surahScores
        .filter { it.hasScore }
        .mapNotNull { raw ->
            val surahId = raw.id
            val surah = ALL_SURAHS.find { it.id == surahId } ?: return@mapNotNull null
            HifzScoreItem(
                id = surah.id,
                type = "surah",
                typeLabel = "Soera",
                name = surah.name,
                arabic = surah.arabic,
                score = raw.score.coerceIn(0, 100),
                lastUpdated = raw.lastUpdated
            )
        }
        .distinctBy { it.id }

    val hizbItems = hizbScores
        .filter { it.hasScore }
        .map { raw ->
            val hizbId = raw.id
            HifzScoreItem(
                id = hizbId,
                type = "hizb",
                typeLabel = "Hizb",
                name = "Hizb $hizbId",
                arabic = "حزب $hizbId",
                score = raw.score.coerceIn(0, 100),
                lastUpdated = raw.lastUpdated
            )
        }
        .distinctBy { it.id }

    val directJuzScores = juzScores
        .filter { it.hasScore }
        .associateBy { it.id }
    val hizbScoreMap = hizbItems.associate { it.id to it.score }
    val hizbUpdatedMap = hizbItems.associate { it.id to it.lastUpdated }
    val juzItems = (1..30).mapNotNull { juzId ->
        val firstHizb = juzId * 2 - 1
        val secondHizb = juzId * 2
        val derivedScore = listOfNotNull(hizbScoreMap[firstHizb], hizbScoreMap[secondHizb])
            .takeIf { it.isNotEmpty() }
            ?.average()
            ?.toInt()
        val directScore = directJuzScores[juzId]
        val score = directScore?.score ?: derivedScore ?: return@mapNotNull null
        val lastUpdated = directScore?.lastUpdated
            ?: listOfNotNull(hizbUpdatedMap[firstHizb], hizbUpdatedMap[secondHizb]).maxOrNull()
            ?: System.currentTimeMillis()
        HifzScoreItem(
            id = juzId,
            type = "juz",
            typeLabel = if (directScore != null) "Juz" else "Juz gemiddeld",
            name = "Juz $juzId",
            arabic = "Juz $juzId",
            score = score.coerceIn(0, 100),
            lastUpdated = lastUpdated
        )
    }

    val items = surahItems + hizbItems + juzItems
    val average = if (items.isEmpty()) 0 else items.map { it.score }.average().toInt()
    val reviewItems = items
        .map { it.toReviewDueItem() }
        .sortedWith(compareBy<ReviewDueItem> { it.daysUntilReview }.thenBy { it.score }.thenBy { it.type }.thenBy { it.id })

    return HifzOverview(
        scoredCount = items.size,
        surahCount = surahItems.size,
        hizbCount = hizbItems.size,
        juzCount = juzItems.size,
        averageScore = average,
        weakest = items.sortedWith(compareBy<HifzScoreItem> { it.score }.thenBy { it.type }.thenBy { it.id }).take(3),
        strongest = items.sortedWith(compareByDescending<HifzScoreItem> { it.score }.thenBy { it.type }.thenBy { it.id }).take(3),
        reviewItems = reviewItems
    )
}

fun HifzScoreItem.toReviewDueItem(): ReviewDueItem {
    val intervalDays = reviewIntervalDays(score)
    val elapsedDays = ((System.currentTimeMillis() - lastUpdated) / (24L * 60 * 60 * 1000)).toInt().coerceAtLeast(0)
    return ReviewDueItem(
        id = id,
        type = type,
        typeLabel = typeLabel,
        name = name,
        score = score,
        daysUntilReview = intervalDays - elapsedDays
    )
}

fun reviewIntervalDays(score: Int): Int = when (score.coerceIn(0, 100)) {
    in 0..30 -> 1
    in 31..50 -> 2
    in 51..70 -> 4
    in 71..85 -> 7
    else -> 14
}

fun reviewDateKey(daysUntilReview: Int): String {
    val calendar = Calendar.getInstance().apply {
        add(Calendar.DAY_OF_YEAR, daysUntilReview.coerceAtLeast(0))
    }
    return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(calendar.time)
}

data class DashboardPeriodStats(
    val todayReads: Int,
    val weekReads: Int,
    val monthReads: Int,
    val activeDaysThisWeek: Int
)

fun calculatePeriodStats(history: List<ReadingHistory>): DashboardPeriodStats {
    val now = Calendar.getInstance()
    val startToday = startOfDay(now).timeInMillis
    val startWeek = startOfWeek(now).timeInMillis
    val startMonth = startOfMonth(now).timeInMillis
    val readHistory = history.filter { it.action == "read" }

    val todayReads = readHistory.count { it.timestamp >= startToday }
    val weekItems = readHistory.filter { it.timestamp >= startWeek }
    val monthReads = readHistory.count { it.timestamp >= startMonth }
    val activeDaysThisWeek = weekItems
        .map { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(it.timestamp)) }
        .distinct()
        .size

    return DashboardPeriodStats(
        todayReads = todayReads,
        weekReads = weekItems.size,
        monthReads = monthReads,
        activeDaysThisWeek = activeDaysThisWeek
    )
}

fun startOfDay(source: Calendar): Calendar =
    (source.clone() as Calendar).apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }

fun startOfWeek(source: Calendar): Calendar =
    startOfDay(source).apply {
        firstDayOfWeek = Calendar.MONDAY
        set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
    }

fun startOfMonth(source: Calendar): Calendar =
    startOfDay(source).apply {
        set(Calendar.DAY_OF_MONTH, 1)
}

data class ReadingJourneyProgress(
    val enabled: Boolean,
    val totalDays: Int,
    val doneParts: Int,
    val plannedParts: Int,
    val doneProgress: Float,
    val plannedProgress: Float,
    val percentDone: Int,
    val behindParts: Int,
    val status: JourneyStatus
)

enum class JourneyStatus {
    BEHIND,
    ON_TRACK,
    AHEAD
}

fun calculateReadingJourneyProgress(
    journey: ReadingJourney,
    rubDone: Int,
    hizbDone: Int,
    juzDone: Int,
    planningItems: List<PlanningItem>
): ReadingJourneyProgress {
    if (!journey.enabled) {
        return ReadingJourneyProgress(false, journey.totalDays, 0, 0, 0f, 0f, 0, 0, JourneyStatus.ON_TRACK)
    }
    val totalParts = 240
    val doneFromPlanning = planningItems
        .filter { it.type == "khatma" && it.isDone }
        .sumOf { item ->
            val start = item.referenceId.coerceIn(1, totalParts)
            val end = item.subId.coerceIn(start, totalParts)
            end - start + 1
        }
    val doneParts = maxOf(doneFromPlanning, rubDone, hizbDone * 4, juzDone * 8).coerceIn(0, totalParts)
    val plannedParts = plannedJourneyParts(journey).coerceIn(0, totalParts)
    val status = when {
        doneParts + 1 < plannedParts -> JourneyStatus.BEHIND
        doneParts > plannedParts -> JourneyStatus.AHEAD
        else -> JourneyStatus.ON_TRACK
    }
    return ReadingJourneyProgress(
        enabled = true,
        totalDays = journey.totalDays,
        doneParts = doneParts,
        plannedParts = plannedParts,
        doneProgress = doneParts / totalParts.toFloat(),
        plannedProgress = plannedParts / totalParts.toFloat(),
        percentDone = ((doneParts / totalParts.toFloat()) * 100).toInt(),
        behindParts = (plannedParts - doneParts).coerceAtLeast(0),
        status = status
    )
}

fun plannedJourneyParts(journey: ReadingJourney): Int {
    val start = runCatching {
        SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(journey.startDate)
    }.getOrNull() ?: Date()
    val startDay = Calendar.getInstance().apply {
        time = start
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }
    val today = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }
    val elapsedDays = (((today.timeInMillis - startDay.timeInMillis) / (24L * 60 * 60 * 1000)).toInt() + 1)
        .coerceIn(0, journey.totalDays)
    return kotlin.math.ceil(240.0 * elapsedDays / journey.totalDays.coerceAtLeast(1)).toInt()
}

fun completedHizbCountFromRub(rubStates: List<Pair<String, Boolean>>): Int =
    (1..60).count { hizb ->
        (1..4).all { rub ->
            rubStates.any { (id, isRead) -> id == "rub_${hizb}_$rub" && isRead }
        }
    }

fun completedJuzCountFromRub(rubStates: List<Pair<String, Boolean>>): Int =
    (1..30).count { juz ->
        val firstHizb = juz * 2 - 1
        val secondHizb = juz * 2
        (firstHizb..secondHizb).all { hizb ->
            (1..4).all { rub ->
                rubStates.any { (id, isRead) -> id == "rub_${hizb}_$rub" && isRead }
            }
        }
    }

@Composable
fun StatCard(modifier: Modifier, icon: String, label: String, value: Int, total: Int, color: Color) {
    Card(
        modifier = modifier,
        colors   = CardDefaults.cardColors(containerColor = MidNavy),
        shape    = RoundedCornerShape(AppShape.compactCard)
    ) {
        Column(modifier = Modifier.padding(AppSpacing.compactCard), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(icon, fontSize = 22.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text("$value", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = color)
                Text("/$total", fontSize = 12.sp, color = DimGold)
            }
            Text(label, fontSize = 11.sp, color = MutedGold)
        }
    }
}

@Composable
fun ProgressBar(label: String, done: Int, total: Int, color: Color) {
    val pct = if (total > 0) done.toFloat() / total else 0f
    Column {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, fontSize = 13.sp, color = LabelGold)
            Text("$done/$total (${(pct * 100).toInt()}%)", fontSize = 13.sp, color = color)
        }
        Spacer(modifier = Modifier.height(4.dp))
        Box(modifier = Modifier.fillMaxWidth().height(6.dp)
            .clip(RoundedCornerShape(AppShape.marker)).background(BorderNavy)) {
            Box(modifier = Modifier.fillMaxWidth(pct).fillMaxHeight()
                .clip(RoundedCornerShape(AppShape.marker)).background(color))
        }
    }
}
