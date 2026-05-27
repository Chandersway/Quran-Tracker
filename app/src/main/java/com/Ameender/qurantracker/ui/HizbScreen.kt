package com.Ameender.qurantracker.ui

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun HizbScreen(
    viewModel: QuranViewModel,
    hifzTintEnabled: Boolean = false
) {
    val rubProgress by viewModel.rubProgress.collectAsState()
    val rubMap = rubProgress.associate { it.id to it }
    val hizbProgress by viewModel.hizbProgress.collectAsState()
    val hizbMap = hizbProgress.associate { it.referenceId to it }

    var pendingHizb by remember { mutableStateOf<Int?>(null) }
    var pendingRub by remember { mutableStateOf<Int?>(null) }
    var scoreHizb by remember { mutableStateOf<Int?>(null) }
    var scoreValue by remember { mutableFloatStateOf(0f) }

    val rubLabel = { n: Int -> when (n) { 1 -> "1/4"; 2 -> "1/2"; 3 -> "3/4"; else -> "1" } }

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
            title = { Text("Hizb $pendingHizb - ${rubLabel(pendingRub!!)}") },
            text = {
                Text(
                    if (isFirst) "Wil je Hizb $pendingHizb - ${rubLabel(pendingRub!!)} markeren als gelezen?"
                    else "Je hebt dit al ${count}x gelezen. Wat wil je doen?"
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.confirmToggleRub(pendingHizb!!, pendingRub!!, false)
                    pendingHizb = null
                    pendingRub = null
                }) {
                    Text(if (isFirst) "Markeren" else "Nog een keer", color = Gold)
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
                            Text("Verwijderen", color = DeleteRed)
                        }
                    }
                    TextButton(onClick = { pendingHizb = null; pendingRub = null }) {
                        Text("Annuleren", color = MutedGold)
                    }
                }
            }
        )
    }

    if (scoreHizb != null) {
        AlertDialog(
            onDismissRequest = { scoreHizb = null },
            containerColor = MidNavy,
            titleContentColor = GoldLight,
            textContentColor = LabelGold,
            title = { Text("Hizb $scoreHizb - Hifz-score") },
            text = {
                Column {
                    Text("Hoe goed ken je deze hizb uit je hoofd?", fontSize = 13.sp, color = LabelGold)
                    Text(
                        "${scoreValue.toInt()} / 100",
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
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.updateHizbHifzScore(scoreHizb!!, scoreValue.toInt())
                    scoreHizb = null
                }) {
                    Text("Opslaan", color = Gold)
                }
            },
            dismissButton = {
                TextButton(onClick = { scoreHizb = null }) {
                    Text("Annuleren", color = MutedGold)
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
            Text("الأحزاب", fontSize = 22.sp, color = GoldLight, fontWeight = FontWeight.Bold)
            Text("Hizb & Rub tracker", fontSize = 13.sp, color = Gold)
            Text(
                "60 hizb met elk 4 rub",
                fontSize = 11.sp,
                color = DimGold,
                modifier = Modifier.padding(top = 2.dp)
            )
        }

        LazyColumn(contentPadding = PaddingValues(horizontal = AppSpacing.screen, vertical = AppShape.tile)) {
            items((1..60).toList()) { hizbId ->
                val juzId = (hizbId + 1) / 2
                val hizbInfo = getHizbForJuz(juzId).find { it.hizbNumber == hizbId }

                val allDone = (1..4).all { rub -> rubMap["rub_${hizbId}_$rub"]?.isRead == true }
                val anyDone = (1..4).any { rub -> rubMap["rub_${hizbId}_$rub"]?.isRead == true }
                val doneRubCount = (1..4).count { rub -> rubMap["rub_${hizbId}_$rub"]?.isRead == true }
                val hifzProgress = hizbMap[hizbId]
                val hifzScore = hifzProgress?.progress ?: 0
                val hasHifzScore = hifzProgress?.hasHifzScore == true
                val showHifzTint = hifzTintEnabled && hasHifzScore && hifzScore > 0

                val borderColor = when {
                    showHifzTint -> hifzScoreBorder(hifzScore)
                    allDone -> Gold
                    anyDone -> ReadBlue
                    else -> BorderNavy
                }
                val bgColor = when {
                    showHifzTint -> hifzScoreSurface(hifzScore)
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
                            onClick = {},
                            onLongClick = {
                                if (hifzTintEnabled) {
                                    scoreHizb = hizbId
                                    scoreValue = hifzScore.toFloat()
                                }
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
                                "$doneRubCount/4 rub voltooid",
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
                        Text("Juz $juzId", fontSize = 11.sp, color = DimGold)
                    }

                    if (showHifzTint) {
                        Text(
                            "Hifz-score: $hifzScore/100",
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
                        (1..4).forEach { rub ->
                            val key = "rub_${hizbId}_$rub"
                            val progress = rubMap[key]
                            val isDone = progress?.isRead == true
                            val count = progress?.readCount ?: 0

                            OutlinedButton(
                                onClick = { pendingHizb = hizbId; pendingRub = rub },
                                modifier = Modifier
                                    .weight(1f)
                                    .height(54.dp),
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
                                        Text("${count}x", fontSize = 9.sp, color = Gold)
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
