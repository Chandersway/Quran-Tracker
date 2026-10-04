package com.Ameender.qurantracker.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun HizbMultiSelect(selected: Set<Int>, language: String, enabled: Boolean, onOpen: () -> Unit) {
    val label = when(selected.size) {
        0 -> hizbText(language, "chooseMultiple")
        else -> "${hizbText(language, "chooseMultiple")} · ${selected.size} ${hizbText(language, "selected")}"
    }
    OutlinedButton(onClick = onOpen, enabled = enabled, modifier = Modifier.fillMaxWidth().testTag("hizb_selector")) {
        Text(label, Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text("▾")
    }
}

/** Must be hosted outside AlertDialog, whose window constrains nested modal sheets. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun HizbSelectionSheet(selected: Set<Int>, language: String, onChange: (Set<Int>) -> Unit, onDismiss: () -> Unit) {
    val maxHeight = (LocalConfiguration.current.screenHeightDp * 0.8f).dp.coerceAtMost(560.dp)
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = MidNavy, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)) {
        Column(Modifier.fillMaxWidth().heightIn(max = maxHeight).padding(horizontal = 20.dp)) {
            Text(hizbText(language, "selector"), style = MaterialTheme.typography.titleLarge, color = GoldLight)
            LazyColumn(Modifier.fillMaxWidth().weight(1f, fill = false).testTag("hizb_options")) {
                items((1..60).toList(), key = { it }) { number ->
                    Row(Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("hizb_option_$number")
                        .toggleable(selected.contains(number), role = Role.Checkbox, onValueChange = {
                            onChange(if (it) selected + number else selected - number)
                        }), verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = number in selected, onCheckedChange = null)
                        Text("${hizbText(language, "hizb")} $number", color = GoldLight)
                    }
                }
            }
            Text("${selected.size} ${hizbText(language, "selected")}", color = GoldLight)
            Button(onClick = onDismiss, modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp).testTag("hizb_selection_done")) { Text(hizbText(language, "done")) }
        }
    }
}
