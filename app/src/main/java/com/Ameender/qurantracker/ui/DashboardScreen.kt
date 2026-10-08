package com.Ameender.qurantracker.ui

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import com.Ameender.qurantracker.data.ReadingMetrics
import com.Ameender.qurantracker.data.ReadingStatsSummary
import com.Ameender.qurantracker.data.readingStatsSummary
import com.Ameender.qurantracker.viewmodel.GoalViewModel
import com.Ameender.qurantracker.viewmodel.PlanningViewModel
import com.Ameender.qurantracker.viewmodel.QuranViewModel
import java.util.Calendar
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlinx.coroutines.delay

@Composable
fun DashboardScreen(
    viewModel: QuranViewModel,
    goalViewModel: GoalViewModel,
    planningViewModel: PlanningViewModel,
    appLanguage: String = "nl",
    onContinueGoal: (Int) -> Unit = {},
    onOpenReadingPlan: () -> Unit = {}
) {
    val text = AppText.strings(appLanguage)
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

    val rubReadPairs = remember(rubProgress) { rubProgress.map { it.id to it.isRead } }
    val completedHizbFromRub = remember(rubReadPairs) { completedHizbCountFromRub(rubReadPairs) }
    val completedJuzFromRub = remember(rubReadPairs) { completedJuzCountFromRub(rubReadPairs) }
    val manualJuzDone = remember(juzzProgress) { juzzProgress.count { it.isRead } }
    val manualHizbDone = remember(hizbProgress) { hizbProgress.count { it.isRead } }
    val juzzDone  = maxOf(manualJuzDone, completedJuzFromRub)
    val hizbDone  = maxOf(manualHizbDone, completedHizbFromRub)
    val rubDone   = remember(rubProgress) { rubProgress.count  { it.isRead } }
    val surahMem  = remember(surahProgress) { surahProgress.count { it.isMemorized } }
    val journeyProgress = remember(readingJourney, allHistory, goal) {
        calculateReadingJourneyProgress(
            journey = readingJourney,
            rubDone = rubDone,
            hizbDone = hizbDone,
            juzDone = juzzDone,
            planningItems = planningItems,
            history = allHistory,
            forecastAvailable = goal.unit != "minutes" && goal.target > 0
        )
    }

    val progress    = if (goal.target > 0)
        (todayCount.toFloat() / goal.target).coerceIn(0f, 1f)
    else 0f
    val goalReached = todayCount >= goal.target && goal.target > 0
    val unitLabel   = localizedGoalUnitLabel(goal.unit, text)
    val periodStats = remember(allHistory) { calculatePeriodStats(allHistory) }
    val readingStats = remember(allHistory) { readingStatsSummary(allHistory) }
    val motivationPoints = remember(allHistory, goalReached, streak, text) {
        calculateMotivationPoints(allHistory, goalReached, streak, text)
    }
    val hifzOverview = remember(surahProgress, hizbProgress, juzzProgress, text, appLanguage) {
        calculateHifzOverview(
            surahScores = surahProgress.map { HifzRawScore(it.referenceId, it.progress, it.hasHifzScore, it.lastUpdated) },
            hizbScores = hizbProgress.map { HifzRawScore(it.referenceId, it.progress, it.hasHifzScore, it.lastUpdated) },
            juzScores = juzzProgress.map { HifzRawScore(it.referenceId, it.progress, it.hasHifzScore, it.lastUpdated) },
            text = text,
            language = appLanguage
        )
    }
    var quickCheckInOpen by remember { mutableStateOf(false) }
    val checkInSaving by viewModel.checkInSaving.collectAsState()
    val checkInError by viewModel.checkInError.collectAsState()
    var pointsPopup by remember { mutableStateOf<PointsPopupState?>(null) }

    if (quickCheckInOpen) {
        val requestId = androidx.compose.runtime.saveable.rememberSaveable { java.util.UUID.randomUUID().toString() }
        QuickCheckInDialog(
            language = appLanguage, saving = checkInSaving, error = checkInError,
            text = text,
            onDismiss = { quickCheckInOpen = false },
            onSave = { type, numbers, subNumber ->
                viewModel.quickCheckIn(type, numbers, subNumber, requestId) {
                val earnedPoints = numbers.sumOf { quickCheckInPoints(type, it) }
                val earnedLabel = if (numbers.size == 1) quickCheckInLabel(type, numbers.first(), subNumber, text) else text.t("quickCheck.saved")
                pointsPopup = PointsPopupState(
                points = earnedPoints,
                title = earnedLabel,
                    streakText = "${text.fireStreak}: $streak ${text.days}"
                )
                quickCheckInOpen = false
                }
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
        WirdnaBrand(Modifier.align(Alignment.CenterHorizontally).padding(top = 8.dp, bottom = 20.dp))

        TodayFocusCard(
            todayCount = todayCount,
            goalTarget = goal.target,
            unitLabel = unitLabel,
            progress = progress,
            goalReached = goalReached,
            todayItems = todayItems,
            todayDoneItems = todayDoneItems,
            onTogglePlan = planningViewModel::toggleDone,
            onQuickCheckIn = { quickCheckInOpen = true },
            text = text
        )

        ReadingPlanHomeCard(history = allHistory, language = appLanguage, onOpen = onOpenReadingPlan)
        HizbOverviewCard(language = appLanguage)
        Spacer(modifier = Modifier.height(16.dp))

        MotivationPointsCard(points = motivationPoints, text = text)

        PeriodProgressCard(
            todayReads = periodStats.todayReads,
            weekReads = periodStats.weekReads,
            monthReads = periodStats.monthReads,
            activeDaysThisWeek = periodStats.activeDaysThisWeek,
            streak = streak,
            text = text
        )

        DashboardReadingStatsCard(
            summary = readingStats,
            juzzDone = juzzDone,
            hizbDone = hizbDone,
            rubDone = rubDone,
            text = text
        )

        HifzOverviewCard(overview = hifzOverview, text = text, language = appLanguage)

        ReviewDueCard(
            items = hifzOverview.reviewItems,
            plannedItems = planningItems,
            text = text,
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
                Text(text.today, fontSize = 13.sp, color = MutedGold,
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
                    Text(text.t("home.stats.streakDays", streak),
                        fontSize = 20.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    Text(
                        when {
                            streak == 0  -> text.t("home.streak.startToday")
                            streak < 7   -> text.t("home.streak.keepGoing")
                            streak < 30  -> "Geweldige streak! 💪"
                            else         -> "MashaAllah! Ongelooflijk! 🌟"
                        },
                        fontSize = 12.sp, color = MutedGold
                    )
                }
            }
        }

        // ── Statistieken grid ──
        Text(text.t("home.stats.progress"), fontSize = 15.sp, color = Gold,
            fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 10.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatCard(Modifier.weight(1f), "📜", text.t("unit.juz"),       juzzDone,  30,  DoneGreen)
            StatCard(Modifier.weight(1f), "📿", text.t("unit.hizb"),      hizbDone,  60,  Gold)
        }
        Spacer(modifier = Modifier.height(10.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatCard(Modifier.weight(1f), "🔹", text.t("unit.rub"),       rubDone,   240, ReadBlue)
            StatCard(Modifier.weight(1f), "🧠", text.hifz,      surahMem,  114, DeleteRed)
        }

        Spacer(modifier = Modifier.height(16.dp))

        // ── Voortgangsbalken ──
        Text(text.t("home.stats.totalProgress"), fontSize = 15.sp, color = Gold,
            fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 10.dp))

        Card(
            colors = CardDefaults.cardColors(containerColor = MidNavy),
            shape  = RoundedCornerShape(AppShape.card),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(AppSpacing.card)) {
                ProgressBar(text.t("unit.rub"),       rubDone,  240, ReadBlue)
                Spacer(modifier = Modifier.height(10.dp))
                ProgressBar(text.t("unit.hizb"),      hizbDone, 60,  Gold)
                Spacer(modifier = Modifier.height(10.dp))
                ProgressBar(text.t("unit.juz"),       juzzDone, 30,  DoneGreen)
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
        Text("بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
            fontSize = 12.sp, color = DarkGold,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(20.dp))
    }

    pointsPopup?.let { popup ->
        PointsEarnedPopup(
            state = popup,
            text = text,
            onDismiss = { pointsPopup = null }
        )
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
    onQuickCheckIn: () -> Unit,
    text: AppStrings
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
                    Text(text.today, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    Text(
                        if (goalReached) text.dailyGoalReached else text.remainingToday.format((goalTarget - todayCount).coerceAtLeast(0), unitLabel),
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
                        if (goalReached) text.completed else text.dailyGoal,
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
                        modifier = Modifier.fillMaxWidth().height(AppComponentDefaults.minTouchTarget),
                        shape = RoundedCornerShape(AppShape.control),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Gold,
                            contentColor = DarkNavy
                        )
                    ) {
                        Text(text.quickCheckIn, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
            Text(
                "${text.planningToday} ${if (todayItems.isNotEmpty()) "$todayDoneItems/${todayItems.size}" else ""}",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = LabelGold
            )
            Spacer(modifier = Modifier.height(8.dp))

            if (todayItems.isEmpty()) {
                Text(
                    text.noPlanningToday,
                    fontSize = 12.sp,
                    color = MutedGold
                )
            } else {
                todayItems.take(4).forEach { item ->
                    TodayPlanRow(item = item, text = text, onToggle = { onTogglePlan(item) })
                    Spacer(modifier = Modifier.height(6.dp))
                }
                if (todayItems.size > 4) {
                    Text(
                        "+${todayItems.size - 4} ${text.moreInAgenda}",
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
fun ReadingJourneyCard(
    progress: ReadingJourneyProgress,
    text: AppStrings,
    language: String = "nl",
    onManage: () -> Unit = {},
    onRead: () -> Unit = {}
) {
    var activeProgressView by remember { mutableStateOf(ReadingJourneyProgressView.SUMMARY) }

    val statusColor = when (progress.status) {
        JourneyStatus.AHEAD -> DoneGreen
        JourneyStatus.BEHIND -> DeleteRed
        else -> Gold
    }
    val statusText = if (!progress.forecastAvailable) text.noEndGoal else when (progress.status) {
        JourneyStatus.AHEAD -> text.aheadOfSchedule
        JourneyStatus.BEHIND -> text.behindRub.format(progress.behindParts)
        JourneyStatus.ON_TRACK -> text.onSchedule
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
                    Text(text.readingJourney, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    Text(if (progress.forecastAvailable) text.wholeQuranInDays.format(progress.totalDays) else text.noEndGoal,
                        fontSize = 12.sp, color = MutedGold)
                }
                Text(
                    if (progress.enabled) "${progress.percentDone}%" else "0%",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = statusColor
                )
            }

            Spacer(modifier = Modifier.height(14.dp))
            Text(
                goalText(language,
                    "Werk toe naar één volledige Koranlezing. Je geregistreerde leesactiviteit telt mee; je dagelijkse leesdoel bepaalt de verwachte einddatum. Registreer na het lezen je voortgang via je doel of de check-in op Home.",
                    "Work towards one complete Quran reading. Your logged reading counts; your daily reading goal determines the estimated finish date. Log your progress through your goal or the Home check-in after reading.",
                    "تقدّم نحو ختم القرآن. تُحتسب القراءة المسجلة ويحدد هدفك اليومي موعد الإتمام المتوقع. سجّل تقدمك بعد القراءة عبر الهدف أو التسجيل في الصفحة الرئيسية."),
                color = MutedGold,
                fontSize = 12.sp
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = onManage) {
                    Text(goalText(language,
                        if (progress.enabled) "Leesdoel en leesreis beheren" else "Leesreis instellen",
                        if (progress.enabled) "Manage reading goal and journey" else "Set up reading journey",
                        "إعداد رحلة القراءة والهدف"))
                }
                if (progress.enabled) {
                    TextButton(onClick = onRead) {
                        Text(goalText(language, "Lezen", "Read", "اقرأ"))
                    }
                }
            }
            if (!progress.enabled) {
                Text(
                    text.noEndGoal,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(AppShape.tile))
                        .background(PeriodItemSurface)
                        .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.tile))
                        .padding(14.dp),
                    color = MutedGold,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center
                )
                return@Column
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(AppShape.tile))
                    .background(PeriodItemSurface)
                    .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.tile))
                    .clickable {
                        activeProgressView = when (activeProgressView) {
                            ReadingJourneyProgressView.SUMMARY -> ReadingJourneyProgressView.DETAILS
                            ReadingJourneyProgressView.DETAILS -> ReadingJourneyProgressView.SUMMARY
                        }
                    }
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Crossfade(
                    targetState = activeProgressView,
                    animationSpec = tween(240, easing = EaseOutCubic),
                    label = "readingJourneyCircle"
                ) { view ->
                    when (view) {
                        ReadingJourneyProgressView.SUMMARY -> JourneyProgressPie(
                            doneProgress = progress.doneProgress,
                            plannedProgress = progress.plannedProgress,
                            centerText = "${progress.percentDone}%",
                            statusColor = statusColor,
                            centerLabel = text.done,
                            text = text
                        )
                        ReadingJourneyProgressView.DETAILS -> JourneyProgressPie(
                            doneProgress = progress.plannedProgress,
                            plannedProgress = progress.doneProgress,
                            centerText = "${progress.plannedParts}/240",
                            statusColor = Gold,
                            plannedColor = statusColor.copy(alpha = 0.30f),
                            centerLabel = text.planned,
                            text = text
                        )
                    }
                }
                Column(modifier = Modifier.weight(1f)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ReadingJourneyViewChip(
                            label = text.progress,
                            selected = activeProgressView == ReadingJourneyProgressView.SUMMARY,
                            onClick = { activeProgressView = ReadingJourneyProgressView.SUMMARY }
                        )
                        ReadingJourneyViewChip(
                            label = text.planned,
                            selected = activeProgressView == ReadingJourneyProgressView.DETAILS,
                            onClick = { activeProgressView = ReadingJourneyProgressView.DETAILS }
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Crossfade(
                        targetState = activeProgressView,
                        animationSpec = tween(240, easing = EaseOutCubic),
                        label = "readingJourneyText"
                    ) { view ->
                        when (view) {
                            ReadingJourneyProgressView.SUMMARY -> JourneyProgressSummary(
                                statusText = statusText,
                                statusColor = statusColor,
                                progress = progress,
                                text = text
                            )
                            ReadingJourneyProgressView.DETAILS -> JourneyProgressDetails(
                                progress = progress,
                                text = text
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ReadingJourneyViewChip(label: String, selected: Boolean, onClick: () -> Unit) {
    Text(
        label,
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(if (selected) DoneGreen.copy(alpha = 0.18f) else DeepNavy.copy(alpha = 0.55f))
            .border(
                1.dp,
                if (selected) DoneGreen else BorderNavy,
                RoundedCornerShape(999.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 5.dp),
        color = if (selected) GoldLight else MutedGold,
        fontSize = 11.sp,
        fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
    )
}

@Composable
fun JourneyProgressSummary(
    statusText: String,
    statusColor: Color,
    progress: ReadingJourneyProgress,
    text: AppStrings
) {
    Column {
        Text(
            statusText,
            fontSize = 13.sp,
            color = statusColor,
            fontWeight = FontWeight.Bold
        )
        Text(
            text.donePartsOfRub.format(progress.doneParts),
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = GoldLight
        )
        Text(text.done, fontSize = 12.sp, color = Gold)
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text.plannedUntilToday.format(progress.plannedParts),
            fontSize = 11.sp,
            color = MutedGold
        )
        Text(
            text.journeyRingHint,
            fontSize = 10.sp,
            color = DimGold
        )
    }
}

@Composable
fun JourneyProgressDetails(progress: ReadingJourneyProgress, text: AppStrings) {
    Column {
        Text(
            text.planned,
            fontSize = 13.sp,
            color = Gold,
            fontWeight = FontWeight.Bold
        )
        Text(
            text.plannedUntilToday.format(progress.plannedParts),
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = GoldLight
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text.donePartsOfRub.format(progress.doneParts),
            fontSize = 11.sp,
            color = MutedGold
        )
        Text(
            text.journeyRingHint,
            fontSize = 10.sp,
            color = DimGold
        )
    }
}

private enum class ReadingJourneyProgressView {
    SUMMARY,
    DETAILS
}

@Composable
fun JourneyProgressPie(
    doneProgress: Float,
    plannedProgress: Float,
    centerText: String,
    statusColor: Color,
    text: AppStrings,
    centerLabel: String = text.done,
    plannedColor: Color = Gold.copy(alpha = 0.28f)
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
                color = plannedColor,
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
            Text(centerLabel, fontSize = 10.sp, color = MutedGold)
        }
    }
}

@Composable
fun TodayPlanRow(item: PlanningItem, text: AppStrings, onToggle: () -> Unit) {
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
            Text(if (item.isDone) text.completed else text.done, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

data class PointsPopupState(
    val points: Int,
    val title: String,
    val streakText: String
)

@Composable
fun PointsEarnedPopup(
    state: PointsPopupState,
    text: AppStrings,
    onDismiss: () -> Unit
) {
    LaunchedEffect(state) {
        delay(1800)
        onDismiss()
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = PeriodSurface,
        titleContentColor = GoldLight,
        textContentColor = MutedGold,
        shape = RoundedCornerShape(AppShape.card),
        title = {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text("🔥", fontSize = 28.sp)
                Text("+${state.points} ${text.points}", fontSize = 22.sp, color = GoldLight, fontWeight = FontWeight.Bold)
            }
        },
        text = {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text(state.title, fontSize = 13.sp, color = Gold, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                Spacer(modifier = Modifier.height(4.dp))
                Text(state.streakText, fontSize = 11.sp, color = MutedGold)
            }
        },
        confirmButton = {}
    )
}

@Composable
fun QuickCheckInDialog(
    text: AppStrings,
    language: String = "nl",
    saving: Boolean = false,
    error: Boolean = false,
    onDismiss: () -> Unit,
    onSave: (type: String, numbers: Set<Int>, subNumber: Int) -> Unit
) {
    var selectedHizbs by androidx.compose.runtime.saveable.rememberSaveable { mutableStateOf(emptyList<Int>()) }
    var choosingHizbs by androidx.compose.runtime.saveable.rememberSaveable { mutableStateOf(false) }
    var multipleHizbs by androidx.compose.runtime.saveable.rememberSaveable { mutableStateOf(false) }
    var selectedType by remember { mutableStateOf("surah") }
    var number by remember { mutableIntStateOf(1) }
    var subNumber by remember { mutableIntStateOf(1) }

    val maxNumber = when (selectedType) {
        "juz" -> 30
        "hizb", "rub" -> 60
        else -> 114
    }
    val title = when (selectedType) {
        "juz" -> text.t("unit.juz")
        "hizb", "rub" -> text.t("unit.hizb")
        else -> text.t("unit.surah")
    }
    val typeOptions = listOf(
        "surah" to text.t("unit.surah"),
        "juz" to text.t("unit.juz"),
        "hizb" to text.t("unit.hizb"),
        "rub" to text.t("unit.rub")
    )
    val selectedSurah = remember(selectedType, number) {
        if (selectedType == "surah") ALL_SURAHS.find { it.id == number } else null
    }
    val selectedHizb = remember(selectedType, number) {
        if (selectedType == "hizb" || selectedType == "rub") ALL_HIZB.find { it.hizbNumber == number } else null
    }

    if (choosingHizbs) {
        HizbSelectionSheet(selectedHizbs.toSet(), language,
            onChange = { selectedHizbs = it.sorted() },
            onDismiss = { choosingHizbs = false })
        return
    }

    AlertDialog(
        onDismissRequest = { if (!saving) onDismiss() },
        containerColor = MidNavy,
        titleContentColor = GoldLight,
        textContentColor = LabelGold,
        title = { Text(text.t("quickCheck.title")) },
        text = {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    typeOptions.forEach { (type, label) ->
                        val selected = selectedType == type
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .then(Modifier.quickCheckTypeTag(type))
                                .clip(RoundedCornerShape(AppShape.smallControl))
                                .background(if (selected) StrongGoldSurface else DeepNavy)
                                .border(1.dp, if (selected) Gold else BorderNavy, RoundedCornerShape(AppShape.smallControl))
                                .padding(vertical = 8.dp)
                                .clickable(enabled = !saving) {
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
                    text = text,
                    label = title,
                    value = number,
                    min = 1,
                    max = maxNumber,
                    onChange = {
                        if (!saving) {
                            number = it
                            if (selectedType == "hizb") {
                                multipleHizbs = false
                                selectedHizbs = emptyList()
                            }
                        }
                    }
                )

                if (selectedType == "hizb") {
                    Spacer(Modifier.height(8.dp))
                    HizbMultiSelect(selectedHizbs.toSet(), language, !saving) {
                        if (!multipleHizbs) selectedHizbs = listOf(number)
                        multipleHizbs = true
                        choosingHizbs = true
                    }
                }

                if (selectedType != "hizb" || !multipleHizbs) QuickCheckSelectedInfo(
                    text = text,
                    selectedType = selectedType,
                    surah = selectedSurah,
                    hizb = selectedHizb
                )

                if (selectedType == "rub") {
                    Spacer(modifier = Modifier.height(8.dp))
                    QuickCheckStepper(
                        text = text,
                        label = text.t("unit.rub"),
                        value = subNumber,
                        min = 1,
                        max = 4,
                        onChange = { subNumber = it }
                    )
                }
            }
        },
        confirmButton = {
            if (error) Text(hizbText(language, "error"), color = MaterialTheme.colorScheme.error)
            TextButton(modifier = androidx.compose.ui.Modifier.then(Modifier.quickCheckTypeTag("submit")), enabled = !saving && (selectedType != "hizb" || !multipleHizbs || selectedHizbs.isNotEmpty()), onClick = { onSave(selectedType, if (selectedType == "hizb" && multipleHizbs) selectedHizbs.toSet() else setOf(number), subNumber) }) {
                if (saving) CircularProgressIndicator(Modifier.size(18.dp))
                Text(text.t("quickCheck.saveAsRead"), color = Gold)
            }
        },
        dismissButton = {
            TextButton(enabled = !saving, onClick = onDismiss) {
                Text(text.t("common.cancel"), color = MutedGold)
            }
        }
    )
}

@Composable
fun QuickCheckSelectedInfo(
    text: AppStrings,
    selectedType: String,
    surah: Surah?,
    hizb: com.Ameender.qurantracker.data.HizbInfo?
) {
    val title = when (selectedType) {
        "surah" -> surah?.let { "${it.id}. ${it.name}" }
        "hizb", "rub" -> hizb?.let { "${text.t("unit.hizb")} ${it.hizbNumber} - ${it.surahArabic} ${it.surahNumber}:${it.ayahNumber}" }
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
    text: AppStrings,
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
                    .size(AppComponentDefaults.minTouchTarget)
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
                    .size(AppComponentDefaults.minTouchTarget)
                    .clickable { onChange((value + 1).coerceAtMost(max)) },
                contentAlignment = Alignment.Center
            ) {
                Text("+", fontSize = 16.sp, color = GoldLight)
            }
        }
        Text(text.t("hifz.range.limit", min, max), fontSize = 10.sp, color = DimGold, modifier = Modifier.padding(top = 3.dp))
    }
}

@Composable
fun PeriodProgressCard(
    todayReads: Int,
    weekReads: Int,
    monthReads: Int,
    activeDaysThisWeek: Int,
    streak: Int,
    text: AppStrings
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
                text.progress,
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
                    label = text.today,
                    value = todayReads,
                    detail = text.actions,
                    color = Gold
                )
                PeriodStatTile(
                    modifier = Modifier.weight(1f),
                    label = text.week,
                    value = weekReads,
                    detail = "$activeDaysThisWeek/7 ${text.days}",
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
                    label = text.month,
                    value = monthReads,
                    detail = text.actions,
                    color = DoneGreen
                )
                PeriodStatTile(
                    modifier = Modifier.weight(1f),
                    label = text.streak,
                    value = streak,
                    detail = text.days,
                    color = DeleteRed
                )
            }
        }
    }
}

@Composable
fun MotivationPointsCard(points: MotivationPointsStats, text: AppStrings) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp),
        colors = CardDefaults.cardColors(containerColor = PeriodSurface),
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
                    Text(text.motivationPoints, fontSize = 15.sp, color = Gold, fontWeight = FontWeight.Bold)
                    Text(text.t(points.levelKey), fontSize = 11.sp, color = MutedGold)
                }
                Text("${points.totalPoints} ${text.pointsShort}", fontSize = 22.sp, color = GoldLight, fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(10.dp))
            SimpleProgressBar(
                progress = points.levelProgress,
                activeColor = DoneGreen,
                backgroundColor = BorderNavy
            )
            Text(
                if (points.nextLevelRemaining == 0) text.newLevelReached else text.pointsToNextLevel.format(points.nextLevelRemaining),
                fontSize = 10.sp,
                color = DimGold,
                modifier = Modifier.padding(top = 5.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))
            StreakFireBar(streakDays = points.streakDays, activeDays = points.weekActiveDays, text = text)

            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                PeriodStatTile(
                    modifier = Modifier.weight(1f),
                    label = text.today,
                    value = points.todayPoints,
                    detail = text.points,
                    color = Gold
                )
                PeriodStatTile(
                    modifier = Modifier.weight(1f),
                    label = text.week,
                    value = points.weekPoints,
                    detail = text.points,
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
                    label = text.bonus,
                    value = points.bonusPoints,
                    detail = text.streakGoal,
                    color = DoneGreen
                )
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(AppShape.tile))
                        .background(PeriodItemSurface)
                        .border(1.dp, PeriodAccentSurface, RoundedCornerShape(AppShape.tile))
                        .padding(horizontal = 10.dp, vertical = 9.dp)
                ) {
                    Text(text.latest, fontSize = 10.sp, color = MutedGold)
                    Text("+${points.latestPoints} ${text.pointsShort}", fontSize = 18.sp, color = GoldLight, fontWeight = FontWeight.Bold)
                    Text(points.latestLabel, fontSize = 10.sp, color = DimGold, maxLines = 1)
                }
            }

            Text(
                text.appPointsDisclaimer,
                fontSize = 10.sp,
                color = DimGold,
                modifier = Modifier.padding(top = 8.dp)
            )
        }
    }
}

@Composable
fun DashboardReadingStatsCard(
    summary: ReadingStatsSummary,
    juzzDone: Int,
    hizbDone: Int,
    rubDone: Int,
    text: AppStrings
) {
    QuranProgressCard(title = text.t("stats.overviewTitle"), modifier = Modifier.padding(bottom = AppSpacing.xxl)) {
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
            DashboardStatTile(
                label = text.t("stats.pagesRead"),
                value = summary.pageEquivalent.toString(),
                detail = text.t("stats.ayahEquivalent", summary.ayahEquivalent),
                color = ReadBlue,
                modifier = Modifier.weight(1f)
            )
            DashboardStatTile(
                label = text.points,
                value = summary.points.toString(),
                detail = text.t("stats.pointsExplain"),
                color = Gold,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(AppSpacing.xl))
        QuranProgressRow(
            label = text.juz,
            valueText = text.formatCountOfTotal(juzzDone.coerceIn(0, 30), 30),
            progress = juzzDone.coerceIn(0, 30) / 30f,
            color = DoneGreen
        )
        Spacer(modifier = Modifier.height(AppSpacing.xl))
        QuranProgressRow(
            label = text.t("unit.hizb"),
            valueText = text.formatCountOfTotal(hizbDone.coerceIn(0, 60), 60),
            progress = hizbDone.coerceIn(0, 60) / 60f,
            color = Gold
        )
        Spacer(modifier = Modifier.height(AppSpacing.xl))
        QuranProgressRow(
            label = text.t("unit.rub"),
            valueText = text.formatCountOfTotal(rubDone.coerceIn(0, 240), 240),
            progress = rubDone.coerceIn(0, 240) / 240f,
            color = ReadBlue
        )

        Spacer(modifier = Modifier.height(AppSpacing.lg))
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
private fun DashboardStatTile(
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

@Composable
fun StreakFireBar(streakDays: Int, activeDays: Int, text: AppStrings) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.control))
            .background(PeriodItemSurface)
            .border(1.dp, PeriodAccentSurface, RoundedCornerShape(AppShape.control))
            .padding(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(text.fireStreak, fontSize = 12.sp, color = Gold, fontWeight = FontWeight.Bold)
                Text("${streakDays} ${text.days}", fontSize = 11.sp, color = MutedGold)
            }
            Text("${text.week.lowercase()} $activeDays/7", fontSize = 10.sp, color = DimGold)
        }

        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            repeat(7) { index ->
                val active = index < activeDays.coerceIn(0, 7)
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(28.dp)
                        .clip(RoundedCornerShape(AppShape.smallControl))
                        .background(if (active) StrongGoldSurface else DeepNavy)
                        .border(1.dp, if (active) Gold else BorderNavy, RoundedCornerShape(AppShape.smallControl)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(if (active) "🔥" else "${index + 1}", fontSize = 11.sp, color = if (active) GoldLight else DimGold)
                }
            }
        }
    }
}

@Composable
fun SimpleProgressBar(
    progress: Float,
    activeColor: Color,
    backgroundColor: Color
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(8.dp)
            .clip(RoundedCornerShape(AppShape.marker))
            .background(backgroundColor)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(progress.coerceIn(0f, 1f))
                .fillMaxHeight()
                .clip(RoundedCornerShape(AppShape.marker))
                .background(activeColor)
        )
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
fun HifzOverviewCard(overview: HifzOverview, text: AppStrings, language: String = "nl") {
    var scoreType by remember { mutableStateOf("surah") }
    val browseScores = when (scoreType) {
        "surah" -> overview.surahScores
        "hizb" -> overview.hizbScores
        else -> overview.juzScores
    }
    val assessed = browseScores.mapNotNull { it.score }
    val average = if (assessed.isEmpty()) 0 else (assessed.average() + 0.5).toInt()
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
                Column(Modifier.weight(1f)) {
                    Text(text.hifzOverview, fontSize = 15.sp, color = Gold, fontWeight = FontWeight.Bold)
                    Text(
                        text.t("hifz.assessed", assessed.size, browseScores.size),
                        fontSize = 11.sp,
                        color = MutedGold
                    )
                }
                Text(
                    if (assessed.isEmpty()) "—" else "$average/100",
                    fontSize = 22.sp,
                    color = if (assessed.isNotEmpty()) hifzScoreBorder(average) else MutedGold,
                    fontWeight = FontWeight.Bold
                )
            }

            Text(text.t("hifz.independent"), fontSize = 11.sp, color = MutedGold,
                modifier = Modifier.padding(top = 8.dp))
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
                        .fillMaxWidth((average / 100f).coerceIn(0f, 1f))
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(AppShape.bar))
                        .background(if (assessed.isNotEmpty()) hifzScoreBorder(average) else BorderNavy)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text.hifzScoreLabel,
                fontSize = 12.sp,
                color = LabelGold,
                fontWeight = FontWeight.Bold
            )
            Row(
                modifier = Modifier.padding(top = 6.dp, bottom = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("surah", "hizb", "juz").forEach { type ->
                    FilterChip(selected = scoreType == type, onClick = { scoreType = type },
                        label = { Text(text.t("unit.$type")) })
                }
            }
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(end = 8.dp)
            ) {
                items(
                    items = browseScores,
                    key = { "${scoreType}_${it.number}" }
                ) { item ->
                    HifzBrowseScoreTile(
                        item = item,
                        unit = text.t("unit.$scoreType"),
                        derivedLabel = text.t("home.hifz.derived"),
                        name = if (scoreType == "surah") ALL_SURAHS.find { it.id == item.number }?.let {
                            if (language == "ar") it.arabic else it.name
                        } else null
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (assessed.isEmpty()) {
                Text(
                    text.noHifzScores,
                    fontSize = 12.sp,
                    color = MutedGold
                )
            } else {
                HifzRecommendationSection(
                    title = text.reviewFirst,
                    items = overview.allScores.filter { it.type == scoreType }.sortedBy { it.score }.take(3),
                    emptyText = text.noLowScores
                )
                Spacer(modifier = Modifier.height(10.dp))
                HifzRecommendationSection(
                    title = text.strong,
                    items = overview.allScores.filter { it.type == scoreType }.sortedByDescending { it.score }.take(3),
                    emptyText = text.noStrongScores
                )
            }
            overview.inconsistentJuz.forEach { juz ->
                Text(text.t("hifz.consistency", juz, juz * 2 - 1, juz * 2),
                    fontSize = 11.sp, color = MutedGold, modifier = Modifier.padding(top = 10.dp))
            }
        }
    }
}

@Composable
private fun HifzBrowseScoreTile(item: HifzBrowseScore, unit: String, derivedLabel: String, name: String? = null) {
    val score = item.score
    Column(
        modifier = Modifier
            .width(88.dp)
            .clip(RoundedCornerShape(AppShape.smallControl))
            .background(score?.let(::hifzScoreSurface) ?: HifzDashboardItem)
            .border(
                1.dp,
                score?.let(::hifzScoreBorder) ?: BorderNavy,
                RoundedCornerShape(AppShape.smallControl)
            )
            .padding(horizontal = 8.dp, vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("$unit ${item.number}", fontSize = 11.sp, color = MutedGold, maxLines = 1)
        if (name != null) Text(name, fontSize = 10.sp, color = MutedGold, maxLines = 2)
        Text(
            score?.let { "$it%" } ?: "—",
            fontSize = 16.sp,
            color = score?.let(::hifzScoreBorder) ?: DimGold,
            fontWeight = FontWeight.Bold
        )
        if (item.derived) {
            Text(derivedLabel, fontSize = 9.sp, color = DimGold, maxLines = 1)
        } else {
            Spacer(modifier = Modifier.height(11.dp))
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
                hifzScoreBorder(item.score),
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
            color = hifzScoreBorder(item.score),
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun ReviewDueCard(
    items: List<ReviewDueItem>,
    plannedItems: List<PlanningItem>,
    text: AppStrings,
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
            Text(text.repeatDue, fontSize = 15.sp, color = Gold, fontWeight = FontWeight.Bold)
            Text(
                text.repeatDueSubtitle,
                fontSize = 11.sp,
                color = MutedGold,
                modifier = Modifier.padding(top = 2.dp, bottom = 10.dp)
            )

            if (items.isEmpty()) {
                Text(
                    text.noRepeatAdvice,
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
                        text = text,
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
    text: AppStrings,
    onAddToAgenda: () -> Unit
) {
    val rowColor = when {
        item.daysUntilReview <= 0 -> ReviewDueSurface
        item.daysUntilReview <= 2 -> ReviewSoonSurface
        else -> ReviewLaterSurface
    }
    val label = when {
        item.daysUntilReview < 0 -> text.lateDays.format(-item.daysUntilReview)
        item.daysUntilReview == 0 -> text.today.lowercase()
        item.daysUntilReview == 1 -> text.tomorrow
        else -> text.inDays.format(item.daysUntilReview)
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.smallControl))
            .background(rowColor)
            .border(1.dp, hifzScoreBorder(item.score), RoundedCornerShape(AppShape.smallControl))
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
                Text(if (isPlanned) text.planned else text.agenda, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

data class HifzOverview(
    val surahScores: List<HifzBrowseScore>,
    val allScores: List<HifzScoreItem>,
    val inconsistentJuz: List<Int>,
    val scoredCount: Int,
    val surahCount: Int,
    val hizbCount: Int,
    val juzCount: Int,
    val averageScore: Int,
    val weakest: List<HifzScoreItem>,
    val strongest: List<HifzScoreItem>,
    val reviewItems: List<ReviewDueItem>,
    val juzScores: List<HifzBrowseScore>,
    val hizbScores: List<HifzBrowseScore>
)

data class HifzBrowseScore(
    val number: Int,
    val score: Int?,
    val derived: Boolean = false
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
    juzScores: List<HifzRawScore>,
    text: AppStrings,
    language: String = "nl"
): HifzOverview {
    val surahItems = surahScores
        .sortedByDescending { it.lastUpdated }.distinctBy { it.id }
        .filter { it.hasScore && it.score > 0 }
        .sortedByDescending { it.lastUpdated }
        .mapNotNull { raw ->
            val surahId = raw.id
            val surah = ALL_SURAHS.find { it.id == surahId } ?: return@mapNotNull null
            HifzScoreItem(
                id = surah.id,
                type = "surah",
                typeLabel = text.t("unit.surah"),
                name = if (language == "ar") surah.arabic else surah.name,
                arabic = surah.arabic,
                score = raw.score.coerceIn(0, 100),
                lastUpdated = raw.lastUpdated
            )
        }
        .distinctBy { it.id }

    val hizbItems = hizbScores
        .sortedByDescending { it.lastUpdated }.distinctBy { it.id }
        .filter { it.hasScore && it.score > 0 && it.id in 1..60 }
        .sortedByDescending { it.lastUpdated }
        .map { raw ->
            val hizbId = raw.id
            HifzScoreItem(
                id = hizbId,
                type = "hizb",
                typeLabel = text.t("unit.hizb"),
                name = text.t("common.hizbNumber", hizbId),
                arabic = text.t("common.hizbNumber", hizbId),
                score = raw.score.coerceIn(0, 100),
                lastUpdated = raw.lastUpdated
            )
        }
        .distinctBy { it.id }

    // Only explicit assessments count: derived Juz values would count Hizbs twice.
    val juzItems = juzScores.sortedByDescending { it.lastUpdated }.distinctBy { it.id }
        .filter { it.hasScore && it.score > 0 && it.id in 1..30 }
        .sortedByDescending { it.lastUpdated }.distinctBy { it.id }.map { raw ->
        val juzId = raw.id
        HifzScoreItem(
            id = juzId,
            type = "juz",
            typeLabel = text.t("unit.juz"),
            name = text.t("common.juzNumber", juzId),
            arabic = text.t("common.juzNumber", juzId),
            score = raw.score.coerceIn(0, 100),
            lastUpdated = raw.lastUpdated
        )
    }

    val items = surahItems + hizbItems + juzItems
    val average = if (items.isEmpty()) 0 else (items.map { it.score }.average() + 0.5).toInt()
    val reviewItems = items
        .map { it.toReviewDueItem() }
        .sortedWith(compareBy<ReviewDueItem> { it.daysUntilReview }.thenBy { it.score }.thenBy { it.type }.thenBy { it.id })
    val hizbScoreValues = hizbItems.associate { it.id to it.score }
    val explicitJuzScoreValues = juzItems.associate { it.id to it.score }
    val browseJuzScores = (1..30).map { juz ->
        val explicitScore = explicitJuzScoreValues[juz]
        HifzBrowseScore(
            number = juz,
            score = explicitScore
        )
    }
    val browseHizbScores = (1..60).map { hizb ->
        HifzBrowseScore(number = hizb, score = hizbScoreValues[hizb])
    }

    return HifzOverview(
        surahScores = (1..114).map { id -> HifzBrowseScore(id, surahItems.find { it.id == id }?.score) },
        allScores = items,
        inconsistentJuz = juzItems.filter { juz ->
            com.Ameender.qurantracker.domain.shouldConfirmJuzHifzScore(
                juz.score, hizbScoreValues[juz.id * 2 - 1], hizbScoreValues[juz.id * 2])
        }.map { it.id },
        scoredCount = items.size,
        surahCount = surahItems.size,
        hizbCount = hizbItems.size,
        juzCount = juzItems.size,
        averageScore = average,
        weakest = items.sortedWith(compareBy<HifzScoreItem> { it.score }.thenBy { it.type }.thenBy { it.id }).take(3),
        strongest = items.sortedWith(compareByDescending<HifzScoreItem> { it.score }.thenBy { it.type }.thenBy { it.id }).take(3),
        reviewItems = reviewItems,
        juzScores = browseJuzScores,
        hizbScores = browseHizbScores
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

data class MotivationPointsStats(
    val totalPoints: Int,
    val todayPoints: Int,
    val weekPoints: Int,
    val bonusPoints: Int,
    val streakDays: Int,
    val weekActiveDays: Int,
    val levelKey: String,
    val levelProgress: Float,
    val nextLevelRemaining: Int,
    val latestLabel: String,
    val latestPoints: Int
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

fun calculateMotivationPoints(
    history: List<ReadingHistory>,
    goalReached: Boolean,
    streak: Int,
    text: AppStrings
): MotivationPointsStats {
    val todayStart = startOfDay(Calendar.getInstance()).timeInMillis
    val weekStart = startOfWeek(Calendar.getInstance()).timeInMillis
    val readHistory = history.filter { it.action == "read" }
    val basePoints = readHistory.sumOf { readingMotivationPoints(it) }
    val todayBasePoints = readHistory
        .filter { it.timestamp >= todayStart }
        .sumOf { readingMotivationPoints(it) }
    val weekBasePoints = readHistory
        .filter { it.timestamp >= weekStart }
        .sumOf { readingMotivationPoints(it) }
    val bonusPoints = motivationBonusPoints(goalReached, streak)
    val totalPoints = basePoints + bonusPoints
    val level = motivationLevel(totalPoints)
    val latest = readHistory.maxByOrNull { it.timestamp }
    val latestPoints = latest?.let { readingMotivationPoints(it) } ?: 0
    val weekActiveDays = readHistory
        .filter { it.timestamp >= weekStart }
        .map { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(it.timestamp)) }
        .distinct()
        .size

    return MotivationPointsStats(
        totalPoints = totalPoints,
        todayPoints = todayBasePoints + if (goalReached) 10 else 0,
        weekPoints = weekBasePoints + bonusPoints,
        bonusPoints = bonusPoints,
        streakDays = streak,
        weekActiveDays = weekActiveDays,
        levelKey = level.key,
        levelProgress = ((totalPoints - level.start).toFloat() / (level.next - level.start).coerceAtLeast(1)).coerceIn(0f, 1f),
        nextLevelRemaining = (level.next - totalPoints).coerceAtLeast(0),
        latestLabel = latest?.let { motivationHistoryLabel(it, text) } ?: text.t("quickCheck.noCheckIn"),
        latestPoints = latestPoints
    )
}

fun readingMotivationPoints(item: ReadingHistory): Int = when (item.type) {
    "surah", "juz", "hizb", "rub", "page", "pages", "ayah", "ayahs" ->
        ReadingMetrics.historyAyahEquivalent(item).coerceAtLeast(1)
    else -> 1
}

fun motivationBonusPoints(goalReached: Boolean, streak: Int): Int {
    var bonus = if (goalReached) 10 else 0
    bonus += when {
        streak >= 30 -> 50
        streak >= 7 -> 15
        streak >= 3 -> 5
        else -> 0
    }
    return bonus
}

fun motivationHistoryLabel(item: ReadingHistory, text: AppStrings): String = when (item.type) {
    "surah" -> item.surahName
    "juz" -> text.t("common.juzNumber", item.surahId)
    "hizb" -> item.surahName.ifBlank { "${text.t("unit.rub")}/${text.t("unit.hizb")} ${item.surahId}" }
    else -> item.surahName.ifBlank { text.t("quickCheck.title") }
}

fun quickCheckInPoints(type: String, number: Int): Int = when (type) {
    "surah" -> ReadingMetrics.surahAyahCount(number).coerceAtLeast(1)
    "juz" -> ReadingMetrics.ayahsPerJuz
    "hizb" -> ReadingMetrics.ayahsPerHizb
    "rub" -> ReadingMetrics.ayahsPerRub
    else -> 1
}

fun quickCheckInLabel(type: String, number: Int, subNumber: Int, text: AppStrings): String = when (type) {
    "surah" -> text.t("quickCheck.surahRead", ALL_SURAHS.find { it.id == number }?.name ?: text.t("common.surahNumber", number))
    "juz" -> text.t("quickCheck.juzRead", number)
    "hizb" -> text.t("quickCheck.hizbRead", number)
    "rub" -> text.t("quickCheck.rubRead", number, subNumber)
    else -> text.t("quickCheck.saved")
}

fun localizedGoalUnitLabel(unit: String, text: AppStrings): String = when (unit) {
    "rub" -> text.t("unit.rub")
    "hizb" -> text.t("unit.hizb")
    "juz" -> text.t("unit.juz")
    "pages" -> text.t("planning.pages")
    "ayahs" -> text.t("unit.ayah.other")
    else -> ""
}

data class MotivationLevel(val key: String, val start: Int, val next: Int)

fun motivationLevel(points: Int): MotivationLevel = when {
    points < 100 -> MotivationLevel("home.motivation.level1", 0, 100)
    points < 250 -> MotivationLevel("home.motivation.level2", 100, 250)
    points < 500 -> MotivationLevel("home.motivation.level3", 250, 500)
    points < 1000 -> MotivationLevel("home.motivation.level4", 500, 1000)
    points < 2000 -> MotivationLevel("home.motivation.level5", 1000, 2000)
    else -> MotivationLevel("home.motivation.level6", 2000, 4000)
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
    val status: JourneyStatus,
    val forecastAvailable: Boolean = true
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
    planningItems: List<PlanningItem>,
    history: List<ReadingHistory>? = null,
    forecastAvailable: Boolean = true
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
    val doneParts = if (history != null) {
        (com.Ameender.qurantracker.data.journeyFraction(history.filter { it.dateKey >= journey.startDate }) * totalParts).toInt()
    } else maxOf(doneFromPlanning, rubDone, hizbDone * 4, juzDone * 8).coerceIn(0, totalParts)
    val actualProgress = history?.let {
        com.Ameender.qurantracker.data.journeyFraction(it.filter { entry -> entry.dateKey >= journey.startDate }).toFloat()
    } ?: (doneParts / totalParts.toFloat())
    val plannedParts = if (forecastAvailable) plannedJourneyParts(journey).coerceIn(0, totalParts) else 0
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
        doneProgress = actualProgress,
        plannedProgress = plannedParts / totalParts.toFloat(),
        percentDone = (actualProgress * 100).toInt(),
        behindParts = (plannedParts - doneParts).coerceAtLeast(0),
        status = status,
        forecastAvailable = forecastAvailable
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
