package com.Ameender.qurantracker.ui

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.Ameender.qurantracker.data.getHizbForJuz
import com.Ameender.qurantracker.viewmodel.QuranViewModel

private val HIZB_IDS = (1..60).toList()
private val RUB_IDS = (1..4).toList()

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun HizbScreen(
    viewModel: QuranViewModel,
    hifzTintEnabled: Boolean = false,
    appLanguage: String = "nl",
    mushafMode: String = "hafs",
    onOpenRubInReader: (hizbNumber: Int, quarter: Int, surahId: Int, ayahNumber: Int) -> Unit = { _, _, _, _ -> },
    onOpenInReader: (hizbNumber: Int, surahId: Int, ayahNumber: Int) -> Unit = { _, _, _ -> },
    noteCounts: Map<Int, Int> = emptyMap(),
    onOpenNotes: (Int) -> Unit = {}
) {
    val text = AppText.strings(appLanguage)
    val rubProgress by viewModel.rubProgress.collectAsState()
    val rubMap = remember(rubProgress) { rubProgress.associateBy { it.id } }
    val hizbProgress by viewModel.hizbProgress.collectAsState()
    val hizbMap = remember(hizbProgress) { hizbProgress.associateBy { it.referenceId } }
    val hizbStartInfo = remember { HIZB_IDS.associateWith { hizbId -> getHizbForJuz((hizbId + 1) / 2).find { it.hizbNumber == hizbId } } }

    var pendingHizb by remember { mutableStateOf<Int?>(null) }
    var pendingRub by remember { mutableStateOf<Int?>(null) }
    var scoreHizb by remember { mutableStateOf<Int?>(null) }
    var scoreValue by remember { mutableFloatStateOf(0f) }
    var celebration by remember { mutableStateOf<ReadingCelebration?>(null) }
    val listState = rememberLazyListState()

    val rubLabel = remember { { n: Int -> when (n) { 1 -> "1/4"; 2 -> "1/2"; 3 -> "3/4"; else -> "1" } } }
    val firstOpenHizb = remember(rubMap) {
        HIZB_IDS.firstOrNull { hizb ->
            RUB_IDS.any { rub -> rubMap["rub_${hizb}_$rub"]?.isRead != true }
        } ?: 60
    }

    LaunchedEffect(firstOpenHizb) {
        listState.scrollToItem((firstOpenHizb - 1).coerceAtLeast(0))
    }

    if (pendingHizb != null && pendingRub != null) {
        val key = "rub_${pendingHizb}_${pendingRub}"
        val progress = rubMap[key]
        val count = progress?.readCount ?: 0
        val isFirst = count == 0

        AlertDialog(
            onDismissRequest = { pendingHizb = null; pendingRub = null },
            containerColor = MidNavy,
            titleContentColor = GoldLight,
            textContentColor = LabelGold,
            title = { Text(text.t("tracker.hizbRubTitle", pendingHizb ?: "", rubLabel(pendingRub!!))) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    RubReaderAction(pendingHizb!!, pendingRub!!, mushafMode, text) { target ->
                        pendingHizb = null
                        pendingRub = null
                        onOpenRubInReader(target.hizb, target.quarter, target.surah, target.ayah)
                    }
                Text(
                    if (isFirst) text.t("tracker.hizbMarkQuestion", pendingHizb ?: "", rubLabel(pendingRub!!))
                    else text.t("tracker.hizbAlreadyReadQuestion", count)
                )
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    val hizb = pendingHizb!!
                    val rub = pendingRub!!
                    viewModel.confirmToggleRub(hizb, rub, false)
                    celebration = ReadingCelebration(
                        "Hizb $hizb - ${rubLabel(rub)}",
                        CelebrationLevel.Soft
                    )
                    pendingHizb = null
                    pendingRub = null
                }) {
                    Text(if (isFirst) text.t("common.mark") else text.t("common.markAgain"), color = Gold)
                }
            },
            dismissButton = {
                Row {
                    if (!isFirst) {
                        TextButton(onClick = {
                            viewModel.removeRub(pendingHizb!!, pendingRub!!)
                            pendingHizb = null
                            pendingRub = null
                        }) {
                            Text(text.t("common.remove"), color = DeleteRed)
                        }
                    }
                    TextButton(onClick = { pendingHizb = null; pendingRub = null }) {
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

    if (scoreHizb != null) {
        AlertDialog(
            onDismissRequest = { scoreHizb = null },
            containerColor = MidNavy,
            titleContentColor = GoldLight,
            textContentColor = LabelGold,
            title = { Text(text.t("tracker.hifzScoreTitle", "Hizb $scoreHizb")) },
            text = {
                Column {
                    Text(text.t("tracker.hizbScoreQuestion"), fontSize = 13.sp, color = LabelGold)
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
                    Text(text.t("hifz.independent"), fontSize = 12.sp, color = MutedGold)
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.updateHizbHifzScore(scoreHizb!!, scoreValue.toInt())
                    scoreHizb = null
                }) {
                    Text(text.t("common.save"), color = Gold)
                }
            },
            dismissButton = {
                Column {
                    TextButton(onClick = {
                        viewModel.updateHizbHifzScore(scoreHizb!!, 0)
                        scoreHizb = null
                    }) { Text(text.t("hifz.clear"), color = DeleteRed) }
                    TextButton(onClick = { scoreHizb = null }) {
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
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(MidNavy)
                .padding(AppSpacing.screen)
        ) {
            Text(text.t("tracker.hizbTitleArabic"), fontSize = 22.sp, color = GoldLight, fontWeight = FontWeight.Bold)
            Text(text.t("tracker.hizbSubtitle"), fontSize = 13.sp, color = Gold)
            Text(
                text.t("tracker.hizbDescription"),
                fontSize = 11.sp,
                color = DimGold,
                modifier = Modifier.padding(top = 2.dp)
            )
        }

        LazyColumn(
            state = listState,
            contentPadding = PaddingValues(horizontal = AppSpacing.screen, vertical = AppShape.tile)
        ) {
            items(HIZB_IDS, key = { it }) { hizbId ->
                val juzId = (hizbId + 1) / 2
                val hizbInfo = hizbStartInfo[hizbId]

                val allDone = RUB_IDS.all { rub -> rubMap["rub_${hizbId}_$rub"]?.isRead == true }
                val anyDone = RUB_IDS.any { rub -> rubMap["rub_${hizbId}_$rub"]?.isRead == true }
                val doneRubCount = RUB_IDS.count { rub -> rubMap["rub_${hizbId}_$rub"]?.isRead == true }
                val hifzProgress = hizbMap[hizbId]
                val hifzScore = hifzProgress?.progress ?: 0
                val hasHifzScore = hifzProgress?.hasHifzScore == true && hifzScore > 0
                val showHifzTint = hifzTintEnabled && hasHifzScore

                val borderColor = when {
                    showHifzTint -> hifzScoreBorder(hifzScore)
                    hifzTintEnabled -> BorderNavy
                    allDone -> Gold
                    anyDone -> ReadBlue
                    else -> BorderNavy
                }
                val bgColor = when {
                    showHifzTint -> hifzScoreSurface(hifzScore)
                    hifzTintEnabled -> MidNavy
                    allDone -> Gold.copy(alpha = 0.15f)
                    anyDone -> ReadBlueSurface
                    else -> MidNavy
                }
                val titleColor = when {
                    allDone -> Gold
                    anyDone -> SoftReadBlue
                    else -> LabelGold
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = AppSpacing.itemVertical)
                        .clip(RoundedCornerShape(AppShape.tile))
                        .combinedClickable(
                            onClick = {
                                hizbInfo?.let {
                                    onOpenInReader(hizbId, it.surahNumber, it.ayahNumber)
                                }
                            },
                            onLongClick = {
                                    scoreHizb = hizbId
                                    scoreValue = hifzScore.toFloat()
                            }
                        )
                        .background(bgColor)
                        .border(1.dp, borderColor, RoundedCornerShape(AppShape.tile))
                        .padding(AppSpacing.list)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                "حزب $hizbId ${if (allDone) "✓" else ""}",
                                fontSize = 15.sp,
                                color = titleColor,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text.t("tracker.hizbCompletedRub", doneRubCount),
                                fontSize = 11.sp,
                                color = if (allDone) Gold else MutedGold,
                                modifier = Modifier.padding(top = 2.dp)
                            )

                            if (hizbInfo != null) {
                                Text(
                                    "${hizbInfo.surahArabic} ${hizbInfo.surahNumber}:${hizbInfo.ayahNumber}",
                                    fontSize = 12.sp,
                                    color = Gold.copy(alpha = 0.7f),
                                    modifier = Modifier.padding(top = 2.dp)
                                )
                                Text(
                                    hizbInfo.startText,
                                    fontSize = 13.sp,
                                    color = SoftTextGold,
                                    textAlign = TextAlign.End,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(top = 4.dp)
                                )
                            }
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            NoteCountButton(noteCounts[hizbId] ?: 0, "Notities · Hizb $hizbId") { onOpenNotes(hizbId) }
                            Text(text.t("common.juzNumber", juzId), fontSize = 11.sp, color = DimGold)
                        }
                    }

                    if (hasHifzScore) {
                        Text(
                            text.t("tracker.hizbScoreValue", hifzScore),
                            fontSize = 10.sp,
                            color = MutedGold,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(AppShape.control))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        RUB_IDS.forEach { rub ->
                            val key = "rub_${hizbId}_$rub"
                            val progress = rubMap[key]
                            val isDone = progress?.isRead == true
                            val count = progress?.readCount ?: 0

                            OutlinedButton(
                                onClick = { pendingHizb = hizbId; pendingRub = rub },
                                modifier = Modifier
                                    .weight(1f)
                                    .heightIn(min = 64.dp),
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 8.dp),
                                shape = RoundedCornerShape(AppShape.control),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (isDone) StrongGoldSurface else Color.Transparent,
                                    contentColor = if (isDone) GoldLight else DarkGold
                                ),
                                border = androidx.compose.foundation.BorderStroke(
                                    1.dp,
                                    if (isDone) Gold else ButtonBorderNavy
                                )
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(if (isDone) "✓" else "·", fontSize = 14.sp)
                                    Text(rubLabel(rub), fontSize = 11.sp)
                                    if (count > 0) {
                                        Text(text.t("tracker.timesCount", count), fontSize = 9.sp, color = Gold)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
