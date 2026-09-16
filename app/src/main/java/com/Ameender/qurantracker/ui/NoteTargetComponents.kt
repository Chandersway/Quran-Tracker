package com.Ameender.qurantracker.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import com.Ameender.qurantracker.data.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

fun noteScopeLabel(scope: NoteScope, language: String = "nl"): String = when (scope) {
    NoteScope.JUZ -> if (language == "ar") "جزء" else "Juz"
    NoteScope.HIZB -> if (language == "ar") "حزب" else "Hizb"
    NoteScope.RUB -> if (language == "ar") "ربع" else "Rubʿ"
    NoteScope.SURAH -> if (language == "ar") "سورة" else "Surah"
    NoteScope.AYAH -> if (language == "ar") "آية" else "Ayah"
}
fun noteTargetTitle(target: QuranNoteTarget, language: String = "nl"): String = when (target.scope) {
    NoteScope.SURAH -> ALL_SURAHS.firstOrNull { it.id == target.number }?.let { if (language == "ar") it.arabic else it.name }.orEmpty()
    NoteScope.AYAH -> noteTargetTitle(target.copy(scope = NoteScope.SURAH, ayah = null), language) + " ${target.number}:${target.ayah ?: ""}"
    NoteScope.RUB -> "${noteScopeLabel(NoteScope.RUB, language)} ${target.quarter} · ${noteScopeLabel(NoteScope.HIZB, language)} ${target.hizbNumber}"
    else -> "${noteScopeLabel(target.scope, language)} ${target.number}"
}

@Composable
fun NoteCountButton(count: Int, label: String, onClick: () -> Unit) {
    TextButton(onClick = onClick, contentPadding = PaddingValues(horizontal = 6.dp),
        modifier = Modifier.heightIn(min = 48.dp)) {
        Icon(Icons.Default.EditNote, contentDescription = label, tint = Gold, modifier = Modifier.size(20.dp))
        if (count > 0) { Spacer(Modifier.width(3.dp)); Text(count.toString(), fontSize = 11.sp, color = GoldLight) }
    }
}

@Composable
fun NoteTargetSummary(target: QuranNoteTarget, language: String, showArabic: Boolean = true) {
    val context = LocalContext.current
    val valid = runCatching { target.validate() }.isSuccess
    val start = remember(target) { runCatching { QuranStructure.start(target) }.getOrNull() }
    var failed by remember(target) { mutableStateOf(false) }
    val arabic by produceState<String?>(null, start, showArabic) {
        value = if (start != null && showArabic) withContext(Dispatchers.IO) {
            runCatching { QuranDatabaseHelper(context).getAyahText(start.surah, start.ayah) }
                .onFailure { failed = true }.getOrNull()
        } else ""
    }
    if (!valid || start == null) {
        Text(if (language == "ar") "اختر مرجعا صالحا" else if (language == "en") "Choose a valid reference" else "Kies een geldige verwijzing", color = DeleteRed, fontSize = 12.sp)
        return
    }
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        val hierarchy = when (target.scope) {
            NoteScope.JUZ -> "Hizb ${target.number * 2 - 1}–${target.number * 2}"
            NoteScope.HIZB, NoteScope.RUB -> "Juz ${(target.hizbNumber!! + 1) / 2}"
            else -> ""
        }
        if (hierarchy.isNotBlank()) Text(hierarchy, color = MutedGold, fontSize = 11.sp)
        if (target.scope != NoteScope.AYAH) Text(
            (if (language == "ar") "البداية: " else if (language == "en") "Starts at: " else "Begint bij: ") +
                noteTargetTitle(QuranNoteTarget(NoteScope.AYAH, start.surah, start.ayah), language),
            color = Gold, fontSize = 12.sp)
        if (showArabic) when {
            failed -> Text(if (language == "en") "Preview unavailable" else if (language == "ar") "المعاينة غير متاحة" else "Voorbeeld niet beschikbaar", color = MutedGold, fontSize = 12.sp)
            arabic == null -> LinearProgressIndicator(Modifier.fillMaxWidth().height(2.dp), color = Gold)
            else -> Text(arabic.orEmpty(), color = SoftTextGold, fontSize = 18.sp, lineHeight = 29.sp, maxLines = 2,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                style = TextStyle(textDirection = TextDirection.Rtl), modifier = Modifier.fillMaxWidth())
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoteTargetSelector(target: QuranNoteTarget, language: String, chosen: Boolean = true, onChange: (QuranNoteTarget) -> Unit) {
    var picker by remember { mutableStateOf(false) }
    var query by remember { mutableStateOf("") }
    fun label(nl: String, en: String, ar: String) = when(language) { "en" -> en; "ar" -> ar; else -> nl }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(label("Notitie voor", "Note for", "ملاحظة عن"), color = GoldLight, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            NoteScope.entries.forEach { scope ->
                NotesChip(chosen && target.scope == scope, onClick = {
                    if (chosen && target.scope == scope) return@NotesChip
                    val next = when(scope) {
                        NoteScope.JUZ -> QuranNoteTarget(scope, target.hizbNumber?.let { (it + 1) / 2 } ?: 1)
                        NoteScope.HIZB -> QuranNoteTarget(scope, target.hizbNumber ?: if (target.scope == NoteScope.JUZ) target.number * 2 - 1 else 1)
                        NoteScope.RUB -> QuranNoteTarget(scope, ((target.hizbNumber ?: 1) - 1) * 4 + 1)
                        NoteScope.SURAH -> QuranNoteTarget(scope, if (target.scope == NoteScope.AYAH) target.number else 1)
                        NoteScope.AYAH -> QuranNoteTarget(scope, if (target.scope == NoteScope.SURAH) target.number else 1, 1)
                    }
                    onChange(next)
                }, label = { Text(noteScopeLabel(scope, language), fontSize = 12.sp) })
            }
        }
        if (chosen) {
        TextButton(onClick = { query = ""; picker = true }, contentPadding = PaddingValues(0.dp)) {
            val selection = if (target.scope == NoteScope.RUB) "Hizb ${target.hizbNumber}"
                else if (target.scope == NoteScope.AYAH) noteTargetTitle(target.copy(scope = NoteScope.SURAH, ayah = null), language)
                else noteTargetTitle(target, language)
            Text(selection, color = GoldLight, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
            Icon(Icons.Default.ArrowDropDown, label("Kies onderdeel", "Choose section", "اختر القسم"), tint = Gold)
        }
        if (target.scope == NoteScope.AYAH) {
            OutlinedTextField(value = target.ayah?.takeIf { it > 0 }?.toString().orEmpty(),
                onValueChange = { onChange(target.copy(ayah = it.filter(Char::isDigit).take(3).toIntOrNull())) },
                label = { Text("Ayah (1–${QuranStructure.verseCounts[target.number - 1]})") },
                singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(), colors = noteTextFieldColors())
        }
        if (target.scope == NoteScope.HIZB || target.scope == NoteScope.RUB) {
            Text(label("Niveau", "Level", "المستوى"), color = MutedGold, fontSize = 11.sp)
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                val hizb = target.hizbNumber!!
                NotesChip(target.scope == NoteScope.HIZB, { onChange(QuranNoteTarget(NoteScope.HIZB, hizb)) },
                    label = { Text(label("Hele Hizb", "Whole Hizb", "الحزب كاملا"), fontSize = 11.sp) })
                (1..4).forEach { quarter ->
                    NotesChip(target.quarter == quarter, { onChange(QuranNoteTarget(NoteScope.RUB, (hizb - 1) * 4 + quarter)) },
                        label = { Text("Rubʿ $quarter", fontSize = 11.sp) })
                }
            }
        }
        if (target.scope == NoteScope.JUZ) {
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                NotesChip(true, {}, label = { Text(label("Hele Juz", "Whole Juz", "الجزء كاملا"), fontSize = 11.sp) })
                (target.number * 2 - 1..target.number * 2).forEach { hizb ->
                    NotesChip(false, { onChange(QuranNoteTarget(NoteScope.HIZB, hizb)) }, label = { Text("Hizb $hizb", fontSize = 11.sp) })
                }
            }
        }
        NoteTargetSummary(target, language)
        }
    }
    if (picker) ModalBottomSheet(onDismissRequest = { picker = false }, containerColor = MidNavy) {
        Column(Modifier.fillMaxWidth().padding(horizontal = AppSpacing.screen)) {
            OutlinedTextField(query, { query = it }, modifier = Modifier.fillMaxWidth(), singleLine = true,
                leadingIcon = { Icon(Icons.Default.Search, null, tint = Gold) },
                placeholder = { Text(label("Zoek op naam of nummer", "Search name or number", "ابحث بالاسم أو الرقم")) },
                colors = noteTextFieldColors())
            val range = when(target.scope) { NoteScope.JUZ -> 1..30; NoteScope.HIZB, NoteScope.RUB -> 1..60; else -> 1..114 }
            LazyColumn(Modifier.heightIn(max = 420.dp), contentPadding = PaddingValues(vertical = 12.dp)) {
                items(range.filter { number ->
                    query.isBlank() || number.toString().contains(query) ||
                        (target.scope in listOf(NoteScope.SURAH, NoteScope.AYAH) && ALL_SURAHS.first { it.id == number }.let { it.name.contains(query, true) || it.arabic.contains(query) })
                }) { number ->
                    val choice = when(target.scope) {
                        NoteScope.RUB -> QuranNoteTarget(NoteScope.RUB, (number - 1) * 4 + (target.quarter ?: 1))
                        NoteScope.AYAH -> QuranNoteTarget(NoteScope.AYAH, number, 1)
                        else -> QuranNoteTarget(target.scope, number)
                    }
                    Text(if (target.scope == NoteScope.RUB) "Hizb $number" else noteTargetTitle(choice, language),
                        color = GoldLight, modifier = Modifier.fillMaxWidth().clickable { onChange(choice); picker = false }.padding(vertical = 16.dp),
                        fontSize = 14.sp)
                }
            }
        }
    }
}
