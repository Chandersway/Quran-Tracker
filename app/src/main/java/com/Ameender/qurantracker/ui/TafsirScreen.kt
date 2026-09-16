package com.Ameender.qurantracker.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.Ameender.qurantracker.data.QuranChapter
import com.Ameender.qurantracker.data.QuranDatabaseHelper
import com.Ameender.qurantracker.data.TranslationRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

private sealed class TafsirPageState {
    object Loading : TafsirPageState()
    data class Loaded(val text: String) : TafsirPageState()
    data class Error(val message: String) : TafsirPageState()
}

private data class ArabicTafsirOption(
    val name: String,
    val slug: String,
    val subtitle: String
)

private val ArabicTafsirOptions = listOf(
    ArabicTafsirOption("Tafsir al-Tabari", "ar-tafsir-al-tabari", "الطبري"),
    ArabicTafsirOption("Tafsir Ibn Kathir", "ar-tafsir-ibn-kathir", "ابن كثير"),
    ArabicTafsirOption("Tafsir as-Sa'di", "ar-tafseer-al-saddi", "السعدي"),
    ArabicTafsirOption("Tafsir al-Baghawi", "ar-tafsir-al-baghawi", "البغوي"),
    ArabicTafsirOption("Tafsir al-Qurtubi", "ar-tafseer-al-qurtubi", "القرطبي"),
    ArabicTafsirOption("Tafsir al-Muyassar", "ar-tafsir-muyassar", "الميسر"),
    ArabicTafsirOption("Tafsir al-Wasit", "ar-tafsir-al-wasit", "الوسيط"),
    ArabicTafsirOption("Tanwir al-Miqbas", "ar-tafseer-tanwir-al-miqbas", "تنوير المقباس")
)

@Composable
fun TafsirScreen() {
    val context = LocalContext.current
    val dbHelper = remember { QuranDatabaseHelper(context) }
    val translationRepository = remember { TranslationRepository(context) }
    val chapters by produceState<List<QuranChapter>>(initialValue = emptyList()) {
        value = withContext(Dispatchers.IO) { dbHelper.getAllChapters() }
    }
    var selectedChapter by remember { mutableStateOf<QuranChapter?>(null) }
    var selectedTafsir by remember { mutableStateOf(ArabicTafsirOptions.first()) }
    var selectedTranslation by remember { mutableStateOf(TranslationRepository.sources.first()) }
    var ayahInput by remember { mutableStateOf("1") }
    var tafsirMenuOpen by remember { mutableStateOf(false) }
    var translationMenuOpen by remember { mutableStateOf(false) }
    var surahMenuOpen by remember { mutableStateOf(false) }

    LaunchedEffect(chapters) {
        if (selectedChapter == null && chapters.isNotEmpty()) {
            selectedChapter = chapters.first()
            ayahInput = "1"
        }
    }

    val chapter = selectedChapter
    val selectedAyah = ayahInput.toIntOrNull()?.takeIf { current ->
        chapter != null && current in 1..chapter.versesCount
    }
    val ayahText by produceState(initialValue = "", key1 = chapter?.id, key2 = selectedAyah) {
        value = if (chapter != null && selectedAyah != null) {
            withContext(Dispatchers.IO) { dbHelper.getAyahText(chapter.id, selectedAyah) }
        } else {
            ""
        }
    }
    val translationText by produceState(
        initialValue = "",
        key1 = selectedTranslation.id,
        key2 = chapter?.id,
        key3 = selectedAyah
    ) {
        value = if (chapter != null && selectedAyah != null) {
            withContext(Dispatchers.IO) {
                translationRepository.getTranslation(selectedTranslation, chapter.id, selectedAyah)
            }
        } else {
            ""
        }
    }
    val tafsirState by produceState<TafsirPageState>(
        initialValue = TafsirPageState.Loading,
        key1 = selectedTafsir.slug,
        key2 = chapter?.id,
        key3 = selectedAyah
    ) {
        value = when {
            chapter == null -> TafsirPageState.Loading
            selectedAyah == null -> TafsirPageState.Error("Kies een geldig ayahnummer.")
            else -> withContext(Dispatchers.IO) {
                runCatching {
                    TafsirPageState.Loaded(loadArabicTafsir(selectedTafsir.slug, chapter.id, selectedAyah))
                }.getOrElse {
                    TafsirPageState.Error("Tafsir kon niet geladen worden. Controleer je internetverbinding.")
                }
            }
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkNavy),
        contentPadding = PaddingValues(AppSpacing.screen),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    "Tafsir",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = GoldLight
                )
                Text(
                    "Zoek en lees verschillende Arabische tafasir per ayah",
                    fontSize = 13.sp,
                    color = MutedGold
                )
            }
        }

        item {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = MidNavy,
                shape = RoundedCornerShape(AppShape.control),
                tonalElevation = 0.dp
            ) {
                Column(
                    modifier = Modifier.padding(AppSpacing.list),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedButton(
                            onClick = { tafsirMenuOpen = true },
                            modifier = Modifier.fillMaxWidth().height(54.dp),
                            shape = RoundedCornerShape(AppShape.control),
                            border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight),
                            contentPadding = PaddingValues(horizontal = 12.dp)
                        ) {
                            Icon(Icons.Default.MenuBook, contentDescription = null, tint = Gold)
                            Spacer(modifier = Modifier.width(8.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(selectedTafsir.name, maxLines = 1, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                Text(selectedTafsir.subtitle, maxLines = 1, fontSize = 11.sp, color = MutedGold)
                            }
                            Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = Gold)
                        }
                        DropdownMenu(
                            expanded = tafsirMenuOpen,
                            onDismissRequest = { tafsirMenuOpen = false }
                        ) {
                            ArabicTafsirOptions.forEach { option ->
                                DropdownMenuItem(
                                    text = {
                                        Column {
                                            Text(option.name)
                                            Text(option.subtitle, fontSize = 11.sp, color = MutedGold)
                                        }
                                    },
                                    onClick = {
                                        selectedTafsir = option
                                        tafsirMenuOpen = false
                                    }
                                )
                            }
                        }
                    }

                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedButton(
                            onClick = { translationMenuOpen = true },
                            modifier = Modifier.fillMaxWidth().height(54.dp),
                            shape = RoundedCornerShape(AppShape.control),
                            border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight),
                            contentPadding = PaddingValues(horizontal = 12.dp)
                        ) {
                            Icon(Icons.Default.MenuBook, contentDescription = null, tint = Gold)
                            Spacer(modifier = Modifier.width(8.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(selectedTranslation.name, maxLines = 1, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                Text(selectedTranslation.subtitle, maxLines = 1, fontSize = 11.sp, color = MutedGold)
                            }
                            Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = Gold)
                        }
                        DropdownMenu(
                            expanded = translationMenuOpen,
                            onDismissRequest = { translationMenuOpen = false }
                        ) {
                            TranslationRepository.sources.forEach { option ->
                                DropdownMenuItem(
                                    text = {
                                        Column {
                                            Text(option.name)
                                            Text(option.subtitle, fontSize = 11.sp, color = MutedGold)
                                        }
                                    },
                                    onClick = {
                                        selectedTranslation = option
                                        translationMenuOpen = false
                                    }
                                )
                            }
                        }
                    }

                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedButton(
                            onClick = { surahMenuOpen = true },
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            shape = RoundedCornerShape(AppShape.control),
                            border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight),
                            contentPadding = PaddingValues(horizontal = 12.dp)
                        ) {
                            Icon(Icons.Default.MenuBook, contentDescription = null, tint = Gold)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                chapter?.let { "${it.id}. ${it.nameAr}" } ?: "Soera laden...",
                                modifier = Modifier.weight(1f),
                                maxLines = 1
                            )
                            Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = Gold)
                        }
                        DropdownMenu(
                            expanded = surahMenuOpen,
                            onDismissRequest = { surahMenuOpen = false }
                        ) {
                            chapters.forEach { option ->
                                DropdownMenuItem(
                                    text = { Text("${option.id}. ${option.nameAr}") },
                                    onClick = {
                                        selectedChapter = option
                                        ayahInput = "1"
                                        surahMenuOpen = false
                                    }
                                )
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        IconButton(
                            enabled = selectedAyah != null && selectedAyah > 1,
                            onClick = { selectedAyah?.let { ayahInput = (it - 1).toString() } }
                        ) {
                            Icon(Icons.Default.KeyboardArrowLeft, contentDescription = "Vorige ayah", tint = Gold)
                        }
                        OutlinedTextField(
                            value = ayahInput,
                            onValueChange = { value ->
                                ayahInput = value.filter { it.isDigit() }.take(3)
                            },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            label = { Text("Ayah") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = GoldLight,
                                unfocusedTextColor = GoldLight,
                                focusedBorderColor = Gold,
                                unfocusedBorderColor = BorderNavy,
                                focusedLabelColor = Gold,
                                unfocusedLabelColor = MutedGold,
                                cursorColor = Gold
                            )
                        )
                        IconButton(
                            enabled = chapter != null && selectedAyah != null && selectedAyah < chapter.versesCount,
                            onClick = { selectedAyah?.let { ayahInput = (it + 1).toString() } }
                        ) {
                            Icon(Icons.Default.KeyboardArrowRight, contentDescription = "Volgende ayah", tint = Gold)
                        }
                    }
                    chapter?.let {
                        Text(
                            "1-${it.versesCount}",
                            modifier = Modifier.fillMaxWidth(),
                            textAlign = TextAlign.End,
                            fontSize = 11.sp,
                            color = MutedGold
                        )
                    }
                }
            }
        }

        if (ayahText.isNotBlank()) {
            item {
                TafsirTextPanel(
                    title = chapter?.let { "${it.nameAr} ${it.id}:$selectedAyah" } ?: "",
                    text = ayahText,
                    fontSize = 22
                )
            }
        }

        if (translationText.isNotBlank()) {
            item {
                TranslationTextPanel(
                    title = "${selectedTranslation.name} - ${selectedTranslation.subtitle}",
                    text = translationText
                )
            }
        }

        item {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = MidNavy,
                shape = RoundedCornerShape(AppShape.control),
                tonalElevation = 0.dp
            ) {
                Column(
                    modifier = Modifier.padding(AppSpacing.list),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(selectedTafsir.name, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    when (val state = tafsirState) {
                        TafsirPageState.Loading -> {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(24.dp),
                                    color = Gold,
                                    strokeWidth = 2.dp
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text("Laden...", color = SoftTextGold, fontSize = 13.sp)
                            }
                        }

                        is TafsirPageState.Loaded -> {
                            SelectionContainer {
                                Text(
                                    state.text,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .heightIn(min = 220.dp, max = 520.dp)
                                        .verticalScroll(rememberScrollState()),
                                    fontSize = 16.sp,
                                    lineHeight = 29.sp,
                                    color = SoftTextGold,
                                    textAlign = TextAlign.End
                                )
                            }
                        }

                        is TafsirPageState.Error -> {
                            Text(
                                state.message,
                                modifier = Modifier.fillMaxWidth().padding(vertical = 18.dp),
                                fontSize = 14.sp,
                                color = SoftTextGold,
                                textAlign = TextAlign.End
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TranslationTextPanel(title: String, text: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.control))
            .background(MidNavy)
            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
            .padding(AppSpacing.list),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(title, fontSize = 13.sp, color = MutedGold, modifier = Modifier.fillMaxWidth())
        SelectionContainer {
            Text(
                text,
                modifier = Modifier.fillMaxWidth(),
                fontSize = 16.sp,
                lineHeight = 27.sp,
                color = SoftTextGold
            )
        }
    }
}

@Composable
private fun TafsirTextPanel(title: String, text: String, fontSize: Int) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.control))
            .background(DeepNavy)
            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
            .padding(AppSpacing.list),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(title, fontSize = 13.sp, color = MutedGold, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.End)
        SelectionContainer {
            Text(
                text,
                modifier = Modifier.fillMaxWidth(),
                fontSize = fontSize.sp,
                lineHeight = (fontSize + 12).sp,
                color = GoldLight,
                textAlign = TextAlign.End
            )
        }
    }
}

private fun loadArabicTafsir(slug: String, surahId: Int, ayahNumber: Int): String {
    val url = URL(
        "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/" +
            "$slug/$surahId/$ayahNumber.json"
    )
    val connection = (url.openConnection() as HttpURLConnection).apply {
        connectTimeout = 12_000
        readTimeout = 12_000
        requestMethod = "GET"
    }
    return try {
        val statusCode = connection.responseCode
        if (statusCode !in 200..299) {
            error("Unexpected tafsir response: $statusCode")
        }
        val json = connection.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
        val text = JSONObject(json).optString("text").trim()
        if (text.isBlank()) error("Empty tafsir response")
        text
    } finally {
        connection.disconnect()
    }
}
