package com.Ameender.qurantracker.ui

import android.app.DatePickerDialog
import android.content.Context
import android.content.SharedPreferences
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.Ameender.qurantracker.data.*
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlin.math.ceil

private data class ReadingPlan(val target: Int = 30, val unit: String = "hizb", val started: Long = 0, val end: String = "", val adjustment: Double = 0.0)
private fun SharedPreferences.plan() = ReadingPlan(getInt("target", 30), getString("unit", "hizb")!!, getLong("started", 0), getString("end", "")!!, getString("adjustment", "0")!!.toDouble())
@Composable
private fun rememberPlan(): Pair<SharedPreferences, ReadingPlan> {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("independent_reading_plan", Context.MODE_PRIVATE) }
    var plan by remember { mutableStateOf(prefs.plan()) }
    DisposableEffect(prefs) {
        val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, _ -> plan = prefs.plan() }
        prefs.registerOnSharedPreferenceChangeListener(listener)
        onDispose { prefs.unregisterOnSharedPreferenceChangeListener(listener) }
    }
    return prefs to plan
}
private fun ReadingPlan.logged(history: List<ReadingHistory>) = if (started == 0L) 0.0 else history
    .filter { it.action == "read" && it.timestamp >= started && it.type != "minutes" }
    .sumOf { historyQuranFraction(it) } / unitQuranFraction(unit)
private fun ReadingPlan.done(history: List<ReadingHistory>) = (logged(history) + adjustment).coerceAtLeast(0.0)
private fun quantity(value: Double, language: String) = java.text.NumberFormat.getNumberInstance(java.util.Locale.forLanguageTag(language)).apply { maximumFractionDigits = 1 }.format(value)
private fun planUnit(unit: String, language: String) = when(language) {
    "ar" -> when(unit) { "pages" -> "صفحات"; "ayahs" -> "آيات"; "rub" -> "ربع حزب"; "hizb" -> "حزب"; else -> "جزء" }
    "en", "fr" -> when(unit) { "pages" -> "pages"; "ayahs" -> "ayat"; "rub" -> "rubʿ"; else -> unit }
    else -> when(unit) { "pages" -> "pagina’s"; "ayahs" -> "ayat"; "rub" -> "rubʿ"; else -> unit }
}

@Composable
internal fun ReadingPlanHomeCard(history: List<ReadingHistory>, language: String, onOpen: () -> Unit) {
    fun t(key: String) = readingPlanText(language, key)
    val (_, plan) = rememberPlan()
    val done = plan.done(history)
    Card(Modifier.fillMaxWidth().padding(bottom = 16.dp).clickable(onClick = onOpen), colors = CardDefaults.cardColors(containerColor = TodayFocusSurface)) {
        Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(18.dp)) {
            Box(contentAlignment = Alignment.Center) {
                CircularProgressIndicator(progress = { 1f }, modifier = Modifier.size(76.dp), color = BorderNavy, strokeWidth = 6.dp)
                CircularProgressIndicator(progress = { (done / plan.target).toFloat().coerceIn(0f, 1f) }, modifier = Modifier.size(76.dp), color = Gold, strokeWidth = 6.dp)
                Text(java.text.NumberFormat.getPercentInstance(java.util.Locale.forLanguageTag(language)).format((done / plan.target).coerceIn(0.0, 1.0)), color = GoldLight)
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Text(t("Mijn leesplan"), style = MaterialTheme.typography.titleMedium, color = GoldLight)
                Text(if (plan.started == 0L) t("Stel je eigen leesdoel in") else "${quantity(done, language)} / ${quantity(plan.target.toDouble(), language)} ${planUnit(plan.unit, language)}", color = MutedGold)
                Text(if (plan.started == 0L) t("Plan instellen →") else t("Bekijken en aanpassen →"), color = Gold)
            }
        }
    }
}

@Composable
internal fun ReadingPlanScreen(history: List<ReadingHistory>, language: String) {
    fun t(key: String) = readingPlanText(language, key)
    val (prefs, plan) = rememberPlan()
    var target by remember(plan) { mutableStateOf(plan.target.toString()) }
    var unit by remember(plan) { mutableStateOf(plan.unit) }
    var end by remember(plan) { mutableStateOf(plan.end) }
    var correction by remember { mutableStateOf("") }
    var editingProgress by remember { mutableStateOf(false) }
    var notice by remember { mutableStateOf("") }
    val context = LocalContext.current
    val done = plan.done(history)
    val valid = target.toIntOrNull()?.let { it in 1..100000 } == true
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        Text(t("Een leesplan op jouw tempo"), style = MaterialTheme.typography.headlineSmall)
        Text(t("Kies hoeveel je wilt lezen. Welke gedeelten je leest bepaal je zelf; herhaling telt mee. Dit plan staat los van je dagelijkse doelen."), style = MaterialTheme.typography.bodyMedium)
        ReadingPlanHomeCard(history, language, onOpen = {})
        if (plan.started != 0L) {
            Text("${t("remaining")}: ${quantity((plan.target - done).coerceAtLeast(0.0), language)} ${planUnit(plan.unit, language)}", style = MaterialTheme.typography.titleMedium)
            Text("${t("automatic")}: ${quantity(plan.logged(history), language)} · ${t("adjustment")}: ${quantity(plan.adjustment, language)}", style = MaterialTheme.typography.bodySmall)
            TextButton(onClick = { correction = done.toString(); editingProgress = true }) { Text(t("Voortgang aanpassen")) }
        }
        HorizontalDivider()
        Text(t("Je doel"), style = MaterialTheme.typography.titleLarge)
        OutlinedTextField(value = target, onValueChange = { target = normalizePlanNumber(it).filter(Char::isDigit).take(6) }, label = { Text(t("Totaal te lezen")) }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true, modifier = Modifier.fillMaxWidth())
        Column {
            listOf(listOf("hizb", "rub", "juz"), listOf("pages", "ayahs")).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    row.forEach { value -> FilterChip(selected = unit == value, onClick = { unit = value }, label = { Text(planUnit(value, language)) }) }
                }
            }
        }
        Text(t("Planning"), style = MaterialTheme.typography.titleLarge)
        Text(t("Een einddatum is optioneel. Zonder datum lees je op je eigen tempo."), style = MaterialTheme.typography.bodySmall)
        OutlinedButton(modifier = Modifier.testTag("reading_plan_end_date"), onClick = {
            val date = runCatching { LocalDate.parse(end) }.getOrDefault(LocalDate.now().plusDays(14))
            DatePickerDialog(localizedDialogContext(context, language), { _, y, m, d -> end = LocalDate.of(y, m + 1, d).toString() }, date.year, date.monthValue - 1, date.dayOfMonth).apply { datePicker.minDate = System.currentTimeMillis() }.show()
        }) { Text(if (end.isBlank()) t("Einddatum kiezen") else LocalDate.parse(end).format(java.time.format.DateTimeFormatter.ofLocalizedDate(java.time.format.FormatStyle.MEDIUM).withLocale(java.util.Locale.forLanguageTag(language)))) }
        if (end.isNotBlank()) {
            TextButton(onClick = { end = "" }) { Text(t("Zonder einddatum")) }
            val days = ChronoUnit.DAYS.between(LocalDate.now(), LocalDate.parse(end)) + 1
            val convertedDone = done * unitQuranFraction(plan.unit) / unitQuranFraction(unit)
            if (valid && days > 0) Text("${t("pace")}: ${quantity(((target.toInt() - convertedDone).coerceAtLeast(0.0)) / days, language)} ${planUnit(unit, language)}")
            else if (days <= 0) Text(t("Deze einddatum is verstreken. Kies een nieuwe datum of lees zonder einddatum."))
        }
        Button(enabled = valid, modifier = Modifier.fillMaxWidth(), onClick = {
            val convertedAdjustment = plan.adjustment * unitQuranFraction(plan.unit) / unitQuranFraction(unit)
            val saved = prefs.edit().putInt("target", target.toInt()).putString("unit", unit).putString("end", end)
                .putLong("started", plan.started.takeIf { it != 0L } ?: System.currentTimeMillis())
                .putString("adjustment", convertedAdjustment.toString()).commit()
            notice = if (saved) t("Leesplan opgeslagen") else t("Opslaan mislukt. Probeer opnieuw.")
        }) { Text(if (plan.started == 0L) t("Leesplan starten") else t("Wijzigingen opslaan")) }
        if (notice.isNotBlank()) Text(notice)
        Text(t("Hoe wordt er geteld?"), style = MaterialTheme.typography.titleMedium)
        Text(t("Leesregistraties vanaf het starten van dit plan tellen automatisch mee. Ook dezelfde hizb opnieuw lezen telt. Minuten tellen niet mee. Verschillende eenheden worden bij benadering omgerekend (60 hizb = 240 rubʿ = 30 juz = 604 pagina’s = 6236 ayat). Een correctie verandert alleen dit plan, niet je leesgeschiedenis of dagdoel."), style = MaterialTheme.typography.bodySmall)
    }
    if (editingProgress) AlertDialog(onDismissRequest = { editingProgress = false }, title = { Text(t("Gelezen totaal corrigeren")) }, text = {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(t("Vul je nieuwe totale voortgang in, inclusief wat al automatisch is geteld. Zo telt dezelfde lezing niet dubbel."))
            OutlinedTextField(value = correction, onValueChange = { correction = it }, label = { Text(planUnit(plan.unit, language)) }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true)
        }
    }, confirmButton = { TextButton(enabled = normalizePlanNumber(correction).toDoubleOrNull()?.let { it.isFinite() && it >= 0 && it <= 1000000 } == true, onClick = {
        val value = normalizePlanNumber(correction).toDouble()
        if (prefs.edit().putString("adjustment", (value - plan.logged(history)).toString()).commit()) editingProgress = false
    }) { Text(t("Opslaan")) } }, dismissButton = { TextButton(onClick = { editingProgress = false }) { Text(t("Annuleren")) } })
}
