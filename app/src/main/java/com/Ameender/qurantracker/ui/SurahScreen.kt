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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.Ameender.qurantracker.viewmodel.QuranViewModel

data class Surah(val id: Int, val name: String, val arabic: String, val ayahs: Int, val juz: Int)

val ALL_SURAHS = listOf(
    Surah(1,   "Al-Fatihah",    "الفاتحة",    7,   1),
    Surah(2,   "Al-Baqarah",    "البقرة",     286, 1),
    Surah(3,   "Aal-E-Imran",   "آل عمران",   200, 3),
    Surah(4,   "An-Nisa",       "النساء",     176, 4),
    Surah(5,   "Al-Ma'idah",    "المائدة",    120, 6),
    Surah(6,   "Al-An'am",      "الأنعام",    165, 7),
    Surah(7,   "Al-A'raf",      "الأعراف",    206, 8),
    Surah(8,   "Al-Anfal",      "الأنفال",    75,  9),
    Surah(9,   "At-Tawbah",     "التوبة",     129, 10),
    Surah(10,  "Yunus",         "يونس",       109, 11),
    Surah(11,  "Hud",           "هود",        123, 11),
    Surah(12,  "Yusuf",         "يوسف",       111, 12),
    Surah(13,  "Ar-Ra'd",       "الرعد",      43,  13),
    Surah(14,  "Ibrahim",       "إبراهيم",    52,  13),
    Surah(15,  "Al-Hijr",       "الحجر",      99,  14),
    Surah(16,  "An-Nahl",       "النحل",      128, 14),
    Surah(17,  "Al-Isra",       "الإسراء",    111, 15),
    Surah(18,  "Al-Kahf",       "الكهف",      110, 15),
    Surah(19,  "Maryam",        "مريم",       98,  16),
    Surah(20,  "Ta-Ha",         "طه",         135, 16),
    Surah(21,  "Al-Anbiya",     "الأنبياء",   112, 17),
    Surah(22,  "Al-Hajj",       "الحج",       78,  17),
    Surah(23,  "Al-Mu'minun",   "المؤمنون",   118, 18),
    Surah(24,  "An-Nur",        "النور",      64,  18),
    Surah(25,  "Al-Furqan",     "الفرقان",    77,  18),
    Surah(26,  "Ash-Shu'ara",   "الشعراء",    227, 19),
    Surah(27,  "An-Naml",       "النمل",      93,  19),
    Surah(28,  "Al-Qasas",      "القصص",      88,  20),
    Surah(29,  "Al-Ankabut",    "العنكبوت",   69,  20),
    Surah(30,  "Ar-Rum",        "الروم",      60,  21),
    Surah(31,  "Luqman",        "لقمان",      34,  21),
    Surah(32,  "As-Sajda",      "السجدة",     30,  21),
    Surah(33,  "Al-Ahzab",      "الأحزاب",    73,  21),
    Surah(34,  "Saba",          "سبأ",        54,  22),
    Surah(35,  "Fatir",         "فاطر",       45,  22),
    Surah(36,  "Ya-Sin",        "يس",         83,  22),
    Surah(37,  "As-Saffat",     "الصافات",    182, 23),
    Surah(38,  "Sad",           "ص",          88,  23),
    Surah(39,  "Az-Zumar",      "الزمر",      75,  23),
    Surah(40,  "Ghafir",        "غافر",       85,  24),
    Surah(41,  "Fussilat",      "فصلت",       54,  24),
    Surah(42,  "Ash-Shura",     "الشورى",     53,  25),
    Surah(43,  "Az-Zukhruf",    "الزخرف",     89,  25),
    Surah(44,  "Ad-Dukhan",     "الدخان",     59,  25),
    Surah(45,  "Al-Jathiya",    "الجاثية",    37,  25),
    Surah(46,  "Al-Ahqaf",      "الأحقاف",    35,  26),
    Surah(47,  "Muhammad",      "محمد",       38,  26),
    Surah(48,  "Al-Fath",       "الفتح",      29,  26),
    Surah(49,  "Al-Hujurat",    "الحجرات",    18,  26),
    Surah(50,  "Qaf",           "ق",          45,  26),
    Surah(51,  "Adh-Dhariyat",  "الذاريات",   60,  26),
    Surah(52,  "At-Tur",        "الطور",      49,  27),
    Surah(53,  "An-Najm",       "النجم",      62,  27),
    Surah(54,  "Al-Qamar",      "القمر",      55,  27),
    Surah(55,  "Ar-Rahman",     "الرحمن",     78,  27),
    Surah(56,  "Al-Waqi'a",     "الواقعة",    96,  27),
    Surah(57,  "Al-Hadid",      "الحديد",     29,  27),
    Surah(58,  "Al-Mujadila",   "المجادلة",   22,  28),
    Surah(59,  "Al-Hashr",      "الحشر",      24,  28),
    Surah(60,  "Al-Mumtahina",  "الممتحنة",   13,  28),
    Surah(61,  "As-Saff",       "الصف",       14,  28),
    Surah(62,  "Al-Jumu'a",     "الجمعة",     11,  28),
    Surah(63,  "Al-Munafiqun",  "المنافقون",  11,  28),
    Surah(64,  "At-Taghabun",   "التغابن",    18,  28),
    Surah(65,  "At-Talaq",      "الطلاق",     12,  28),
    Surah(66,  "At-Tahrim",     "التحريم",    12,  28),
    Surah(67,  "Al-Mulk",       "الملك",      30,  29),
    Surah(68,  "Al-Qalam",      "القلم",      52,  29),
    Surah(69,  "Al-Haqqah",     "الحاقة",     52,  29),
    Surah(70,  "Al-Ma'arij",    "المعارج",    44,  29),
    Surah(71,  "Nuh",           "نوح",        28,  29),
    Surah(72,  "Al-Jinn",       "الجن",       28,  29),
    Surah(73,  "Al-Muzzammil",  "المزمل",     20,  29),
    Surah(74,  "Al-Muddathir",  "المدثر",     56,  29),
    Surah(75,  "Al-Qiyama",     "القيامة",    40,  29),
    Surah(76,  "Al-Insan",      "الإنسان",    31,  29),
    Surah(77,  "Al-Mursalat",   "المرسلات",   50,  29),
    Surah(78,  "An-Naba",       "النبأ",      40,  30),
    Surah(79,  "An-Nazi'at",    "النازعات",   46,  30),
    Surah(80,  "Abasa",         "عبس",        42,  30),
    Surah(81,  "At-Takwir",     "التكوير",    29,  30),
    Surah(82,  "Al-Infitar",    "الانفطار",   19,  30),
    Surah(83,  "Al-Mutaffifin", "المطففين",   36,  30),
    Surah(84,  "Al-Inshiqaq",   "الانشقاق",   25,  30),
    Surah(85,  "Al-Buruj",      "البروج",     22,  30),
    Surah(86,  "At-Tariq",      "الطارق",     17,  30),
    Surah(87,  "Al-A'la",       "الأعلى",     19,  30),
    Surah(88,  "Al-Ghashiya",   "الغاشية",    26,  30),
    Surah(89,  "Al-Fajr",       "الفجر",      30,  30),
    Surah(90,  "Al-Balad",      "البلد",      20,  30),
    Surah(91,  "Ash-Shams",     "الشمس",      15,  30),
    Surah(92,  "Al-Lail",       "الليل",      21,  30),
    Surah(93,  "Ad-Duha",       "الضحى",      11,  30),
    Surah(94,  "Al-Inshirah",   "الشرح",      8,   30),
    Surah(95,  "At-Tin",        "التين",      8,   30),
    Surah(96,  "Al-Alaq",       "العلق",      19,  30),
    Surah(97,  "Al-Qadr",       "القدر",      5,   30),
    Surah(98,  "Al-Bayyina",    "البينة",     8,   30),
    Surah(99,  "Az-Zalzala",    "الزلزلة",    8,   30),
    Surah(100, "Al-Adiyat",     "العاديات",   11,  30),
    Surah(101, "Al-Qari'a",     "القارعة",    11,  30),
    Surah(102, "At-Takathur",   "التكاثر",    8,   30),
    Surah(103, "Al-Asr",        "العصر",      3,   30),
    Surah(104, "Al-Humaza",     "الهمزة",     9,   30),
    Surah(105, "Al-Fil",        "الفيل",      5,   30),
    Surah(106, "Quraish",       "قريش",       4,   30),
    Surah(107, "Al-Ma'un",      "الماعون",    7,   30),
    Surah(108, "Al-Kawthar",    "الكوثر",     3,   30),
    Surah(109, "Al-Kafirun",    "الكافرون",   6,   30),
    Surah(110, "An-Nasr",       "النصر",      3,   30),
    Surah(111, "Al-Masad",      "المسد",      5,   30),
    Surah(112, "Al-Ikhlas",     "الإخلاص",    4,   30),
    Surah(113, "Al-Falaq",      "الفلق",      5,   30),
    Surah(114, "An-Nas",        "الناس",      6,   30),
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun SurahScreen(
    viewModel: QuranViewModel,
    hifzTintEnabled: Boolean = false,
    appLanguage: String = "nl"
) {
    val text = AppText.strings(appLanguage)
    val surahProgress by viewModel.surahProgress.collectAsState()
    val progressMap = surahProgress.associate { it.referenceId to it }

    val readCount = progressMap.values.count { it.isRead }
    val memCount  = progressMap.values.count { it.isMemorized }

    // Dialog state
    var pendingSurah by remember { mutableStateOf<Surah?>(null) }
    var pendingField by remember { mutableStateOf("") }
    var scoreSurah by remember { mutableStateOf<Surah?>(null) }
    var scoreValue by remember { mutableFloatStateOf(0f) }

    if (pendingSurah != null) {
        val progress  = progressMap[pendingSurah!!.id]
        val count     = progress?.readCount ?: 0
        val isFirst   = count == 0
        val isRead    = pendingField == "read"

        AlertDialog(
            onDismissRequest = { pendingSurah = null },
            containerColor   = MidNavy,
            titleContentColor = GoldLight,
            textContentColor  = LabelGold,
            title = {
                Text(
                    if (isRead) pendingSurah!!.name
                    else "${pendingSurah!!.name} — Hifz"
                )
            },
            text = {
                Text(
                    if (isRead) {
                        if (isFirst) text.markSurahReadQuestion.format(pendingSurah!!.name)
                        else text.surahAlreadyReadQuestion.format(pendingSurah!!.name, count)
                    } else {
                        val isMem = progress?.isMemorized == true
                        if (!isMem) text.markSurahMemorizedQuestion.format(pendingSurah!!.name)
                        else text.surahAlreadyMemorizedQuestion.format(pendingSurah!!.name)
                    }
                )
            },
            confirmButton = {
                // ➕ Optellen / Markeren
                TextButton(onClick = {
                    viewModel.confirmToggleSurah(
                        pendingSurah!!.id,
                        pendingSurah!!.name,
                        pendingField,
                        false
                    )
                    pendingSurah = null
                }) {
                    Text(
                        if (isFirst || !isRead) "✅ Markeren" else "➕ Nog een keer",
                        color = Gold
                    )
                }
            },
            dismissButton = {
                Row {
                    // 🗑 Verwijderen — alleen tonen als al gemarkeerd
                    val canRemove = if (isRead) count > 0 else progress?.isMemorized == true
                    if (canRemove) {
                        TextButton(onClick = {
                            viewModel.removeSurah(
                                pendingSurah!!.id,
                                pendingSurah!!.name,
                                pendingField
                            )
                            pendingSurah = null
                        }) {
                            Text("🗑 Verwijderen", color = DeleteRed)
                        }
                    }
                    TextButton(onClick = { pendingSurah = null }) {
                        Text(text.cancel, color = MutedGold)
                    }
                }
            }
        )
    }

    if (scoreSurah != null) {
        AlertDialog(
            onDismissRequest = { scoreSurah = null },
            containerColor = MidNavy,
            titleContentColor = GoldLight,
            textContentColor = LabelGold,
            title = {
                Text("${scoreSurah!!.name} - ${text.hifzScoreLabel}")
            },
            text = {
                Column {
                    Text(
                        text.hifzScoreQuestion,
                        fontSize = 13.sp,
                        color = LabelGold
                    )
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
                    viewModel.updateSurahHifzScore(scoreSurah!!.id, scoreValue.toInt())
                    scoreSurah = null
                }) {
                    Text(text.save, color = Gold)
                }
            },
            dismissButton = {
                TextButton(onClick = { scoreSurah = null }) {
                    Text(text.cancel, color = MutedGold)
                }
            }
        )
    }

    Column(
        modifier = Modifier.fillMaxSize().background(DarkNavy)
    ) {
        Column(modifier = Modifier.padding(AppSpacing.screen)) {
            Text(text.surah, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = GoldLight)
            Text(
                "$readCount/114 gelezen  ·  $memCount/114 gememoriseerd",
                fontSize = 12.sp, color = MutedGold,
                modifier = Modifier.padding(top = 4.dp)
            )
        }

        LazyColumn(contentPadding = PaddingValues(horizontal = AppSpacing.screen, vertical = 4.dp)) {
            items(ALL_SURAHS) { surah ->
                val progress  = progressMap[surah.id]
                val isRead    = progress?.isRead ?: false
                val isMem     = progress?.isMemorized ?: false
                val rCount    = progress?.readCount ?: 0
                val hifzScore = progress?.progress ?: 0
                val hasHifzScore = progress?.hasHifzScore == true
                val showHifzTint = hifzTintEnabled && hasHifzScore && hifzScore > 0
                val cardBackground = if (showHifzTint) hifzScoreSurface(hifzScore) else MidNavy
                val cardBorder = if (showHifzTint) hifzScoreBorder(hifzScore) else BorderNavy

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 7.dp)
                        .clip(RoundedCornerShape(AppShape.tile))
                        .combinedClickable(
                            onClick = {},
                            onLongClick = {
                                if (hifzTintEnabled) {
                                    scoreSurah = surah
                                    scoreValue = hifzScore.toFloat()
                                }
                            }
                        )
                        .background(cardBackground)
                        .border(1.dp, cardBorder, RoundedCornerShape(AppShape.tile))
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Nummer cirkel
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(RoundedCornerShape(AppShape.pill))
                            .background(DeepNavy)
                            .border(1.dp, ButtonBorderNavy, RoundedCornerShape(AppShape.pill)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("${surah.id}", fontSize = 10.sp, color = Gold)
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(surah.name, fontSize = 13.sp, color = SoftTextGold)
                        Text(surah.arabic, fontSize = 13.sp, color = Gold)
                        Text(
                            "${surah.ayahs} ayah's · Juz ${surah.juz}",
                            fontSize = 10.sp, color = DimGold
                        )
                        // Teller tonen
                        if (rCount > 0) {
                            Text(
                                text.timesRead.format(rCount),
                                fontSize = 10.sp,
                                color = Gold,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        if (showHifzTint) {
                            Text(
                                "${text.hifzScoreLabel}: $hifzScore/100",
                                fontSize = 10.sp,
                                color = MutedGold
                            )
                        }
                    }

                    Column(
                        verticalArrangement = Arrangement.spacedBy(5.dp),
                        horizontalAlignment = Alignment.End
                    ) {
                        OutlinedButton(
                            onClick = { pendingSurah = surah; pendingField = "read" },
                            modifier = Modifier.height(28.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                            shape = RoundedCornerShape(AppShape.smallControl),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (isRead) StrongReadBlueSurface else Color.Transparent,
                                contentColor   = if (isRead) ReadBlue else DarkGold
                            ),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp, if (isRead) ReadBlue else ButtonBorderNavy
                            )
                        ) {
                            Text("📖 Gelezen", fontSize = 10.sp)
                        }

                        OutlinedButton(
                            onClick = { pendingSurah = surah; pendingField = "memorized" },
                            modifier = Modifier.height(28.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                            shape = RoundedCornerShape(AppShape.smallControl),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (isMem) StrongGoldSurface else Color.Transparent,
                                contentColor   = if (isMem) GoldLight else DarkGold
                            ),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp, if (isMem) Gold else ButtonBorderNavy
                            )
                        ) {
                            Text("🧠 Hifz", fontSize = 10.sp)
                        }
                    }
                }
            }
        }
    }
}
