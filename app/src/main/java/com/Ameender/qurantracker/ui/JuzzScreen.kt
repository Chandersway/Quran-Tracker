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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun JuzzScreen(
    viewModel: QuranViewModel,
    hifzTintEnabled: Boolean = false
) {
    val juzzProgress by viewModel.juzzProgress.collectAsState()
    val juzzMap = juzzProgress.associate { it.referenceId to it }
    val hizbProgress by viewModel.hizbProgress.collectAsState()
    val hizbScoreMap = hizbProgress
        .filter { it.hasHifzScore }
        .associate { it.referenceId to it.progress }
    val rubProgress by viewModel.rubProgress.collectAsState()
    val rubMap = rubProgress.associate { it.id to it }
    val autoDoneJuzCount = (1..30).count { juz ->
        val firstHizb = juz * 2 - 1
        val secondHizb = juz * 2
        (firstHizb..secondHizb).all { hizb ->
            (1..4).all { rub -> rubMap["rub_${hizb}_$rub"]?.isRead == true }
        }
    }
    val doneCnt = maxOf(juzzMap.values.count { it.isRead }, autoDoneJuzCount)

    var pendingJuz by remember { mutableStateOf<Int?>(null) }
    var scoreJuz by remember { mutableStateOf<Int?>(null) }
    var scoreValue by remember { mutableFloatStateOf(0f) }

    // 3-knops dialog
    if (pendingJuz != null) {
        val count = juzzMap[pendingJuz]?.readCount ?: 0
        val isFirst = count == 0

        AlertDialog(
            onDismissRequest = { pendingJuz = null },
            containerColor   = MidNavy,
            titleContentColor = GoldLight,
            textContentColor  = LabelGold,
            title = { Text("Juz $pendingJuz") },
            text  = {
                Text(
                    if (isFirst) "Wil je Juz $pendingJuz markeren als gelezen?"
                    else "Je hebt Juz $pendingJuz al ${count}x gelezen. Wat wil je doen?"
                )
            },
            confirmButton = {
                // ➕ Optellen
                TextButton(onClick = {
                    viewModel.confirmToggleJuz(pendingJuz!!, false)
                    pendingJuz = null
                }) {
                    Text(
                        if (isFirst) "✅ Markeren" else "➕ Nog een keer",
                        color = Gold
                    )
                }
            },
            dismissButton = {
                Row {
                    // 🗑 Verwijderen (alleen tonen als al gelezen)
                    if (!isFirst) {
                        TextButton(onClick = {
                            viewModel.removeJuz(pendingJuz!!)
                            pendingJuz = null
                        }) {
                            Text("🗑 Verwijderen", color = DeleteRed)
                        }
                    }
                    // Annuleren
                    TextButton(onClick = { pendingJuz = null }) {
                        Text("Annuleren", color = MutedGold)
                    }
                }
            }
        )
    }

    if (scoreJuz != null) {
        AlertDialog(
            onDismissRequest = { scoreJuz = null },
            containerColor = MidNavy,
            titleContentColor = GoldLight,
            textContentColor = LabelGold,
            title = { Text("Juz $scoreJuz - Hifz-score") },
            text = {
                Column {
                    Text("Hoe goed ken je deze Juz uit je hoofd?", fontSize = 13.sp, color = LabelGold)
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
                    viewModel.updateJuzHifzScore(scoreJuz!!, scoreValue.toInt())
                    scoreJuz = null
                }) {
                    Text("Opslaan", color = Gold)
                }
            },
            dismissButton = {
                TextButton(onClick = { scoreJuz = null }) {
                    Text("Annuleren", color = MutedGold)
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
        Text("Juz tracker", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = GoldLight)
        Text(
            "$doneCnt/30 Juz voltooid",
            fontSize = 13.sp,
            color = MutedGold,
            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
        )

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items((1..30).toList()) { juzId ->
                val progress  = juzzMap[juzId]
                val firstHizb = juzId * 2 - 1
                val secondHizb = juzId * 2
                val doneRubCount = (firstHizb..secondHizb).sumOf { hizb ->
                    (1..4).count { rub -> rubMap["rub_${hizb}_$rub"]?.isRead == true }
                }
                val isAutoDone = doneRubCount == 8
                val isDone    = progress?.isRead == true || isAutoDone
                val readCount = progress?.readCount ?: 0
                val derivedHifzScore = listOfNotNull(
                    hizbScoreMap[firstHizb],
                    hizbScoreMap[secondHizb]
                ).takeIf { it.isNotEmpty() }?.average()?.toInt() ?: 0
                val hasDirectHifzScore = progress?.hasHifzScore == true
                val hasDerivedHifzScore = hizbScoreMap.containsKey(firstHizb) || hizbScoreMap.containsKey(secondHizb)
                val hifzScore = if (hasDirectHifzScore) progress?.progress ?: 0 else derivedHifzScore
                val hasHifzScore = hasDirectHifzScore || hasDerivedHifzScore
                val showHifzTint = hifzTintEnabled && hasHifzScore && hifzScore > 0
                val startInfo = JUZ_START_INFO[juzId]
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
                        .height(132.dp)
                        .clip(RoundedCornerShape(AppShape.tile))
                        .background(cardBackground)
                        .border(1.dp, cardBorder, RoundedCornerShape(AppShape.tile))
                        .combinedClickable(
                            onClick = { pendingJuz = juzId },
                            onLongClick = {
                                if (hifzTintEnabled) {
                                    scoreJuz = juzId
                                    scoreValue = hifzScore.toFloat()
                                }
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.padding(AppSpacing.list)
                    ) {
                        Text(if (isDone) "✅" else "📄", fontSize = 20.sp)
                        Text(
                            "Juz $juzId",
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
                                "${readCount}x",
                                fontSize = 10.sp,
                                color = Gold,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Text(
                            "$doneRubCount/8 rub",
                            fontSize = 10.sp,
                            color = if (isAutoDone) Gold else MutedGold
                        )
                        if (showHifzTint) {
                            Text(
                                "$hifzScore/100",
                                fontSize = 10.sp,
                                color = MutedGold,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}
