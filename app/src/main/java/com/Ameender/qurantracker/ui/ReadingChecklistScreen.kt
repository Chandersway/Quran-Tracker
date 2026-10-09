package com.Ameender.qurantracker.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.Ameender.qurantracker.data.*
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch

@Composable
fun ReadingChecklistScreen(language: String, onRead: (QuranStart) -> Unit) {
    val context = LocalContext.current
    val store = remember { ReadingChecklistStore(context) }
    var state by remember { mutableStateOf<ReadingChecklistState?>(null) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    var mode by rememberSaveable { mutableStateOf("hizb") }
    var expanded by rememberSaveable { mutableStateOf(0) }
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) { state = store.load() }
    fun update(change: (ReadingChecklistState) -> ReadingChecklistState) {
        if (busy) return
        busy = true
        scope.launch {
            try { state = store.update(change); error = false }
            catch (cancel: CancellationException) { throw cancel }
            catch (_: Exception) { error = true }
            finally { busy = false }
        }
    }
    val current = state
    if (current == null) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        return
    }
    ReadingChecklistContent(current, language, mode, expanded, busy, error,
        onMode = { mode = it; expanded = 0 }, onExpand = { expanded = if (expanded == it) 0 else it },
        onCheck = { target, checked -> update { it.check(target, checked) } },
        onStop = { target -> update { it.stopAt(target) } }, onRead = onRead,
        onClearPosition = { update { it.clearPosition() } },
        onClearChecklist = { update { it.clearChecklist() } })
}

@Composable
internal fun ReadingChecklistContent(
    state: ReadingChecklistState, language: String, mode: String, expanded: Int, busy: Boolean, error: Boolean,
    onMode: (String) -> Unit, onExpand: (Int) -> Unit,
    onCheck: (QuranNoteTarget, Boolean) -> Unit, onStop: (QuranNoteTarget) -> Unit, onRead: (QuranStart) -> Unit,
    onClearPosition: () -> Unit = {}, onClearChecklist: () -> Unit = {}
) {
    fun t(key: String) = checklistText(language, key)
    var managing by remember { mutableStateOf(false) }
    var clearing by remember { mutableStateOf<String?>(null) }
    clearing?.let { action ->
        AlertDialog(onDismissRequest = { clearing = null },
            title = { Text(t(action)) },
            text = { Text(t(if (action == "clearPosition") "positionWarning" else "checklistWarning")) },
            confirmButton = { TextButton(enabled = !busy, onClick = {
                clearing = null
                if (action == "clearPosition") onClearPosition() else onClearChecklist()
            }) { Text(t("clear")) } },
            dismissButton = { TextButton(onClick = { clearing = null }) { Text(t("cancel")) } })
    }
    fun n(number: Int) = dailyGoalNumber(number, language)
    fun point(point: QuranStart): String {
        val surah = ALL_SURAHS.first { it.id == point.surah }
        return "${if (language == "ar") surah.arabic else surah.name} · ${n(point.surah)}:${n(point.ayah)}"
    }
    fun name(target: QuranNoteTarget): String = when (target.scope) {
        NoteScope.SURAH -> {
            val surah = ALL_SURAHS.first { it.id == target.number }
            "${n(target.number)} · ${if (language == "ar") surah.arabic else surah.name}"
        }
        NoteScope.RUB -> "${t("hizb")} ${n(target.hizbNumber!!)} · ${t("rub")} ${n(target.quarter!!)}"
        else -> "${t(target.scope.key)} ${n(target.number)}"
    }
    val partition = NoteScope.fromKey(mode)
    val listState = rememberLazyListState()
    // Only on initial opening / switching sections, not after a checkbox or position change.
    LaunchedEffect(mode) {
        val anchor = state.position?.let { ReadingChecklistMapping.point(ReadingChecklistMapping.range(it).last) }
            ?: QuranStart(1, 1)
        val hizb = ReadingChecklistMapping.hizbAt(anchor)
        val number = when (partition) { NoteScope.SURAH -> anchor.surah; NoteScope.JUZ -> (hizb + 1) / 2; else -> hizb }
        listState.scrollToItem(number - 1)
        if (expanded != number) onExpand(number)
    }
    Column(Modifier.fillMaxSize().background(DarkNavy).padding(horizontal = 16.dp)) {
        Surface(color = MidNavy, shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(t("here"), color = GoldLight, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                    Box {
                        IconButton(onClick = { managing = true }, enabled = !busy) {
                            Icon(Icons.Default.MoreVert, t("manage"), tint = MutedGold)
                        }
                        DropdownMenu(expanded = managing, onDismissRequest = { managing = false }) {
                            DropdownMenuItem(text = { Text(t("clearPosition")) }, enabled = state.position != null,
                                onClick = { managing = false; clearing = "clearPosition" })
                            DropdownMenuItem(text = { Text(t("clearChecklist")) }, enabled = state.readVerses.isNotEmpty(),
                                onClick = { managing = false; clearing = "clearChecklist" })
                        }
                    }
                }
                Text(state.position?.let { "${name(it)} · ${point(ReadingChecklistMapping.point(ReadingChecklistMapping.range(it).last))}" }
                    ?: t("empty"), color = SoftTextGold, style = MaterialTheme.typography.bodySmall)
                Text(state.next?.let { "${t("next")}: ${point(it)}" } ?: t("end"), color = MutedGold,
                    style = MaterialTheme.typography.bodySmall, modifier = Modifier.testTag("checklist-next"))
                state.next?.let { next ->
                    TextButton(onClick = { onRead(next) }, contentPadding = PaddingValues(horizontal = 0.dp)) {
                        Text(t("continue"), color = Gold)
                        Spacer(Modifier.width(8.dp))
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = Gold, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
        Text(t("help"), color = MutedGold, style = MaterialTheme.typography.bodySmall)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("hizb", "juz", "surah").forEach { key -> FilterChip(selected = mode == key,
                onClick = { onMode(key) }, label = { Text(t(key)) }) }
        }
        if (error) Text(t("error"), color = MaterialTheme.colorScheme.error)
        LazyColumn(state = listState, modifier = Modifier.weight(1f).testTag("reading-checklist"), contentPadding = PaddingValues(bottom = 24.dp)) {
            items((1..ReadingChecklistMapping.maximum(partition)).toList(), key = { "$mode:$it" }) { number ->
                val target = QuranNoteTarget(partition, number)
                Column {
                    ChecklistRow(target, name(target), if (partition == NoteScope.HIZB) "${t("juz")} ${n((number + 1) / 2)}" else point(QuranStructure.start(target)),
                        state, busy, language, onCheck, onStop, onRead,
                        expanded = expanded == number, onExpand = if (partition == NoteScope.SURAH) null else ({ onExpand(number) }))
                    if (expanded == number && partition != NoteScope.SURAH) {
                        val size = if (partition == NoteScope.JUZ) 8 else 4
                        for (rub in ((number - 1) * size + 1)..(number * size)) {
                            val child = QuranNoteTarget(NoteScope.RUB, rub)
                            Box(Modifier.padding(start = 16.dp)) {
                                ChecklistRow(child, name(child), point(QuranStructure.start(child)), state, busy, language,
                                    onCheck, onStop, onRead)
                            }
                        }
                    }
                    HorizontalDivider(color = BorderNavy.copy(alpha = 0.55f))
                }
            }
        }
    }
}

@Composable
private fun ChecklistRow(
    target: QuranNoteTarget, title: String, subtitle: String, state: ReadingChecklistState, busy: Boolean, language: String,
    onCheck: (QuranNoteTarget, Boolean) -> Unit, onStop: (QuranNoteTarget) -> Unit, onRead: (QuranStart) -> Unit,
    expanded: Boolean = false, onExpand: (() -> Unit)? = null
) {
    val checked = state.completed(target)
    val position = state.position == target
    Column(Modifier.fillMaxWidth().padding(vertical = 6.dp).testTag("part-${target.scope.key}-${target.number}")) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            TriStateCheckbox(state = when { checked -> ToggleableState.On; state.partial(target) -> ToggleableState.Indeterminate; else -> ToggleableState.Off },
                onClick = { onCheck(target, !checked) }, enabled = !busy,
                modifier = Modifier.semantics { contentDescription = "${checklistText(language, if (checked) "undo" else "check")}: $title" })
            Column(Modifier.weight(1f)) {
                Text(title, color = if (checked) DoneGreen else GoldLight, style = MaterialTheme.typography.titleSmall)
                Text(subtitle, color = MutedGold, style = MaterialTheme.typography.bodySmall)
            }
            if (onExpand != null) IconButton(onClick = onExpand) {
                Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, title, tint = MutedGold)
            }
        }
        Row(Modifier.padding(start = 48.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TextButton(onClick = { onStop(target) }, enabled = !busy && !position) {
                Text(checklistText(language, if (position) "saved" else "stop"), color = if (position) DoneGreen else Gold,
                    style = MaterialTheme.typography.labelMedium)
            }
            TextButton(onClick = { onRead(QuranStructure.start(target)) }) {
                Text(checklistText(language, "open"), color = MutedGold, style = MaterialTheme.typography.labelMedium)
            }
        }
    }
}
