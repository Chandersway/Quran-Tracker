package com.Ameender.qurantracker.ui

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.Ameender.qurantracker.data.*
import com.Ameender.qurantracker.viewmodel.GoalViewModel
import java.time.LocalDate
import java.util.UUID

private fun goalLabel(id: Int, language: String) = when (id) {
    2 -> goalText(language, "Hifdh", "Memorisation", "الحفظ")
    3 -> goalText(language, "Murājaʿah", "Review", "المراجعة")
    else -> goalText(language, "Lezen", "Reading", "القراءة")
}
private fun goalUnitLabel(unit: String, language: String) = when(unit) {
    "pages" -> goalText(language, "pagina’s", "pages", "صفحات")
    "ayahs" -> goalText(language, "āyāt", "ayahs", "آيات")
    "minutes" -> goalText(language, "minuten", "minutes", "دقائق")
    else -> unit
}
fun goalText(language: String, nl: String, en: String, ar: String) = when(language) {
    "en" -> en; "ar" -> ar; else -> nl
}

/** Shared goal presentation: it never keeps a separate completed counter. */
@Composable
fun GoalHubPanel(
    viewModel: GoalViewModel,
    language: String = "nl",
    compact: Boolean = false,
    date: String = LocalDate.now().toString(),
    onContinue: ((Int) -> Unit)? = null,
    onlyGoalId: Int? = null,
    dense: Boolean = false
) {
    val goals by viewModel.goals.collectAsState()
    val days by viewModel.days.collectAsState()
    val sessions by viewModel.sessions.collectAsState()
    val journey by viewModel.readingJourney.collectAsState()
    val message by viewModel.message.collectAsState()
    var expanded by rememberSaveable { mutableStateOf(!compact) }
    var recording by remember { mutableStateOf<DailyGoal?>(null) }
    var scheduling by remember { mutableStateOf(false) }
    val today = LocalDate.now().toString()
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MidNavy),
        border = BorderStroke(1.dp, BorderNavy)
    ) {
        Column(
            Modifier.padding(if (dense) 8.dp else 16.dp),
            verticalArrangement = Arrangement.spacedBy(if (dense) 6.dp else 12.dp)
        ) {
            if (!dense) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(goalText(language, "Dagelijks doel", "Daily goals", "الأهداف اليومية"),
                            color = GoldLight, fontWeight = FontWeight.SemiBold, fontSize = 20.sp)
                        Text(if (date == today) goalText(language, "Vandaag · jouw ritme", "Today · your pace", "اليوم · وتيرتك")
                            else date, color = MutedGold, fontSize = 12.sp)
                    }
                    if (compact) TextButton(onClick = { expanded = !expanded }) {
                        Text(goalText(language, if (expanded) "Sluiten" else "Beheren",
                            if (expanded) "Close" else "Manage", if (expanded) "إغلاق" else "إدارة"))
                    }
                }
            }
            goals.filter { (expanded || it.target > 0) && (onlyGoalId == null || it.id == onlyGoalId) }.forEach { goal ->
                val progress = days.find { it.day.goalId == goal.id && it.day.date == date }
                    ?: GoalDayProgress(GoalDay(goal.id, date, goal.unit, if (date >= today) goal.target else 0), 0)
                GoalManagementCard(goal, progress, language, expanded, date <= today, dense,
                    onSave = viewModel::saveDefinition,
                    onRecord = { scheduling = false; recording = goal.copy(unit = progress.day.unit) },
                    onPlan = if (date >= today) ({ scheduling = true; recording = goal }) else null)
                if (onContinue != null && date == today && goal.target > 0) {
                    TextButton(onClick = { onContinue(goal.id) }) {
                        Text(goalText(language, "Verder met ", "Continue ", "متابعة ") + goalLabel(goal.id, language))
                    }
                }
            }
            if (expanded) {
                HorizontalDivider(color = BorderNavy)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(goalText(language, "Leesreis", "Reading journey", "رحلة القراءة"), color = GoldLight,
                            fontWeight = FontWeight.SemiBold)
                        Text(goalText(language, "Volgt je leesdoel automatisch", "Automatically follows your reading goal",
                            "تتبع هدف القراءة تلقائيا"), color = MutedGold, fontSize = 12.sp)
                    }
                    Switch(checked = journey.enabled, onCheckedChange = {
                        viewModel.saveReadingJourney(it, journey.totalDays, today, false)
                    })
                }
                if (journey.enabled) {
                    val reading = goals.firstOrNull { it.id == 1 }
                    val end = runCatching { LocalDate.parse(journey.startDate).plusDays(journey.totalDays.toLong() - 1) }.getOrNull()
                    Text(
                        if (reading?.unit == "minutes" || reading?.target == 0)
                            goalText(language, "Kies een hoeveelheid om een einddatum te berekenen.",
                                "Choose a quantity to calculate a finish date.", "اختر كمية لحساب تاريخ الإتمام.")
                        else goalText(language, "Verwachte einddatum: ", "Expected finish: ", "الإتمام المتوقع: ") + (end ?: "—"),
                        color = MutedGold, fontSize = 13.sp
                    )
                    Text(goalText(language, "Bij een aangepast doel of nieuwe voortgang wordt de planning opnieuw berekend.",
                        "Changes to your goal or progress update the forecast.",
                        "يتجدد التقدير عند تغيير الهدف أو التقدم."), color = MutedGold, fontSize = 12.sp)
                }
                val missed = days.filter { it.day.date < today && it.remaining > 0 && it.day.resolution.isEmpty() }
                if (missed.isNotEmpty()) {
                    Text(goalText(language, "Nog te beslissen", "Needs a decision", "بانتظار قرار"),
                        color = GoldLight, fontWeight = FontWeight.SemiBold)
                    missed.forEach { item ->
                        Column(Modifier.fillMaxWidth().border(1.dp, BorderNavy, RoundedCornerShape(12.dp)).padding(10.dp)) {
                            Text(item.day.date + " · " + goalLabel(item.day.goalId, language), color = GoldLight)
                            Text("${item.remaining} ${goalUnitLabel(item.day.unit, language)}",
                                color = MutedGold, fontSize = 12.sp)
                            Row(Modifier.horizontalScroll(rememberScrollState())) {
                                TextButton(onClick = { viewModel.resolve(item.day, "carry") }) {
                                    Text(goalText(language, "Naar vandaag", "Move to today", "نقل إلى اليوم"))
                                }
                                TextButton(onClick = { viewModel.resolve(item.day, "spread") }) {
                                    Text(goalText(language, "Over 3 dagen", "Over 3 days", "خلال ٣ أيام"))
                                }
                                TextButton(onClick = { viewModel.resolve(item.day, "skip") }) {
                                    Text(goalText(language, "Overslaan", "Skip", "تخطي"))
                                }
                            }
                        }
                    }
                }
                Text(goalText(language, "Je dagelijkse doelen staan ook in Agenda. Niet afgerond? Je kiest zelf hoe je verdergaat.",
                    "Daily goals also appear in Agenda. You decide how to handle unfinished goals.",
                    "تظهر الأهداف في الجدول أيضا. أنت تختار كيفية معالجة ما لم يكتمل."),
                    color = MutedGold, fontSize = 12.sp)
            }
            if (message != null) {
                TextButton(onClick = { viewModel.message.value = null }) { Text(message!!) }
            }
        }
    }
    recording?.let { goal ->
        var contentType by remember(goal) { mutableStateOf(defaultGoalContentType(goal.unit)) }
        var referenceInput by remember(goal) { mutableStateOf("1") }
        val matching = sessions.filter { it.date == date && it.goalId == goal.id &&
            it.measurementUnit == goal.unit && !it.historyLogged && validPlannedContent(it) }
        var selectedPlan by remember(goal) { mutableStateOf<PlanningItem?>(if (!scheduling) matching.firstOrNull() else null) }
        val source = remember(goal) { "goal-session:" + UUID.randomUUID().toString() }
        val selectedContent = selectedPlan?.let {
            GoalSessionContent(
                it.type,
                it.referenceId,
                it.subId,
                contentDisplayName(it.type, it.referenceId, language) ?: it.displayName
            )
        } ?: sessionContent(contentType, referenceInput.toIntOrNull(), language)
        AlertDialog(
            onDismissRequest = { recording = null },
            title = { Text(goalLabel(goal.id, language), fontSize = 18.sp) },
            text = {
                Column(
                    modifier = Modifier.heightIn(max = 400.dp).verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    if (!scheduling) Text(goalText(language, "Voeg alleen een nog niet geregistreerde sessie toe.",
                        "Add only a session that has not already been recorded.", "أضف جلسة لم تُسجل من قبل فقط."),
                        fontSize = 11.sp, color = MutedGold)
                    if (!scheduling && matching.isNotEmpty()) {
                        Text(goalText(language, "Koppel aan Agenda", "Link to Agenda", "ربط بالجدول"))
                        matching.take(2).forEach { plan ->
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                RadioButton(selected = selectedPlan?.id == plan.id, onClick = { selectedPlan = plan })
                                Text(plan.displayName)
                            }
                        }
                        TextButton(onClick = { selectedPlan = null }) {
                            Text(goalText(language, "Andere, nieuwe sessie", "Another new session", "جلسة جديدة أخرى"))
                        }
                    }
                    if (selectedPlan == null) {
                        Text(goalText(language, "Wat heb je behandeld?", "What did you cover?", "ماذا درست؟"),
                            color = GoldLight, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                        Row(
                            Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            listOf("surah", "hizb", "juz").forEach { option ->
                                FilterChip(
                                    selected = contentType == option,
                                    onClick = { contentType = option; referenceInput = "1" },
                                    label = { Text(contentTypeLabel(option, language), fontSize = 11.sp) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                        OutlinedTextField(
                            value = referenceInput,
                            onValueChange = { referenceInput = it.filter(Char::isDigit).take(3) },
                            label = { Text(contentNumberLabel(contentType, language)) },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth()
                        )
                        Text(
                            selectedContent?.displayName ?: goalText(
                                language,
                                "Kies een geldig nummer",
                                "Choose a valid number",
                                "اختر رقما صحيحا"
                            ),
                            color = if (selectedContent == null) DeleteRed else MutedGold,
                            fontSize = 11.sp
                        )
                    } else {
                        Text(selectedContent?.displayName.orEmpty(), color = GoldLight, fontSize = 12.sp)
                    }
                }
            },
            confirmButton = {
                TextButton(enabled = selectedContent != null, onClick = {
                    val content = selectedContent ?: return@TextButton
                    val registeredAmount = selectedPlan?.amount ?: 1
                    val registeredUnit = selectedPlan?.measurementUnit?.ifBlank { selectedPlan?.type.orEmpty() }
                        ?: content.type
                    if (scheduling) viewModel.schedule(goal, date, 1, content)
                    else viewModel.record(goal.id, date, registeredAmount, registeredUnit,
                        selectedPlan?.let { "planning:${it.id}" } ?: source, content)
                    recording = null
                }) { Text(if (scheduling) goalText(language, "Inplannen", "Schedule", "جدولة")
                    else goalText(language, "Registreren", "Record", "تسجيل")) }
            },
            dismissButton = { TextButton(onClick = { recording = null }) {
                Text(goalText(language, "Annuleren", "Cancel", "إلغاء"))
            } }
        )
    }
}

private fun defaultGoalContentType(unit: String): String = when (unit) {
    "juz" -> "juz"
    "hizb", "rub" -> "hizb"
    else -> "surah"
}

private fun contentTypeLabel(type: String, language: String): String = when (type) {
    "hizb" -> "Hizb"
    "juz" -> "Juz"
    else -> goalText(language, "Soera", "Surah", "سورة")
}

private fun contentNumberLabel(type: String, language: String): String = when (type) {
    "hizb" -> goalText(language, "Hizb-nummer (1–60)", "Hizb number (1–60)", "رقم الحزب (١–٦٠)")
    "juz" -> goalText(language, "Juz-nummer (1–30)", "Juz number (1–30)", "رقم الجزء (١–٣٠)")
    else -> goalText(language, "Soera-nummer (1–114)", "Surah number (1–114)", "رقم السورة (١–١١٤)")
}

private fun sessionContent(type: String, referenceId: Int?, language: String): GoalSessionContent? {
    val id = referenceId ?: return null
    val name = contentDisplayName(type, id, language) ?: return null
    return GoalSessionContent(type = type, referenceId = id, displayName = name)
}

private fun contentDisplayName(type: String, referenceId: Int, language: String): String? = when (type) {
    "surah" -> ALL_SURAHS.find { it.id == referenceId }?.let { "${contentTypeLabel(type, language)} $referenceId · ${it.name} · ${it.arabic}" }
    "hizb" -> ALL_HIZB.find { it.hizbNumber == referenceId }?.let { "Hizb $referenceId · ${it.surahArabic} ${it.surahNumber}:${it.ayahNumber}" }
    "juz" -> if (referenceId in 1..30) "Juz $referenceId" else null
    else -> null
}

private fun validPlannedContent(item: PlanningItem): Boolean = when (item.type) {
    "surah" -> item.referenceId in 1..114
    "hizb" -> item.referenceId in 1..60
    "juz" -> item.referenceId in 1..30
    else -> false
}

@Composable
private fun GoalManagementCard(
    goal: DailyGoal, progress: GoalDayProgress, language: String, editable: Boolean, canRecord: Boolean,
    dense: Boolean,
    onSave: (DailyGoal) -> Unit, onRecord: () -> Unit, onPlan: (() -> Unit)?
) {
    var editing by rememberSaveable(goal.id) { mutableStateOf(false) }
    var target by remember(goal) { mutableStateOf(goal.target.toString()) }
    var unit by remember(goal) { mutableStateOf(goal.unit) }
    var hour by remember(goal) { mutableStateOf(goal.reminderHour.toString()) }
    var minute by remember(goal) { mutableStateOf(goal.reminderMinute.toString()) }
    Column(
        Modifier.fillMaxWidth().border(1.dp, BorderNavy, RoundedCornerShape(14.dp))
            .padding(if (dense) 8.dp else 12.dp),
        verticalArrangement = Arrangement.spacedBy(if (dense) 4.dp else 8.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(goalLabel(goal.id, language), color = GoldLight, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
            if (editable) TextButton(onClick = { editing = !editing }) {
                Text(goalText(language, if (editing) "Sluiten" else "Aanpassen",
                    if (editing) "Close" else "Edit", if (editing) "إغلاق" else "تعديل"))
            }
            Text("${(progress.fraction * 100).toInt()}%", color = Gold)
        }
        Text(if (progress.target == 0) goalText(language, "Nog geen doel ingesteld", "No goal set", "لم يحدد هدف")
            else "${progress.done} / ${progress.target} ${goalUnitLabel(progress.day.unit, language)}",
            color = GoldLight, fontSize = if (dense) 15.sp else 18.sp, fontWeight = FontWeight.Medium)
        LinearProgressIndicator(progress = { progress.fraction }, color = Gold, trackColor = BorderNavy,
            modifier = Modifier.fillMaxWidth().height(4.dp))
        if (progress.day.resolution.isNotEmpty()) {
            Text(when(progress.day.resolution) {
                "carry" -> goalText(language, "Resterend doel doorgeschoven", "Remaining target moved", "تم نقل المتبقي")
                "spread" -> goalText(language, "Resterend doel over 3 dagen verdeeld", "Remaining target spread over 3 days", "تم توزيع المتبقي على ٣ أيام")
                else -> goalText(language, "Bewust overgeslagen", "Intentionally skipped", "تم التخطي")
            }, color = MutedGold, fontSize = 12.sp)
        }
        if (progress.target > 0) {
            Text(goalText(language, "Resterend: ", "Remaining: ", "المتبقي: ") +
                progress.remaining + " " + goalUnitLabel(progress.day.unit, language) +
                if (progress.day.extra > 0) goalText(language, " · inclusief doorgeschoven", " · includes carry-over", " · يشمل المنقول") else "",
                color = MutedGold, fontSize = 12.sp)
            if (canRecord) TextButton(onClick = onRecord) {
                Text(goalText(language, "+ Sessie registreren", "+ Record session", "+ تسجيل جلسة"))
            }
            if (onPlan != null && editable) TextButton(onClick = onPlan) {
                Text(goalText(language, "Sessie in Agenda plannen", "Schedule an Agenda session", "جدولة جلسة"))
            }
        }
        if (editing && editable) {
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                goalUnits.forEach { option ->
                    FilterChip(selected = unit == option, onClick = { unit = option }, label = { Text(goalUnitLabel(option, language)) })
                }
            }
            OutlinedTextField(value = target, onValueChange = { target = it.filter(Char::isDigit).take(5) },
                label = { Text(goalText(language, "Per dag · 0 = uit", "Per day · 0 = off", "يوميا · ٠ للإيقاف")) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), modifier = Modifier.fillMaxWidth())
            if (goal.id == 1) {
                Text(goalText(language, "Dagelijkse herinnering", "Daily reminder", "التذكير اليومي"), color = MutedGold)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(hour, { hour = it.filter(Char::isDigit).take(2) }, modifier = Modifier.weight(1f),
                        label = { Text("HH") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                    OutlinedTextField(minute, { minute = it.filter(Char::isDigit).take(2) }, modifier = Modifier.weight(1f),
                        label = { Text("MM") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                }
            }
            Button(enabled = target.toIntOrNull() in 0..10000 && hour.toIntOrNull() in 0..23 && minute.toIntOrNull() in 0..59,
                onClick = { onSave(goal.copy(unit = unit, target = target.toInt(),
                    reminderHour = hour.toInt(), reminderMinute = minute.toInt())); editing = false }) {
                Text(goalText(language, "Doel opslaan", "Save goal", "حفظ الهدف"))
            }
        }
    }
}
