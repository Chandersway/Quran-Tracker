package com.Ameender.qurantracker.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun RepeatSelectionSheet(
    surah: Int, page: Int?, warsh: Boolean, text: AppStrings,
    player: GlobalAudioPlayer, initialAyah: Int? = null, onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var selection by rememberSaveable { mutableStateOf(if (initialAyah != null) "ayahs" else if (page != null) "page" else "surah") }
    var rounds by rememberSaveable { mutableIntStateOf(2) }
    var first by rememberSaveable { mutableStateOf((initialAyah ?: 1).toString()) }
    var last by rememberSaveable { mutableStateOf((initialAyah ?: 1).toString()) }
    var firstPage by rememberSaveable { mutableStateOf((page ?: 1).toString()) }
    var lastPage by rememberSaveable { mutableStateOf((page ?: 1).toString()) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    val reciters = remember(warsh) { repeatReciterOptions(warsh) }
    var reciterId by rememberSaveable(warsh) { mutableStateOf(reciters.first().id) }
    val reciter = reciters.firstOrNull { it.id == reciterId } ?: reciters.first()
    var reciterMenuOpen by remember { mutableStateOf(false) }
    val chapter = ALL_SURAHS.first { it.id == surah }
    val bridge by produceState<JSONObject?>(null, warsh) {
        if (warsh) value = withContext(Dispatchers.IO) {
            context.assets.open("warsh_ayah_map.json").bufferedReader().use { JSONObject(it.readText()).getJSONObject("chapters") }
        }
    }
    val maxAyah = if (warsh) bridge?.getJSONArray(surah.toString())?.length() else chapter.ayahs
    val validRange = first.toIntOrNull()?.let { a -> last.toIntOrNull()?.let { b -> a >= 1 && b >= a && b <= (maxAyah ?: 0) } } == true
    val validPages = validRepeatPageRange(firstPage, lastPage)
    val title = when (selection) {
        "page" -> text.t("repeat.page", page ?: "")
        "pages" -> text.t("repeat.pagesRange", firstPage, lastPage)
        "ayahs" -> "${chapter.name} · ${text.t("repeat.range", first, last)}"
        else -> chapter.name
    }
    ModalBottomSheet(onDismissRequest = { if (!busy) onDismiss() },
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = MidNavy, contentColor = GoldLight) {
        Column(Modifier.testTag("repeat_sheet").fillMaxWidth().verticalScroll(rememberScrollState()).imePadding()
            .navigationBarsPadding().padding(horizontal = 24.dp).padding(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(text.t("repeat.title"), style = MaterialTheme.typography.headlineSmall, color = GoldLight)
                Text("${chapter.arabic} · ${if (warsh) "Warsh" else "Hafs"}", color = MutedGold)
            }
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(text.t("repeat.selection"), style = MaterialTheme.typography.labelLarge)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOfNotNull(if (page != null) "page" to text.t("repeat.page", page) else null,
                        if (page != null) "pages" to text.t("repeat.pages") else null,
                        "surah" to chapter.name, "ayahs" to text.t("repeat.ayahs")).forEach { (id, label) ->
                        FilterChip(selected = selection == id, enabled = !busy, onClick = { selection = id; error = false },
                            colors = FilterChipDefaults.filterChipColors(containerColor = DeepNavy, labelColor = GoldLight,
                                selectedContainerColor = Gold, selectedLabelColor = DarkNavy),
                            border = FilterChipDefaults.filterChipBorder(enabled = !busy, selected = selection == id,
                                borderColor = BorderNavy, selectedBorderColor = Gold), label = { Text(label) })
                    }
                }
                if (selection == "pages") {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedTextField(value = firstPage, onValueChange = { firstPage = it.filter(Char::isDigit).take(3); error = false },
                            label = { Text(text.t("repeat.fromPage")) }, modifier = Modifier.weight(1f), singleLine = true,
                            enabled = !busy, isError = !validPages, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                        OutlinedTextField(value = lastPage, onValueChange = { lastPage = it.filter(Char::isDigit).take(3); error = false },
                            label = { Text(text.t("repeat.toPage")) }, modifier = Modifier.weight(1f), singleLine = true,
                            enabled = !busy, isError = !validPages, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                    }
                    Text(text.t(if (validPages) "repeat.pagesHint" else "repeat.pagesInvalid"),
                        style = MaterialTheme.typography.bodySmall, color = if (validPages) MutedGold else MaterialTheme.colorScheme.error)
                }
                if (selection == "ayahs") {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedTextField(value = first, onValueChange = { first = it.filter(Char::isDigit).take(3) },
                            label = { Text(text.t("repeat.from")) }, modifier = Modifier.weight(1f), singleLine = true,
                            enabled = !busy, isError = !validRange, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                        OutlinedTextField(value = last, onValueChange = { last = it.filter(Char::isDigit).take(3) },
                            label = { Text(text.t("repeat.to")) }, modifier = Modifier.weight(1f), singleLine = true,
                            enabled = !busy, isError = !validRange, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                    }
                    Text("1–${maxAyah ?: "…"}", style = MaterialTheme.typography.bodySmall, color = MutedGold)
                }
            }
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(text.t("repeat.count"), style = MaterialTheme.typography.labelLarge)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(2, 3, 5, 0).forEach { count ->
                        FilterChip(selected = rounds == count, enabled = !busy, onClick = { rounds = count },
                            colors = FilterChipDefaults.filterChipColors(containerColor = DeepNavy, labelColor = GoldLight,
                                selectedContainerColor = Gold, selectedLabelColor = DarkNavy),
                            border = FilterChipDefaults.filterChipBorder(enabled = !busy, selected = rounds == count,
                                borderColor = BorderNavy, selectedBorderColor = Gold),
                            label = { Text(if (count == 0) text.t("repeat.forever") else "$count×") })
                    }
                }
            }
            Box {
                Surface(onClick = { reciterMenuOpen = true }, enabled = !busy,
                    modifier = Modifier.fillMaxWidth().testTag("repeat_reciter_selector"),
                    color = DeepNavy, shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, BorderNavy)) {
                    Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Icon(Icons.Default.Headphones, contentDescription = null, tint = Gold)
                        Column(Modifier.weight(1f)) {
                            Text(text.t("repeat.reciter"), style = MaterialTheme.typography.labelMedium, color = MutedGold)
                            Text(reciter.displayName(), color = GoldLight)
                        }
                        Text("▾", color = GoldLight)
                    }
                }
                DropdownMenu(expanded = reciterMenuOpen, onDismissRequest = { reciterMenuOpen = false }) {
                    reciters.forEach { option ->
                        DropdownMenuItem(text = { Text(option.displayName()) },
                            modifier = Modifier.testTag("repeat_reciter_${option.id}"),
                            onClick = { reciterId = option.id; reciterMenuOpen = false; error = false },
                            leadingIcon = if (option.id == reciter.id) {{ Text("✓") }} else null)
                    }
                }
            }
            Text(text.t("repeat.whole"), style = MaterialTheme.typography.bodySmall, color = MutedGold)
            if (error) Text(text.t("repeat.error"), color = MaterialTheme.colorScheme.error)
            Button(enabled = !busy && maxAyah != null && (selection != "ayahs" || validRange) &&
                (selection != "pages" || (page != null && validPages)),
                modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = DarkNavy),
                shape = RoundedCornerShape(16.dp), onClick = {
                    busy = true
                    scope.launch {
                        val result = runCatching {
                            withContext(Dispatchers.IO) {
                                val printed = if (selection == "page" || selection == "pages") {
                                    val pages = if (selection == "pages") {
                                        require(validRepeatPageRange(firstPage, lastPage))
                                        firstPage.toInt()..lastPage.toInt()
                                    } else requireNotNull(page)..page
                                    loadRepeatPageReferences(context, pages, warsh)
                                } else {
                                    val range = if (selection == "ayahs") first.toInt()..last.toInt() else 1..requireNotNull(maxAyah)
                                    range.map { surah to it }
                                }
                                val refs = printed.flatMap { (s, a) ->
                                    (if (warsh && reciter.timingReadId == null) WarshAyahReferences.hafsAyahs(context, s, a) else listOf(a)).map { s to it }
                                }.distinct().sortedWith(compareBy({ it.first }, { it.second }))
                                require(refs.isNotEmpty())
                                val timings = if (reciter.timingReadId != null) refs.map { it.first }.distinct().associateWith { s ->
                                    loadRepeatTimings(reciter, s, requireNotNull(bridge).getJSONArray(s.toString()).length())
                                } else emptyMap()
                                refs.map { (s, a) ->
                                    val info = ALL_SURAHS.first { it.id == s }
                                    val clip = timings[s]?.single { it.ayah == a }
                                    AudioTrack(s, info.name, info.arabic, a,
                                        reciter.displayName(), if (clip == null) reciter.ayahUrl(s, a) else reciter.surahAudioUrl(s),
                                        clip?.start ?: 0, clip?.end)
                                }
                            }
                        }
                        busy = false
                        result.onSuccess { player.playSelection(it, title, rounds); onDismiss() }.onFailure { error = true }
                    }
                }) {
                if (busy) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = DarkNavy)
                else { Icon(Icons.Default.PlayArrow, contentDescription = null); Spacer(Modifier.width(8.dp)); Text(text.t("repeat.start")) }
            }
        }
    }
}
