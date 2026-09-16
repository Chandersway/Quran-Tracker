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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.Ameender.qurantracker.data.QuranChapter
import com.Ameender.qurantracker.data.QuranDatabaseHelper
import com.Ameender.qurantracker.data.TranslationAyah
import com.Ameender.qurantracker.data.TranslationRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun TranslationScreen(appLanguage: String = "nl") {
    val strings = remember(appLanguage) { translationScreenStrings(appLanguage) }
    val context = LocalContext.current
    val dbHelper = remember { QuranDatabaseHelper(context) }
    val translationRepository = remember { TranslationRepository(context) }
    val chapters by produceState<List<QuranChapter>>(initialValue = emptyList()) {
        value = withContext(Dispatchers.IO) { dbHelper.getAllChapters() }
    }

    var selectedChapter by remember { mutableStateOf<QuranChapter?>(null) }
    var selectedTranslation by remember { mutableStateOf(TranslationRepository.sources.first()) }
    var translationMenuOpen by remember { mutableStateOf(false) }
    var surahMenuOpen by remember { mutableStateOf(false) }
    var ayahFromInput by remember { mutableStateOf("1") }

    LaunchedEffect(chapters) {
        if (selectedChapter == null && chapters.isNotEmpty()) {
            selectedChapter = chapters.first()
        }
    }

    val chapter = selectedChapter
    val ayahFrom = ayahFromInput.toIntOrNull()
    val safeRange = if (chapter != null && ayahFrom != null) {
        val from = ayahFrom.coerceIn(1, chapter.versesCount)
        from to chapter.versesCount
    } else {
        null
    }

    val translations by produceState<List<TranslationAyah>>(
        initialValue = emptyList(),
        key1 = selectedTranslation.id,
        key2 = chapter?.id,
        key3 = safeRange
    ) {
        value = if (chapter != null && safeRange != null) {
            withContext(Dispatchers.IO) {
                translationRepository.getTranslations(
                    source = selectedTranslation,
                    surahId = chapter.id,
                    ayahFrom = safeRange.first,
                    ayahTo = safeRange.second
                )
            }
        } else {
            emptyList()
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
                    strings.title,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = GoldLight
                )
                Text(
                    strings.subtitle,
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
                            onClick = { translationMenuOpen = true },
                            modifier = Modifier.fillMaxWidth().height(54.dp),
                            shape = RoundedCornerShape(AppShape.control),
                            border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight),
                            contentPadding = PaddingValues(horizontal = 12.dp)
                        ) {
                            Icon(Icons.Default.Translate, contentDescription = null, tint = Gold)
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
                                        ayahFromInput = "1"
                                        surahMenuOpen = false
                                    }
                                )
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        TranslationRangeField(
                            value = ayahFromInput,
                            label = strings.fromAyah,
                            onValueChange = { ayahFromInput = it },
                            modifier = Modifier.weight(1f)
                        )
                        Surface(
                            modifier = Modifier.weight(1f).height(64.dp),
                            color = DeepNavy,
                            shape = RoundedCornerShape(AppShape.control),
                            border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy)
                        ) {
                            Column(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                                verticalArrangement = Arrangement.Center
                            ) {
                                Text(strings.toAyah, fontSize = 12.sp, color = MutedGold)
                                Text(
                                    chapter?.versesCount?.toString().orEmpty(),
                                    fontSize = 16.sp,
                                    color = GoldLight,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    chapter?.let {
                        Text(
                            strings.rangeHint.format(it.versesCount),
                            fontSize = 11.sp,
                            color = MutedGold
                        )
                    }
                }
            }
        }

        if (translations.isEmpty()) {
            item {
                QuranEmptyState(title = strings.invalidRange)
            }
        } else {
            items(translations, key = { "${it.surahId}:${it.ayahNumber}" }) { ayah ->
                TranslationAyahCard(
                    reference = "${chapter?.nameAr.orEmpty()} ${ayah.surahId}:${ayah.ayahNumber}",
                    text = ayah.text
                )
            }
        }
    }
}

private data class TranslationScreenStrings(
    val title: String,
    val subtitle: String,
    val fromAyah: String,
    val toAyah: String,
    val rangeHint: String,
    val invalidRange: String
)

private fun translationScreenStrings(language: String): TranslationScreenStrings {
    return when (language) {
        "en" -> TranslationScreenStrings(
            title = "Translation",
            subtitle = "Read a surah from any ayah until the final ayah",
            fromAyah = "From ayah",
            toAyah = "To ayah",
            rangeHint = "This always continues to the final ayah: %s",
            invalidRange = "Choose a valid starting ayah."
        )
        "ar" -> TranslationScreenStrings(
            title = "الترجمة",
            subtitle = "اقرأ السورة من أي آية حتى آخر آية",
            fromAyah = "من الآية",
            toAyah = "إلى الآية",
            rangeHint = "يستمر دائما حتى آخر آية: %s",
            invalidRange = "اختر آية بداية صحيحة."
        )
        "fr" -> TranslationScreenStrings(
            title = "Traduction",
            subtitle = "Lis une sourate depuis une ayah jusqu'a la derniere",
            fromAyah = "Depuis l'ayah",
            toAyah = "Jusqu'a l'ayah",
            rangeHint = "Cela continue toujours jusqu'a la derniere ayah : %s",
            invalidRange = "Choisis une ayah de depart valide."
        )
        else -> TranslationScreenStrings(
            title = "Vertaling",
            subtitle = "Lees een soera vanaf een ayah tot en met de laatste ayah",
            fromAyah = "Van ayah",
            toAyah = "Tot ayah",
            rangeHint = "Dit loopt altijd door tot de laatste ayah: %s",
            invalidRange = "Kies een geldige start-ayah."
        )
    }
}

@Composable
private fun TranslationRangeField(
    value: String,
    label: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = value,
        onValueChange = { input -> onValueChange(input.filter { it.isDigit() }.take(3)) },
        modifier = modifier,
        singleLine = true,
        label = { Text(label) },
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
}

@Composable
private fun TranslationAyahCard(reference: String, text: String) {
    SelectionContainer {
        QuranAyahCard(reference = reference, text = text)
    }
}
