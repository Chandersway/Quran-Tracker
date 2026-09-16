package com.Ameender.qurantracker.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CompareArrows
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.Ameender.qurantracker.data.MutashabihatGroup
import com.Ameender.qurantracker.data.MutashabihatRepository
import com.Ameender.qurantracker.data.MutashabihatSequence
import com.Ameender.qurantracker.data.QuranDatabaseHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private data class MutashabihatText(
    val title: String,
    val intro: String,
    val searchHint: String,
    val all: String,
    val matches: String,
    val source: String,
    val noResults: String,
    val openAyah: String,
    val context: String,
    val attribution: String
)

private fun mutashabihatText(language: String) = when (language) {
    "en" -> MutashabihatText(
        "Mutashabihat", "Compare similar Quran verses while memorising.",
        "Search surah or verse (for example 2:15)", "All", "similar passages",
        "Starting verse", "No matching verses found.", "Open in Mushaf", "extra context verses",
        "Data: Quran Mutashabihat Data by Waqar144"
    )
    "ar" -> MutashabihatText(
        "المتشابهات", "قارن بين الآيات المتشابهة أثناء الحفظ.",
        "ابحث بالسورة أو الآية (مثال 2:15)", "الكل", "مواضع متشابهة",
        "الآية الأصلية", "لم يتم العثور على نتائج.", "فتح في المصحف", "آيات إضافية للسياق",
        "البيانات: Quran Mutashabihat Data من Waqar144"
    )
    "fr" -> MutashabihatText(
        "Mutashabihat", "Comparez les versets similaires pendant la mémorisation.",
        "Rechercher une sourate ou un verset (ex. 2:15)", "Tous", "passages similaires",
        "Verset de départ", "Aucun verset correspondant.", "Ouvrir dans le Moushaf", "versets de contexte",
        "Données : Quran Mutashabihat Data par Waqar144"
    )
    else -> MutashabihatText(
        "Mutashābihāt", "Vergelijk verzen die op elkaar lijken tijdens het memoriseren.",
        "Zoek op soera of āyah (bijvoorbeeld 2:15)", "Alle", "vergelijkbare passages",
        "Start-āyah", "Geen overeenkomende āyāt gevonden.", "Open in mushaf", "extra contextverzen",
        "Data: Quran Mutashabihat Data van Waqar144"
    )
}

@Composable
fun MutashabihatScreen(
    appLanguage: String,
    onOpenAyah: (surahId: Int, ayahNumber: Int) -> Unit
) {
    val context = LocalContext.current
    val strings = remember(appLanguage) { mutashabihatText(appLanguage) }
    val repository = remember { MutashabihatRepository(context.applicationContext) }
    val database = remember { QuranDatabaseHelper(context.applicationContext) }
    var selectedJuz by rememberSaveable { mutableIntStateOf(0) }
    var query by rememberSaveable { mutableStateOf("") }

    val groups by produceState<List<MutashabihatGroup>?>(initialValue = null, repository) {
        value = withContext(Dispatchers.IO) { repository.loadGroups() }
    }
    val filteredGroups = remember(groups, selectedJuz, query) {
        val normalizedQuery = query.trim().lowercase()
        groups.orEmpty().filter { group ->
            (selectedJuz == 0 || group.juz == selectedJuz) &&
                (normalizedQuery.isBlank() || group.searchTerms().contains(normalizedQuery))
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(DarkNavy),
        contentPadding = PaddingValues(horizontal = AppSpacing.screen, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(color = Gold.copy(alpha = 0.14f), shape = MaterialTheme.shapes.medium) {
                    Icon(
                        Icons.Default.CompareArrows,
                        contentDescription = null,
                        tint = Gold,
                        modifier = Modifier.padding(10.dp)
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(strings.title, color = GoldLight, fontWeight = FontWeight.Bold, fontSize = 22.sp)
                    Text(strings.intro, color = MutedGold, fontSize = 12.sp)
                }
            }
        }
        item {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                leadingIcon = { Icon(Icons.Default.Search, null) },
                placeholder = { Text(strings.searchHint, fontSize = 13.sp) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = GoldLight,
                    unfocusedTextColor = GoldLight,
                    focusedBorderColor = Gold,
                    unfocusedBorderColor = BorderNavy,
                    focusedLeadingIconColor = Gold,
                    unfocusedLeadingIconColor = MutedGold,
                    focusedPlaceholderColor = MutedGold,
                    unfocusedPlaceholderColor = MutedGold
                )
            )
        }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                item {
                    FilterChip(
                        selected = selectedJuz == 0,
                        onClick = { selectedJuz = 0 },
                        label = { Text(strings.all) }
                    )
                }
                items((1..30).toList()) { juz ->
                    FilterChip(
                        selected = selectedJuz == juz,
                        onClick = { selectedJuz = juz },
                        label = { Text("Juz $juz") }
                    )
                }
            }
        }

        when {
            groups == null -> item {
                Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Gold)
                }
            }
            filteredGroups.isEmpty() -> item {
                Text(
                    strings.noResults,
                    modifier = Modifier.fillMaxWidth().padding(vertical = 40.dp),
                    textAlign = TextAlign.Center,
                    color = MutedGold
                )
            }
            else -> itemsIndexed(
                items = filteredGroups,
                key = { index, group -> "${group.juz}-${group.source.first.absoluteAyah}-$index" }
            ) { _, group ->
                MutashabihatCard(group, database, strings, onOpenAyah)
            }
        }

        item {
            Text(
                strings.attribution,
                color = MutedGold,
                fontSize = 11.sp,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(MutashabihatRepository.SOURCE_URL)))
                    }
                    .padding(vertical = 14.dp),
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun MutashabihatCard(
    group: MutashabihatGroup,
    database: QuranDatabaseHelper,
    strings: MutashabihatText,
    onOpenAyah: (Int, Int) -> Unit
) {
    var expanded by rememberSaveable(group.source.first.absoluteAyah) { mutableStateOf(false) }
    Card(
        colors = CardDefaults.cardColors(containerColor = MidNavy),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(horizontal = 13.dp, vertical = 11.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Juz ${group.juz} · ${group.source.referenceLabel()}", color = Gold, fontWeight = FontWeight.SemiBold)
                    Text("${group.matches.size} ${strings.matches}", color = MutedGold, fontSize = 11.sp)
                }
                IconButton(onClick = { expanded = !expanded }) {
                    Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, null, tint = GoldLight)
                }
            }
            SequenceRow(group.source, database, strings.source, strings.openAyah, onOpenAyah)
            if (group.contextAyahs > 0) {
                Text("+${group.contextAyahs} ${strings.context}", color = MutedGold, fontSize = 10.sp)
            }
            if (expanded) {
                group.matches.forEachIndexed { index, match ->
                    Surface(color = DarkNavy.copy(alpha = 0.72f), shape = MaterialTheme.shapes.medium) {
                        SequenceRow(match, database, "${index + 1}", strings.openAyah, onOpenAyah)
                    }
                }
            } else {
                AssistChip(
                    onClick = { expanded = true },
                    label = { Text("${group.matches.size} ${strings.matches}") },
                    leadingIcon = { Icon(Icons.Default.CompareArrows, null) }
                )
            }
        }
    }
}

@Composable
private fun SequenceRow(
    sequence: MutashabihatSequence,
    database: QuranDatabaseHelper,
    prefix: String,
    openLabel: String,
    onOpenAyah: (Int, Int) -> Unit
) {
    val arabic by produceState(initialValue = "", sequence.ayahs.map { it.absoluteAyah }) {
        value = withContext(Dispatchers.IO) {
            sequence.ayahs.joinToString(" ﴿ ﴾ ") { location ->
                database.getAyahText(location.surahId, location.ayahNumber)
            }
        }
    }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onOpenAyah(sequence.first.surahId, sequence.first.ayahNumber) }
            .padding(horizontal = 10.dp, vertical = 9.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("$prefix · ${sequence.referenceLabel()}", color = Gold, fontSize = 12.sp, modifier = Modifier.weight(1f))
            Icon(Icons.Default.MenuBook, openLabel, tint = Gold, modifier = Modifier.padding(start = 8.dp))
        }
        if (arabic.isNotBlank()) {
            Text(
                arabic,
                modifier = Modifier.fillMaxWidth(),
                color = GoldLight,
                fontSize = 18.sp,
                lineHeight = 31.sp,
                textAlign = TextAlign.End
            )
        }
    }
}

private fun MutashabihatGroup.searchTerms(): String = buildString {
    append("juz $juz ")
    (listOf(source) + matches).forEach { sequence ->
        sequence.ayahs.forEach { location ->
            val surah = ALL_SURAHS.getOrNull(location.surahId - 1)
            append("${location.surahId}:${location.ayahNumber} ")
            append(surah?.name.orEmpty().lowercase()).append(' ')
            append(surah?.arabic.orEmpty()).append(' ')
        }
    }
}

private fun MutashabihatSequence.referenceLabel(): String {
    val start = first
    val surah = ALL_SURAHS.getOrNull(start.surahId - 1)
    val name = surah?.name ?: "Soera ${start.surahId}"
    val sameSurah = ayahs.all { it.surahId == start.surahId }
    return if (ayahs.size > 1 && sameSurah) {
        "$name ${start.surahId}:${start.ayahNumber}–${ayahs.last().ayahNumber}"
    } else if (ayahs.size > 1) {
        ayahs.joinToString(" · ") { "${it.surahId}:${it.ayahNumber}" }
    } else {
        "$name ${start.surahId}:${start.ayahNumber}"
    }
}
