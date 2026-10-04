package com.Ameender.qurantracker.ui

import android.app.DatePickerDialog
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.Ameender.qurantracker.data.*
import com.Ameender.qurantracker.viewmodel.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

@Composable
internal fun HizbOverviewCard(language: String, model: HizbOverviewViewModel = viewModel()) {
    val state by model.state.collectAsState()
    val range by model.range.collectAsState()
    var period by rememberSaveable { mutableStateOf(HizbPeriod.Week) }
    var custom by remember { mutableStateOf(false) }
    var expanded by rememberSaveable { mutableStateOf(false) }
    var selected by rememberSaveable { mutableStateOf<Int?>(null) }
    val format = remember(language) { DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(Locale.forLanguageTag(language)) }
    LaunchedEffect(period) {
        while (true) {
            if (period != HizbPeriod.Custom) model.range.value = hizbDateRange(period)
            kotlinx.coroutines.delay(60_000)
        }
    }
    Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MidNavy)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(hizbText(language, "title"), style = MaterialTheme.typography.titleMedium, color = GoldLight)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(HizbPeriod.entries) { value ->
                    FilterChip(selected = period == value, onClick = {
                        selected = null
                        if (value == HizbPeriod.Custom) custom = true else { period = value; model.range.value = hizbDateRange(value) }
                    }, label = { Text(hizbText(language, value.name)) })
                }
            }
            Text("${range.from.format(format)} – ${range.through.format(format)}", color = MutedGold, style = MaterialTheme.typography.bodySmall)
            when (val data = state) {
                HizbOverviewState.Loading -> LinearProgressIndicator(Modifier.fillMaxWidth())
                HizbOverviewState.Error -> {
                    Text(hizbText(language, "loadError"), color = MaterialTheme.colorScheme.error)
                    TextButton(onClick = model::retry) { Text(hizbText(language, "retry")) }
                }
                is HizbOverviewState.Ready -> {
                    if (data.counts.all { it.count == 0 }) Text(hizbText(language, "empty"), color = GoldLight)
                    else {
                        HizbBars(data.counts, language, expanded, selected) { selected = it }
                        selected?.let { number ->
                            Text("${hizbText(language, "hizb")} $number · ${data.counts[number - 1].count} ${hizbText(language, "count")}\n${data.range.from.format(format)} – ${data.range.through.format(format)}", color = GoldLight, style = MaterialTheme.typography.bodySmall)
                        }
                        Text(hizbText(language, "hint"), color = MutedGold, style = MaterialTheme.typography.bodySmall)
                        TextButton(onClick = { expanded = !expanded }) { Text(hizbText(language, if(expanded) "collapse" else "expand")) }
                    }
                }
            }
        }
    }
    if (custom) {
        var from by remember { mutableStateOf(range.from) }
        var through by remember { mutableStateOf(range.through) }
        val context = LocalContext.current
        val valid = !from.isAfter(through) && !through.isAfter(LocalDate.now())
        AlertDialog(onDismissRequest = { custom = false }, title = { Text(hizbText(language, "Custom")) }, text = {
            Column {
                listOf("from" to from, "through" to through).forEach { (key, date) ->
                    OutlinedButton(onClick = {
                        DatePickerDialog(localizedDialogContext(context, language), { _, y, m, d ->
                            val chosen = LocalDate.of(y, m + 1, d)
                            if (key == "from") from = chosen else through = chosen
                        }, date.year, date.monthValue - 1, date.dayOfMonth).apply { datePicker.maxDate = System.currentTimeMillis() }.show()
                    }) { Text("${hizbText(language, key)}: ${date.format(format)}") }
                }
                if (!valid) Text(hizbText(language, "invalid"), color = MaterialTheme.colorScheme.error)
            }
        }, confirmButton = { TextButton(enabled = valid, onClick = { model.range.value = HizbDateRange(from, through); period = HizbPeriod.Custom; selected = null; custom = false }) { Text(hizbText(language, "done")) } })
    }
}

@Composable
internal fun HizbBars(counts: List<HizbReadingCount>, language: String, expanded: Boolean, selected: Int?, onSelect: (Int) -> Unit) {
    val top = ((counts.maxOf { it.count }.coerceAtLeast(1) + 3) / 4) * 4
    val chartHeight = if (expanded) 280.dp else 150.dp
    // Keep numeric order left-to-right even within the Arabic interface.
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
        Row(Modifier.fillMaxWidth()) {
            Column(Modifier.width(32.dp).height(chartHeight), verticalArrangement = Arrangement.SpaceBetween) {
                (4 downTo 0).forEach { Text("${top * it / 4}", color = MutedGold, style = MaterialTheme.typography.labelSmall) }
            }
            LazyRow(Modifier.weight(1f).testTag("hizb_chart")) {
                items(counts, key = { it.hizbNumber }) { item ->
                    Column(Modifier.width(48.dp).testTag("hizb_bar_${item.hizbNumber}").clickable { onSelect(item.hizbNumber) }
                        .semantics { contentDescription = "${hizbText(language, "hizb")} ${item.hizbNumber}, ${item.count} ${hizbText(language, "count")}" }, horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(Modifier.height(chartHeight).fillMaxWidth(), contentAlignment = Alignment.BottomCenter) {
                            Box(Modifier.width(24.dp).height((chartHeight.value * item.count / top).coerceAtLeast(1f).dp).background(if(selected == item.hizbNumber) ReadBlue else Gold))
                        }
                        Text("${item.hizbNumber}", color = GoldLight, style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 6.dp))
                    }
                }
            }
        }
    }
}
