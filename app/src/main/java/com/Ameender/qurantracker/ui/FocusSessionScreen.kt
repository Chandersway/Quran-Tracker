package com.Ameender.qurantracker.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoStories
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.RestartAlt
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class FocusGoal(val key: String, val label: String, val subtitle: String)

data class FocusStrings(
    val title: String,
    val subtitle: String,
    val menuTitle: String,
    val menuSubtitle: String,
    val question: String,
    val duration: String,
    val custom: String,
    val customPlaceholder: String,
    val minutesShort: String,
    val start: String,
    val pause: String,
    val reset: String,
    val mushaf: String,
    val finishedTitle: String,
    val finishedSubtitle: String,
    val goals: List<FocusGoal>,
    val motivations: List<String>
)

fun focusStrings(language: String): FocusStrings = when (language) {
    "ar" -> FocusStrings(
        title = "جلسة تركيز",
        subtitle = "ابدأ بهدوء واجعل القراءة بسيطة ومقصودة.",
        menuTitle = "التركيز",
        menuSubtitle = "ابدأ جلسة قراءة هادئة بمؤقت",
        question = "ماذا تريد أن تفعل الآن؟",
        duration = "المدة",
        custom = "مدة مخصصة",
        customPlaceholder = "دقائق",
        minutesShort = "د",
        start = "ابدأ",
        pause = "إيقاف مؤقت",
        reset = "إعادة",
        mushaf = "المصحف",
        finishedTitle = "اكتملت الجلسة",
        finishedSubtitle = "خذ نفسا قصيرا واكتب ما قرأته إن أردت.",
        goals = listOf(
            FocusGoal("reading", "قراءة القرآن", "قراءة هادئة بانتباه"),
            FocusGoal("memorize", "الحفظ", "تثبيت جزء صغير"),
            FocusGoal("review", "المراجعة", "إبقاء المحفوظ حاضرا"),
            FocusGoal("tafsir", "التفسير", "تعميق المعنى")
        ),
        motivations = listOf(
            "ابدأ بالقليل. الدقائق الصادقة لها أثر.",
            "اقرأ بانتباه لا بعجلة.",
            "اجعل البداية سهلة حتى تبدأ فعلا.",
            "جلسة هادئة خير من التأجيل."
        )
    )
    "en" -> FocusStrings(
        title = "Focus Session",
        subtitle = "Start calmly, keep it simple, and finish with intention.",
        menuTitle = "Focus",
        menuSubtitle = "Start a quiet reading session with a timer",
        question = "What do you want to do now?",
        duration = "Duration",
        custom = "Custom time",
        customPlaceholder = "Minutes",
        minutesShort = "m",
        start = "Start",
        pause = "Pause",
        reset = "Reset",
        mushaf = "Mushaf",
        finishedTitle = "Session finished",
        finishedSubtitle = "Take a breath and note what you read if useful.",
        goals = listOf(
            FocusGoal("reading", "Read Quran", "Read calmly with attention"),
            FocusGoal("memorize", "Memorize", "Make a small part firm"),
            FocusGoal("review", "Review", "Keep what you know fresh"),
            FocusGoal("tafsir", "Tafsir", "Deepen the meaning")
        ),
        motivations = listOf(
            "Start small. A few sincere minutes count.",
            "Read with attention, not haste.",
            "Make starting easy enough to actually begin.",
            "A quiet session is better than postponing."
        )
    )
    "fr" -> FocusStrings(
        title = "Session Focus",
        subtitle = "Commence calmement, reste simple, et termine avec intention.",
        menuTitle = "Focus",
        menuSubtitle = "Lance une session de lecture calme avec minuteur",
        question = "Que veux-tu faire maintenant ?",
        duration = "Duree",
        custom = "Temps personnalise",
        customPlaceholder = "Minutes",
        minutesShort = "m",
        start = "Demarrer",
        pause = "Pause",
        reset = "Reset",
        mushaf = "Mushaf",
        finishedTitle = "Session terminee",
        finishedSubtitle = "Respire un instant et note ce que tu as lu si utile.",
        goals = listOf(
            FocusGoal("reading", "Lire le Quran", "Lire calmement avec attention"),
            FocusGoal("memorize", "Memoriser", "Consolider une petite partie"),
            FocusGoal("review", "Reviser", "Garder ce que tu connais frais"),
            FocusGoal("tafsir", "Tafsir", "Approfondir le sens")
        ),
        motivations = listOf(
            "Commence petit. Quelques minutes sinceres comptent.",
            "Lis avec attention, pas avec hate.",
            "Rends le debut assez simple pour vraiment commencer.",
            "Une session calme vaut mieux que remettre a plus tard."
        )
    )
    else -> FocusStrings(
        title = "Focus / Leessessie",
        subtitle = "Start rustig, houd het simpel, en rond bewust af.",
        menuTitle = "Focus",
        menuSubtitle = "Start een rustige leessessie met timer",
        question = "Wat wil je nu doen?",
        duration = "Duur",
        custom = "Eigen tijd",
        customPlaceholder = "Minuten",
        minutesShort = "m",
        start = "Start",
        pause = "Pauze",
        reset = "Reset",
        mushaf = "Mushaf",
        finishedTitle = "Sessie afgerond",
        finishedSubtitle = "Neem even adem en noteer eventueel wat je gelezen hebt.",
        goals = listOf(
            FocusGoal("reading", "Quran lezen", "Rustig lezen met aandacht"),
            FocusGoal("memorize", "Memoriseren", "Een klein stuk stevig maken"),
            FocusGoal("review", "Herhalen", "Wat je kent fris houden"),
            FocusGoal("tafsir", "Tafsir", "Betekenis verdiepen")
        ),
        motivations = listOf(
            "Begin klein. Een paar oprechte minuten tellen.",
            "Lees met aandacht, niet met haast.",
            "Leg de lat laag genoeg om echt te starten.",
            "Een rustige sessie is beter dan uitstellen."
        )
    )
}

@Composable
fun FocusSessionScreen(
    appLanguage: String,
    selectedGoalKey: String,
    selectedMinutes: Int,
    remainingSeconds: Int,
    isRunning: Boolean,
    isFinished: Boolean,
    onGoalChange: (String) -> Unit,
    onDurationChange: (Int) -> Unit,
    onToggleRunning: () -> Unit,
    onReset: () -> Unit,
    onOpenMushaf: () -> Unit
) {
    val strings = focusStrings(appLanguage)
    val selectedGoal = strings.goals.firstOrNull { it.key == selectedGoalKey } ?: strings.goals.first()
    val motivation = remember(selectedGoalKey, selectedMinutes, appLanguage) {
        strings.motivations[(selectedGoalKey.length + selectedMinutes) % strings.motivations.size]
    }
    var customInput by remember(selectedMinutes) { mutableStateOf(selectedMinutes.toString()) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkNavy)
            .verticalScroll(rememberScrollState())
            .padding(AppSpacing.screen),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(strings.title, fontSize = 24.sp, color = GoldLight, fontWeight = FontWeight.Bold)
            Text(strings.subtitle, fontSize = 13.sp, color = MutedGold)
        }

        FocusPanel {
            Text(strings.question, fontSize = 13.sp, color = MutedGold, fontWeight = FontWeight.Bold)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                strings.goals.forEach { goal ->
                    FocusGoalRow(
                        goal = goal,
                        selected = selectedGoal.key == goal.key,
                        enabled = !isRunning,
                        onClick = { onGoalChange(goal.key) }
                    )
                }
            }
        }

        FocusPanel {
            Text(strings.duration, fontSize = 13.sp, color = MutedGold, fontWeight = FontWeight.Bold)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(10, 15, 25, 45).forEach { minutes ->
                    FocusDurationChip(
                        label = "$minutes${strings.minutesShort}",
                        selected = selectedMinutes == minutes,
                        enabled = !isRunning,
                        onClick = { onDurationChange(minutes) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = customInput,
                    onValueChange = { value -> customInput = value.filter { it.isDigit() }.take(3) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    enabled = !isRunning,
                    label = { Text(strings.custom) },
                    placeholder = { Text(strings.customPlaceholder) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = GoldLight,
                        unfocusedTextColor = GoldLight,
                        focusedBorderColor = Gold,
                        unfocusedBorderColor = BorderNavy,
                        focusedLabelColor = Gold,
                        unfocusedLabelColor = MutedGold,
                        focusedContainerColor = DeepNavy,
                        unfocusedContainerColor = DeepNavy,
                        cursorColor = Gold
                    )
                )
                Button(
                    onClick = { customInput.toIntOrNull()?.coerceIn(1, 180)?.let(onDurationChange) },
                    enabled = !isRunning,
                    modifier = Modifier.height(54.dp),
                    shape = RoundedCornerShape(AppShape.control),
                    colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = DarkNavy)
                ) {
                    Text("OK", fontWeight = FontWeight.Bold)
                }
            }
        }

        FocusTimerCard(
            goalLabel = selectedGoal.label,
            remainingSeconds = remainingSeconds,
            totalSeconds = selectedMinutes * 60,
            motivation = motivation,
            isFinished = isFinished
        )

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = onToggleRunning,
                modifier = Modifier.weight(1f).height(AppComponentDefaults.minTouchTarget),
                shape = RoundedCornerShape(AppShape.control),
                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = DarkNavy)
            ) {
                Icon(if (isRunning) Icons.Default.Pause else Icons.Default.PlayArrow, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text(if (isRunning) strings.pause else strings.start, fontWeight = FontWeight.Bold)
            }
            OutlinedButton(
                onClick = onReset,
                modifier = Modifier.height(AppComponentDefaults.minTouchTarget),
                shape = RoundedCornerShape(AppShape.control),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = MutedGold)
            ) {
                Icon(Icons.Default.Stop, contentDescription = null)
            }
        }

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(
                onClick = onReset,
                modifier = Modifier.weight(1f).height(AppComponentDefaults.minTouchTarget),
                shape = RoundedCornerShape(AppShape.control),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight)
            ) {
                Icon(Icons.Default.RestartAlt, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(strings.reset, fontSize = 12.sp)
            }
            OutlinedButton(
                onClick = onOpenMushaf,
                modifier = Modifier.weight(1f).height(AppComponentDefaults.minTouchTarget),
                shape = RoundedCornerShape(AppShape.control),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight)
            ) {
                Icon(Icons.Default.AutoStories, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(strings.mushaf, fontSize = 12.sp)
            }
        }

        if (isFinished) {
            FocusPanel {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = DoneGreen)
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(strings.finishedTitle, color = GoldLight, fontWeight = FontWeight.Bold)
                        Text(strings.finishedSubtitle, fontSize = 12.sp, color = MutedGold)
                    }
                }
            }
        }
    }
}

@Composable
fun FocusFloatingTimer(
    remainingSeconds: Int,
    isRunning: Boolean,
    modifier: Modifier = Modifier
) {
    if (!isRunning && remainingSeconds <= 0) return
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(99.dp))
            .background(DarkNavy.copy(alpha = 0.62f))
            .border(1.dp, Gold.copy(alpha = 0.55f), RoundedCornerShape(99.dp))
            .padding(horizontal = 10.dp, vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            formatFocusTime(remainingSeconds),
            color = GoldLight,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun FocusPanel(content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.control))
            .background(MidNavy)
            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
            .padding(AppSpacing.list),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        content = content
    )
}

@Composable
private fun FocusGoalRow(goal: FocusGoal, selected: Boolean, enabled: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.control))
            .background(if (selected) TodayDoneSurface else DeepNavy)
            .border(1.dp, if (selected) Gold else BorderNavy, RoundedCornerShape(AppShape.control))
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
            Text(goal.label, color = GoldLight, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            Text(goal.subtitle, color = MutedGold, fontSize = 11.sp, textAlign = TextAlign.End)
        }
    }
}

@Composable
private fun FocusDurationChip(
    label: String,
    selected: Boolean,
    enabled: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .height(AppComponentDefaults.minTouchTarget)
            .clip(RoundedCornerShape(AppShape.control))
            .background(if (selected) Gold else DeepNavy)
            .border(1.dp, if (selected) GoldLight else BorderNavy, RoundedCornerShape(AppShape.control))
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(label, color = if (selected) DarkNavy else GoldLight, fontWeight = FontWeight.Bold, fontSize = 13.sp)
    }
}

@Composable
private fun FocusTimerCard(
    goalLabel: String,
    remainingSeconds: Int,
    totalSeconds: Int,
    motivation: String,
    isFinished: Boolean
) {
    val progress = if (totalSeconds <= 0) 0f else remainingSeconds / totalSeconds.toFloat()
    FocusPanel {
        Text(goalLabel, color = MutedGold, fontSize = 13.sp, fontWeight = FontWeight.Bold, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
        Text(
            formatFocusTime(remainingSeconds),
            color = GoldLight,
            fontSize = 54.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center
        )
        LinearProgressIndicator(
            progress = { 1f - progress },
            modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(99.dp)),
            color = if (isFinished) DoneGreen else Gold,
            trackColor = DeepNavy
        )
        Text(motivation, color = SoftTextGold, fontSize = 13.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
    }
}

fun formatFocusTime(seconds: Int): String {
    val minutes = seconds / 60
    val rest = seconds % 60
    return "${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}"
}
