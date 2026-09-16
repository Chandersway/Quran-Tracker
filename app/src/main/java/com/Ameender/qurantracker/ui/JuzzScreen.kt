package com.Ameender.qurantracker.ui

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.Ameender.qurantracker.data.getHizbForJuz
import com.Ameender.qurantracker.domain.shouldConfirmJuzHifzScore
import com.Ameender.qurantracker.viewmodel.QuranViewModel

data class JuzStartInfo(
    val place: String,
    val ayahStart: String
)

private val JUZ_START_INFO = mapOf(
    1 to JuzStartInfo("الفاتحة 1:1", "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ"),
    2 to JuzStartInfo("البقرة 2:142", "سَيَقُولُ السُّفَهَاءُ مِنَ النَّاسِ…"),
    3 to JuzStartInfo("البقرة 2:253", "تِلْكَ الرُّسُلُ فَضَّلْنَا بَعْضَهُمْ…"),
    4 to JuzStartInfo("آل عمران 3:93", "كُلُّ الطَّعَامِ كَانَ حِلًّا لِبَنِي إِسْرَائِيلَ…"),
    5 to JuzStartInfo("النساء 4:24", "وَالْمُحْصَنَاتُ مِنَ النِّسَاءِ…"),
    6 to JuzStartInfo("النساء 4:148", "لَا يُحِبُّ اللَّهُ الْجَهْرَ بِالسُّوءِ…"),
    7 to JuzStartInfo("المائدة 5:82", "لَتَجِدَنَّ أَشَدَّ النَّاسِ عَدَاوَةً…"),
    8 to JuzStartInfo("الأنعام 6:111", "وَلَوْ أَنَّنَا نَزَّلْنَا إِلَيْهِمُ الْمَلَائِكَةَ…"),
    9 to JuzStartInfo("الأعراف 7:88", "قَالَ الْمَلَأُ الَّذِينَ اسْتَكْبَرُوا…"),
    10 to JuzStartInfo("الأنفال 8:41", "وَاعْلَمُوا أَنَّمَا غَنِمْتُمْ مِنْ شَيْءٍ…"),
    11 to JuzStartInfo("التوبة 9:93", "إِنَّمَا السَّبِيلُ عَلَى الَّذِينَ يَسْتَأْذِنُونَكَ…"),
    12 to JuzStartInfo("هود 11:6", "وَمَا مِنْ دَابَّةٍ فِي الْأَرْضِ…"),
    13 to JuzStartInfo("يوسف 12:53", "وَمَا أُبَرِّئُ نَفْسِي…"),
    14 to JuzStartInfo("الحجر 15:1", "الر ۚ تِلْكَ آيَاتُ الْكِتَابِ وَقُرْآنٍ مُبِينٍ"),
    15 to JuzStartInfo("الإسراء 17:1", "سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ…"),
    16 to JuzStartInfo("الكهف 18:75", "قَالَ أَلَمْ أَقُلْ لَكَ…"),
    17 to JuzStartInfo("الأنبياء 21:1", "اقْتَرَبَ لِلنَّاسِ حِسَابُهُمْ…"),
    18 to JuzStartInfo("المؤمنون 23:1", "قَدْ أَفْلَحَ الْمُؤْمِنُونَ"),
    19 to JuzStartInfo("الفرقان 25:21", "وَقَالَ الَّذِينَ لَا يَرْجُونَ لِقَاءَنَا…"),
    20 to JuzStartInfo("النمل 27:56", "فَمَا كَانَ جَوَابَ قَوْمِهِ…"),
    21 to JuzStartInfo("العنكبوت 29:46", "وَلَا تُجَادِلُوا أَهْلَ الْكِتَابِ…"),
    22 to JuzStartInfo("الأحزاب 33:31", "وَمَنْ يَقْنُتْ مِنْكُنَّ لِلَّهِ وَرَسُولِهِ…"),
    23 to JuzStartInfo("يس 36:28", "وَمَا أَنْزَلْنَا عَلَىٰ قَوْمِهِ…"),
    24 to JuzStartInfo("الزمر 39:32", "فَمَنْ أَظْلَمُ مِمَّنْ كَذَبَ عَلَى اللَّهِ…"),
    25 to JuzStartInfo("فصلت 41:47", "إِلَيْهِ يُرَدُّ عِلْمُ السَّاعَةِ…"),
    26 to JuzStartInfo("الأحقاف 46:1", "حم"),
    27 to JuzStartInfo("الذاريات 51:31", "قَالَ فَمَا خَطْبُكُمْ أَيُّهَا الْمُرْسَلُونَ"),
    28 to JuzStartInfo("المجادلة 58:1", "قَدْ سَمِعَ اللَّهُ قَوْلَ الَّتِي تُجَادِلُكَ…"),
    29 to JuzStartInfo("الملك 67:1", "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ…"),
    30 to JuzStartInfo("النبأ 78:1", "عَمَّ يَتَسَاءَلُونَ")
)

private val JUZ_IDS = (1..30).toList()
private val JUZ_RUB_IDS = (1..4).toList()
private const val HIFZ_SCORE_PREFS = "hifz_score_settings"
private const val JUZ_SCORE_LEADING_KEY = "juz_score_leading"

private data class PendingJuzScoreConsistency(
    val juz: Int,
    val score: Int,
    val firstHizbScore: Int?,
    val secondHizbScore: Int?
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun JuzzScreen(
    viewModel: QuranViewModel,
    hifzTintEnabled: Boolean = false,
    appLanguage: String = "nl",
    onOpenInReader: (juzNumber: Int, surahId: Int, ayahNumber: Int) -> Unit = { _, _, _ -> },
    noteCounts: Map<Int, Int> = emptyMap(),
    onOpenNotes: (Int) -> Unit = {}
) {
    val text = AppText.strings(appLanguage)
    val context = LocalContext.current
    val hifzScorePrefs = remember(context) {
        context.getSharedPreferences(HIFZ_SCORE_PREFS, android.content.Context.MODE_PRIVATE)
    }
    val juzzProgress by viewModel.juzzProgress.collectAsState()
    val juzzMap = remember(juzzProgress) { juzzProgress.associateBy { it.referenceId } }
    val hizbProgress by viewModel.hizbProgress.collectAsState()
    val hizbScoreMap = remember(hizbProgress) {
        hizbProgress
            .filter { it.hasHifzScore && it.progress > 0 }
            .associate { it.referenceId to it.progress }
    }
    val rubProgress by viewModel.rubProgress.collectAsState()
    val rubMap = remember(rubProgress) { rubProgress.associateBy { it.id } }
    val doneRubCountByJuz = remember(rubMap) {
        JUZ_IDS.associateWith { juz ->
            val firstHizb = juz * 2 - 1
            val secondHizb = juz * 2
            (firstHizb..secondHizb).sumOf { hizb ->
                JUZ_RUB_IDS.count { rub -> rubMap["rub_${hizb}_$rub"]?.isRead == true }
            }
        }
    }
    val autoDoneJuzCount = remember(doneRubCountByJuz) { doneRubCountByJuz.count { it.value == 8 } }
    val doneCnt = remember(juzzMap, autoDoneJuzCount) { maxOf(juzzMap.values.count { it.isRead }, autoDoneJuzCount) }

    var pendingJuz by remember { mutableStateOf<Int?>(null) }
    var scoreJuz by remember { mutableStateOf<Int?>(null) }
    var scoreValue by remember { mutableFloatStateOf(0f) }
    var juzScoreLeading by remember { mutableStateOf(hifzScorePrefs.getBoolean(JUZ_SCORE_LEADING_KEY, false)) }
    var pendingScoreConsistency by remember { mutableStateOf<PendingJuzScoreConsistency?>(null) }
    var celebration by remember { mutableStateOf<ReadingCelebration?>(null) }
    val gridState = rememberLazyGridState()
    val firstOpenJuz = remember(juzzMap, doneRubCountByJuz) {
        JUZ_IDS.firstOrNull { juz ->
            val doneRubCount = doneRubCountByJuz[juz] ?: 0
            val isAutoDone = doneRubCount == 8
            val isDirectDone = juzzMap[juz]?.isRead == true
            !isDirectDone && !isAutoDone
        } ?: 30
    }

    LaunchedEffect(firstOpenJuz) {
        gridState.scrollToItem((firstOpenJuz - 1).coerceAtLeast(0))
    }

    // 3-knops dialog
    if (pendingJuz != null) {
        val count = juzzMap[pendingJuz]?.readCount ?: 0
        val isFirst = count == 0

        AlertDialog(
            onDismissRequest = { pendingJuz = null },
            containerColor   = MidNavy,
            titleContentColor = GoldLight,
            textContentColor  = LabelGold,
            title = { Text(text.t("common.juzNumber", pendingJuz ?: "")) },
            text  = {
                Text(
                    if (isFirst) text.t("tracker.juzMarkQuestion", pendingJuz ?: "")
                    else text.t("tracker.juzAlreadyReadQuestion", pendingJuz ?: "", count)
                )
            },
            confirmButton = {
                // ➕ Optellen
                TextButton(onClick = {
                    val juz = pendingJuz!!
                    viewModel.confirmToggleJuz(juz, false)
                    celebration = ReadingCelebration("Juz $juz", CelebrationLevel.Grand)
                    pendingJuz = null
                }) {
                    Text(
                        if (isFirst) text.t("common.mark") else text.t("common.markAgain"),
                        color = Gold
                    )
                }
            },
            dismissButton = {
                Row {
                    if (!isFirst) {
                        TextButton(onClick = {
                            viewModel.removeJuz(pendingJuz!!)
                            pendingJuz = null
                        }) {
                            Text(text.t("common.remove"), color = DeleteRed)
                        }
                    }
                    TextButton(onClick = { pendingJuz = null }) {
                        Text(text.t("common.cancel"), color = MutedGold)
                    }
                }
            }
        )
    }

    celebration?.let {
        ReadingCelebrationDialog(
            celebration = it,
            onDismiss = { celebration = null }
        )
    }

    if (scoreJuz != null) {
        AlertDialog(
            onDismissRequest = { scoreJuz = null },
            containerColor = MidNavy,
            titleContentColor = GoldLight,
            textContentColor = LabelGold,
            title = { Text(text.t("tracker.hifzScoreTitle", text.t("common.juzNumber", scoreJuz ?: ""))) },
            text = {
                Column {
                    Text(text.t("tracker.juzScoreQuestion"), fontSize = 13.sp, color = LabelGold)
                    Text(
                        text.t("tracker.scoreValue", scoreValue.toInt()),
                        fontSize = 22.sp,
                        color = Gold,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(top = 12.dp)
                    )
                    Slider(
                        value = scoreValue,
                        onValueChange = { scoreValue = it },
                        valueRange = 0f..100f,
                        steps = 99
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = juzScoreLeading,
                            onCheckedChange = { juzScoreLeading = it }
                        )
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .clickable { juzScoreLeading = !juzScoreLeading }
                        ) {
                            Text(text.t("tracker.juzLeadingLabel"), fontSize = 12.sp, color = LabelGold)
                            Text(text.t("tracker.juzLeadingExplanation"), fontSize = 10.sp, color = MutedGold)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    val juz = scoreJuz!!
                    val score = scoreValue.toInt()
                    val firstHizb = juz * 2 - 1
                    val secondHizb = juz * 2
                    hifzScorePrefs.edit().putBoolean(JUZ_SCORE_LEADING_KEY, juzScoreLeading).apply()
                    when {
                        score == 0 -> viewModel.updateJuzHifzScore(juz, score)
                        juzScoreLeading -> viewModel.updateJuzAndHizbHifzScores(juz, score)
                        shouldConfirmJuzHifzScore(score, hizbScoreMap[firstHizb], hizbScoreMap[secondHizb]) -> {
                            pendingScoreConsistency = PendingJuzScoreConsistency(
                                juz = juz,
                                score = score,
                                firstHizbScore = hizbScoreMap[firstHizb],
                                secondHizbScore = hizbScoreMap[secondHizb]
                            )
                        }
                        else -> viewModel.updateJuzHifzScore(juz, score)
                    }
                    scoreJuz = null
                }) {
                    Text(text.t("common.save"), color = Gold)
                }
            },
            dismissButton = {
                TextButton(onClick = { scoreJuz = null }) {
                    Text(text.t("common.cancel"), color = MutedGold)
                }
            }
        )
    }

    pendingScoreConsistency?.let { pending ->
        val firstHizb = pending.juz * 2 - 1
        val secondHizb = pending.juz * 2
        val firstScore = pending.firstHizbScore?.takeIf { it > 0 }?.let { "$it%" }
            ?: text.t("tracker.notAssessed")
        val secondScore = pending.secondHizbScore?.takeIf { it > 0 }?.let { "$it%" }
            ?: text.t("tracker.notAssessed")
        AlertDialog(
            onDismissRequest = { pendingScoreConsistency = null },
            containerColor = MidNavy,
            titleContentColor = GoldLight,
            textContentColor = LabelGold,
            title = { Text(text.t("tracker.juzConsistencyTitle")) },
            text = {
                Text(
                    text.t(
                        "tracker.juzConsistencyBody",
                        pending.juz,
                        pending.score,
                        firstHizb,
                        firstScore,
                        secondHizb,
                        secondScore
                    ),
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.updateJuzAndHizbHifzScores(pending.juz, pending.score)
                    pendingScoreConsistency = null
                }) {
                    Text(text.t("tracker.updateJuzAndHizb"), color = Gold)
                }
            },
            dismissButton = {
                Row {
                    TextButton(onClick = {
                        viewModel.updateJuzHifzScore(pending.juz, pending.score)
                        pendingScoreConsistency = null
                    }) {
                        Text(text.t("tracker.saveJuzOnly"), color = LabelGold)
                    }
                    TextButton(onClick = { pendingScoreConsistency = null }) {
                        Text(text.t("common.cancel"), color = MutedGold)
                    }
                }
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkNavy)
            .padding(AppSpacing.screen)
    ) {
        Text(text.t("tracker.juzTitle"), fontSize = 18.sp, fontWeight = FontWeight.Bold, color = GoldLight)
        Text(
            text.t("tracker.juzCompleted", doneCnt),
            fontSize = 13.sp,
            color = MutedGold,
            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
        )

        LazyVerticalGrid(
            state = gridState,
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(JUZ_IDS, key = { it }) { juzId ->
                val progress  = juzzMap[juzId]
                val firstHizb = juzId * 2 - 1
                val secondHizb = juzId * 2
                val doneRubCount = doneRubCountByJuz[juzId] ?: 0
                val isAutoDone = doneRubCount == 8
                val isDone    = progress?.isRead == true || isAutoDone
                val readCount = progress?.readCount ?: 0
                val derivedHifzScore = com.Ameender.qurantracker.domain.derivedJuzHifzScore(
                    hizbScoreMap[firstHizb], hizbScoreMap[secondHizb])
                val hasDirectHifzScore = progress?.hasHifzScore == true && (progress.progress > 0)
                val hasDerivedHifzScore = derivedHifzScore != null
                val hifzScore = (if (hasDirectHifzScore) progress?.progress ?: 0 else derivedHifzScore ?: 0).coerceIn(0, 100)
                val hasHifzScore = hasDirectHifzScore || hasDerivedHifzScore
                val showHifzTint = hifzTintEnabled && hasHifzScore
                val startInfo = JUZ_START_INFO[juzId]
                val startHizb = getHizbForJuz(juzId).firstOrNull()
                val cardBackground = when {
                    showHifzTint -> hifzScoreSurface(hifzScore)
                    isDone -> Gold.copy(alpha = 0.25f)
                    else -> MidNavy
                }
                val cardBorder = when {
                    showHifzTint -> hifzScoreBorder(hifzScore)
                    isDone -> Gold
                    else -> BorderNavy
                }

                Box(
                    modifier = Modifier
                        .height(148.dp)
                        .clip(RoundedCornerShape(AppShape.tile))
                        .background(cardBackground)
                        .border(1.dp, cardBorder, RoundedCornerShape(AppShape.tile))
                        .combinedClickable(
                            onClick = {
                                startHizb?.let { onOpenInReader(juzId, it.surahNumber, it.ayahNumber) }
                            },
                            onLongClick = {
                                    scoreJuz = juzId
                                    scoreValue = hifzScore.toFloat()
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 9.dp)
                    ) {
                        TextButton(onClick = { pendingJuz = juzId }, contentPadding = PaddingValues(0.dp), modifier = Modifier.height(32.dp)) {
                            Text(if (isDone) "✓" else "○", fontSize = 20.sp, color = Gold)
                        }
                        Text(
                            text.t("common.juzNumber", juzId),
                            fontSize = 11.sp,
                            color = if (isDone) GoldLight else DarkGold,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                        if (startInfo != null) {
                            Text(
                                startInfo.place,
                                fontSize = 11.sp,
                                color = Gold,
                                fontWeight = FontWeight.Medium,
                                textAlign = TextAlign.Center,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.fillMaxWidth().padding(top = 4.dp)
                            )
                            Text(
                                startInfo.ayahStart,
                                fontSize = 12.sp,
                                color = if (isDone) GoldLight else SoftTextGold,
                                textAlign = TextAlign.Center,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.fillMaxWidth().padding(top = 4.dp)
                            )
                        }
                        // Teller tonen
                        if (readCount > 0) {
                            Text(
                                text.t("tracker.timesCount", readCount),
                                fontSize = 10.sp,
                                color = Gold,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Text(
                            text.t("tracker.juzRubCount", doneRubCount),
                            fontSize = 10.sp,
                            color = if (isAutoDone) Gold else MutedGold
                        )
                        if (hasHifzScore) {
                            Text(
                                if (hasDirectHifzScore) text.t("tracker.scoreValue", hifzScore)
                                else text.t("home.hifz.juzAverage") + ": $hifzScore/100",
                                fontSize = 10.sp,
                                color = MutedGold,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    Box(Modifier.align(Alignment.TopEnd)) {
                        NoteCountButton(noteCounts[juzId] ?: 0, "Notities · Juz $juzId") { onOpenNotes(juzId) }
                    }
                }
            }
        }
    }
}
