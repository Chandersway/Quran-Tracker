package com.Ameender.qurantracker.ui

import android.app.DatePickerDialog
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.Ameender.qurantracker.data.*
import com.Ameender.qurantracker.viewmodel.GoalViewModel
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import kotlin.math.ceil

@Composable
internal fun ReadingJourneyDialog(
    viewModel: GoalViewModel,
    journey: ReadingJourney,
    history: List<ReadingHistory>,
    language: String,
    onDismiss: () -> Unit
) {
    val goals by viewModel.goals.collectAsState()
    val reading = goals.firstOrNull { it.id == 1 }
    val context = LocalContext.current
    val today = LocalDate.now()
    val start = journey.startDate.ifBlank { today.toString() }
    val fraction = journeyFraction(history.filter { it.dateKey >= start })
    val remaining = (604.0 * (1 - fraction)).coerceAtLeast(0.0)
    var byDate by remember { mutableStateOf(false) }
    var end by remember { mutableStateOf(today.plusDays(29)) }
    var amount by remember(reading) {
        mutableStateOf(reading?.let { ceil(unitQuranFraction(it.unit) * it.target * 604).toInt().coerceAtLeast(1) }?.toString() ?: "20")
    }
    var enabled by remember { mutableStateOf(journey.enabled) }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    fun label(nl: String, en: String, ar: String) = goalText(language, nl, en, ar)
    val days = ChronoUnit.DAYS.between(today, end).toInt() + 1
    val target = if (byDate) ceil(remaining / days.coerceAtLeast(1)).toInt().coerceAtLeast(1) else amount.toIntOrNull()
    val valid = reading != null && target != null && target in 1..10000 && (!byDate || days > 0)
    val forecast = target?.takeIf { it > 0 }?.let { today.plusDays((ceil(remaining / it).toLong() - 1).coerceAtLeast(0)) }
    val format = DateTimeFormatter.ofPattern("dd-MM-yyyy")
    AlertDialog(
        onDismissRequest = { if (!saving) onDismiss() },
        title = { Text(label("Jouw leesreis", "Your reading journey", "رحلة قراءتك")) },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(label("Doel: één volledige Koranlezing", "Goal: one complete Quran reading", "الهدف: ختم القرآن"), style = MaterialTheme.typography.titleSmall)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(label("Gelezen: ${(fraction * 100).toInt()}%", "Read: ${(fraction * 100).toInt()}%", "المقروء: ${(fraction * 100).toInt()}%"))
                    Text(label("Resterend: ${ceil(remaining).toInt()} pag.*", "Remaining: ${ceil(remaining).toInt()} pp.*", "المتبقي: ${ceil(remaining).toInt()} صفحة*"))
                }
                LinearProgressIndicator(progress = fraction.toFloat(), modifier = Modifier.fillMaxWidth())
                Text(label("* Omgerekend naar 604 pagina’s. Gebaseerd op geregistreerde leesactiviteit vanaf $start; herhaald lezen telt ook mee. Pas je voortgang aan door gelezen werk te registreren.", "* Converted to 604 pages. Based on reading logged since $start; rereading also counts. Update progress by recording your reading.", "* محسوب على أساس 604 صفحات، من القراءة المسجلة منذ $start. تُحتسب إعادة القراءة أيضًا."), style = MaterialTheme.typography.bodySmall)
                HorizontalDivider()
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(label("Leesreis actief", "Journey enabled", "تفعيل الرحلة"))
                    Switch(checked = enabled, onCheckedChange = { enabled = it }, enabled = !saving)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = !byDate, onClick = { byDate = false }, label = { Text(label("Per dag", "Per day", "يوميًا")) }, enabled = !saving)
                    FilterChip(selected = byDate, onClick = { byDate = true }, label = { Text(label("Einddatum", "Finish date", "تاريخ الإتمام")) }, enabled = !saving)
                }
                if (byDate) {
                    OutlinedButton(onClick = {
                        DatePickerDialog(context, { _, year, month, day -> end = LocalDate.of(year, month + 1, day) }, end.year, end.monthValue - 1, end.dayOfMonth).apply {
                            datePicker.minDate = System.currentTimeMillis()
                        }.show()
                    }, enabled = !saving) { Text(end.format(format)) }
                    Text(label("Benodigd: $target pagina’s per dag", "Required: $target pages per day", "المطلوب: $target صفحة يوميًا"))
                } else {
                    OutlinedTextField(value = amount, onValueChange = { amount = it.filter(Char::isDigit).take(5) }, label = { Text(label("Pagina’s per dag", "Pages per day", "صفحات يوميًا")) }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), enabled = !saving, modifier = Modifier.fillMaxWidth())
                }
                Text(label("Verwacht klaar: ", "Estimated finish: ", "الإتمام المتوقع: ") + (forecast?.format(format) ?: "—"), style = MaterialTheme.typography.titleSmall)
                Text(label("Opslaan koppelt deze hoeveelheid aan je dagelijkse leesdoel op Home. De datum is een schatting en beweegt mee met je geregistreerde voortgang.", "Saving links this amount to your daily reading goal on Home. The date is an estimate that changes with your logged progress.", "الحفظ يربط الكمية بهدف القراءة اليومي. التاريخ تقديري ويتغير حسب تقدمك المسجل."), style = MaterialTheme.typography.bodySmall)
                error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            }
        },
        confirmButton = {
            Button(enabled = valid && !saving, onClick = {
                saving = true
                viewModel.saveJourneyPlan(enabled, reading!!.copy(unit = "pages", target = target!!), start) { failure ->
                    saving = false
                    if (failure == null) onDismiss() else error = failure
                }
            }) { Text(label("Opslaan", "Save", "حفظ")) }
        },
        dismissButton = { TextButton(enabled = !saving, onClick = onDismiss) { Text(label("Annuleren", "Cancel", "إلغاء")) } }
    )
}
