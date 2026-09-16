package com.Ameender.qurantracker.ui

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

private val PageMarkerRegex = Regex("PageV\\d{2}P\\d{3}")
private val HeadingRegex = Regex("###\\s*\\|+\\s*(.+)")

private data class BookDefinition(
    val id: String,
    val assetFile: String,
    val titleAr: String,
    val titleEn: String,
    val author: String,
    val summaryNl: String,
    val summaryEn: String,
    val summaryAr: String,
    val summaryFr: String
)

private data class BookPage(
    val pageNumber: Int,
    val marker: String,
    val chapterIndex: Int
)

private data class BookChapter(
    val title: String,
    val firstPageIndex: Int
)

private data class BookContent(
    val chapters: List<BookChapter>,
    val pages: List<BookPage>
)

private data class BookSearchResult(
    val pageIndex: Int,
    val title: String,
    val preview: String
)

data class BookMenuStrings(
    val title: String,
    val subtitle: String
)

private data class BookReaderStrings(
    val screenTitle: String,
    val bookLabel: String,
    val authorLabel: String,
    val biographyCollapsed: String,
    val biographyExpanded: String,
    val biography: String,
    val contents: String,
    val loadingBook: String,
    val pageLabel: String,
    val loading: String,
    val searchLabel: String,
    val searchPlaceholder: String,
    val searchResults: String,
    val noSearchResults: String
)

private val FiqhBooks = listOf(
    BookDefinition(
        id = "nawawi_minhaj",
        assetFile = "books/0676Nawawi.ManahijTalibin.txt",
        titleAr = "\u0645\u0646\u0647\u0627\u062c \u0627\u0644\u0637\u0627\u0644\u0628\u064a\u0646",
        titleEn = "Minhaj al-Talibin",
        author = "Imam al-Nawawi (631-676 AH / 1233-1277 CE)",
        summaryNl = "Shafi'i jurist en hadithgeleerde. Dit werk hoort bij de Shafi'i fiqh en werd een centraal handboek van de madhhab.",
        summaryEn = "Shafi'i jurist and hadith scholar. This work belongs to Shafi'i fiqh and became one of the central manuals of the madhhab.",
        summaryAr = "\u0641\u0642\u064a\u0647 \u0634\u0627\u0641\u0639\u064a \u0648\u0645\u062d\u062f\u062b\u060c \u0648\u0647\u0630\u0627 \u0627\u0644\u0643\u062a\u0627\u0628 \u0645\u0646 \u0645\u062a\u0648\u0646 \u0627\u0644\u0645\u0630\u0647\u0628 \u0627\u0644\u0634\u0627\u0641\u0639\u064a.",
        summaryFr = "Juriste shafi'i et savant du hadith. Ce livre appartient au fiqh shafi'i et fait partie des manuels centraux de cette ecole."
    ),
    BookDefinition(
        id = "shafii_umm",
        assetFile = "books/0204Shafici.Umm.txt",
        titleAr = "\u0627\u0644\u0623\u0645",
        titleEn = "al-Umm",
        author = "Imam Muhammad ibn Idris al-Shafi'i (150-204 AH / 767-820 CE)",
        summaryNl = "Een fundamenteel werk van Imam al-Shafi'i en een hoofdbron voor de Shafi'i wetschool.",
        summaryEn = "A foundational work by Imam al-Shafi'i and a major source for the Shafi'i school of law.",
        summaryAr = "\u0643\u062a\u0627\u0628 \u0623\u0633\u0627\u0633\u064a \u0644\u0644\u0625\u0645\u0627\u0645 \u0627\u0644\u0634\u0627\u0641\u0639\u064a \u0648\u0645\u0646 \u0623\u0647\u0645 \u0645\u0635\u0627\u062f\u0631 \u0627\u0644\u0645\u0630\u0647\u0628 \u0627\u0644\u0634\u0627\u0641\u0639\u064a.",
        summaryFr = "Ouvrage fondamental de l'imam al-Shafi'i et source majeure de l'ecole shafi'ie."
    ),
    BookDefinition(
        id = "ibn_muflih_furu",
        assetFile = "books/0763IbnMuflihHanbaliMuqaddasi.FurucWaTashihFuruc..txt",
        titleAr = "\u0627\u0644\u0641\u0631\u0648\u0639 \u0648\u062a\u0635\u062d\u064a\u062d \u0627\u0644\u0641\u0631\u0648\u0639",
        titleEn = "al-Furu' wa Tashih al-Furu'",
        author = "Ibn Muflih al-Hanbali (d. 763 AH / 1362 CE)",
        summaryNl = "Een belangrijk Hanbali fiqhwerk van Ibn Muflih, met bespreking en correctie van juridische vertakkingen.",
        summaryEn = "An important Hanbali fiqh work by Ibn Muflih, covering legal branches and their correction.",
        summaryAr = "\u0645\u0646 \u0643\u062a\u0628 \u0627\u0644\u0641\u0642\u0647 \u0627\u0644\u062d\u0646\u0628\u0644\u064a \u0627\u0644\u0645\u0647\u0645\u0629 \u0644\u0627\u0628\u0646 \u0645\u0641\u0644\u062d.",
        summaryFr = "Ouvrage important de fiqh hanbalite d'Ibn Muflih."
    ),
    BookDefinition(
        id = "qadi_abu_yala_masail",
        assetFile = "books/0458QadiAbuYacla.MasailFiqhyya.txt",
        titleAr = "\u0645\u0633\u0627\u0626\u0644 \u0641\u0642\u0647\u064a\u0629",
        titleEn = "Masa'il Fiqhiyya",
        author = "Qadi Abu Ya'la al-Hanbali (380-458 AH / 990-1066 CE)",
        summaryNl = "Hanbali fiqhvragen en juridische kwesties van Qadi Abu Ya'la.",
        summaryEn = "Hanbali legal questions and fiqh issues by Qadi Abu Ya'la.",
        summaryAr = "\u0645\u0633\u0627\u0626\u0644 \u0641\u0642\u0647\u064a\u0629 \u0639\u0644\u0649 \u0645\u0630\u0647\u0628 \u0627\u0644\u062d\u0646\u0627\u0628\u0644\u0629 \u0644\u0644\u0642\u0627\u0636\u064a \u0623\u0628\u064a \u064a\u0639\u0644\u0649.",
        summaryFr = "Questions juridiques hanbalites de Qadi Abu Ya'la."
    ),
    BookDefinition(
        id = "malik_muwatta",
        assetFile = "books/0179MalikIbnAnas.Muwatta.txt",
        titleAr = "\u0627\u0644\u0645\u0648\u0637\u0623",
        titleEn = "al-Muwatta'",
        author = "Imam Malik ibn Anas (93-179 AH / 711-795 CE)",
        summaryNl = "Vroeg werk van hadith en fiqh van Imam Malik, centraal voor de Maliki traditie.",
        summaryEn = "An early work of hadith and fiqh by Imam Malik, central to the Maliki tradition.",
        summaryAr = "\u0643\u062a\u0627\u0628 \u0645\u0628\u0643\u0631 \u0641\u064a \u0627\u0644\u062d\u062f\u064a\u062b \u0648\u0627\u0644\u0641\u0642\u0647 \u0644\u0644\u0625\u0645\u0627\u0645 \u0645\u0627\u0644\u0643.",
        summaryFr = "Ouvrage ancien de hadith et de fiqh de l'imam Malik, central dans la tradition malikite."
    ),
    BookDefinition(
        id = "ibn_abi_zayd_nawadir",
        assetFile = "books/0386IbnAbiZaydQayrawani.NawadirWaZiyadat.txt",
        titleAr = "\u0627\u0644\u0646\u0648\u0627\u062f\u0631 \u0648\u0627\u0644\u0632\u064a\u0627\u062f\u0627\u062a",
        titleEn = "al-Nawadir wa al-Ziyadat",
        author = "Ibn Abi Zayd al-Qayrawani (310-386 AH / 922-996 CE)",
        summaryNl = "Uitgebreid Maliki fiqhwerk van Ibn Abi Zayd al-Qayrawani.",
        summaryEn = "A major Maliki fiqh work by Ibn Abi Zayd al-Qayrawani.",
        summaryAr = "\u0645\u0646 \u0623\u0647\u0645 \u0643\u062a\u0628 \u0627\u0644\u0641\u0642\u0647 \u0627\u0644\u0645\u0627\u0644\u0643\u064a \u0644\u0627\u0628\u0646 \u0623\u0628\u064a \u0632\u064a\u062f \u0627\u0644\u0642\u064a\u0631\u0648\u0627\u0646\u064a.",
        summaryFr = "Important ouvrage de fiqh malikite d'Ibn Abi Zayd al-Qayrawani."
    ),
    BookDefinition(
        id = "ibn_qudama_mughni",
        assetFile = "books/0620IbnQudamaMaqdisi.MughniFiFiqh.txt",
        titleAr = "\u0627\u0644\u0645\u063a\u0646\u064a",
        titleEn = "al-Mughni",
        author = "Ibn Qudama al-Maqdisi (541-620 AH / 1147-1223 CE)",
        summaryNl = "Groot vergelijkend fiqhwerk van Ibn Qudama, sterk geworteld in de Hanbali school.",
        summaryEn = "A major comparative fiqh work by Ibn Qudama, rooted in the Hanbali school.",
        summaryAr = "\u0643\u062a\u0627\u0628 \u0641\u0642\u0647\u064a \u0645\u0642\u0627\u0631\u0646 \u0643\u0628\u064a\u0631 \u0644\u0627\u0628\u0646 \u0642\u062f\u0627\u0645\u0629 \u0627\u0644\u0645\u0642\u062f\u0633\u064a.",
        summaryFr = "Grand ouvrage de fiqh compare d'Ibn Qudama, enracine dans l'ecole hanbalite."
    )
)

@Composable
fun BookReaderScreen(appLanguage: String = "nl") {
    val strings = remember(appLanguage) { bookReaderStrings(appLanguage) }
    val context = LocalContext.current
    var selectedBook by remember { mutableStateOf(FiqhBooks.first()) }
    val book by produceState<BookContent?>(initialValue = null, key1 = selectedBook.id) {
        value = null
        value = withContext(Dispatchers.IO) { BookDatabase.loadBook(context, selectedBook) }
    }
    var selectedPageIndex by remember { mutableIntStateOf(0) }
    var bookMenuOpen by remember { mutableStateOf(false) }
    var chapterMenuOpen by remember { mutableStateOf(false) }
    var bioOpen by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }

    LaunchedEffect(selectedBook.id) {
        selectedPageIndex = 0
        searchQuery = ""
        chapterMenuOpen = false
        bookMenuOpen = false
    }

    val content = book
    val page = content?.pages?.getOrNull(selectedPageIndex)
    val chapter = page?.let { content.chapters.getOrNull(it.chapterIndex) }
    val pageText by produceState(initialValue = "", key1 = selectedBook.id, key2 = selectedPageIndex) {
        value = withContext(Dispatchers.IO) {
            BookDatabase.loadPageText(context, selectedBook.id, selectedPageIndex)
        }
    }
    val searchResults by produceState<List<BookSearchResult>>(
        initialValue = emptyList(),
        key1 = selectedBook.id,
        key2 = searchQuery,
        key3 = strings.pageLabel
    ) {
        value = withContext(Dispatchers.IO) {
            BookDatabase.search(context, selectedBook.id, searchQuery, strings.pageLabel)
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
            Column(verticalArrangement = Arrangement.spacedBy(BookReaderStyle.headerGap)) {
                Text(
                    selectedBook.titleAr,
                    modifier = Modifier.fillMaxWidth(),
                    fontSize = BookReaderStyle.titleSize,
                    fontWeight = FontWeight.Bold,
                    color = GoldLight,
                    textAlign = TextAlign.End
                )
                Text(
                    "${selectedBook.titleEn} - ${selectedBook.author}",
                    fontSize = BookReaderStyle.subtitleSize,
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
                    verticalArrangement = Arrangement.spacedBy(BookReaderStyle.authorGap)
                ) {
                    Text(strings.authorLabel, fontSize = BookReaderStyle.labelSize, color = MutedGold)
                    Text(
                        selectedBook.author,
                        fontSize = BookReaderStyle.subtitleSize,
                        color = GoldLight,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        selectedBook.summaryFor(appLanguage),
                        fontSize = BookReaderStyle.bodySize,
                        lineHeight = BookReaderStyle.bodyLineHeight,
                        color = SoftTextGold,
                        maxLines = if (bioOpen) Int.MAX_VALUE else 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        if (bioOpen) strings.biographyExpanded else strings.biographyCollapsed,
                        modifier = Modifier
                            .clip(RoundedCornerShape(AppShape.smallControl))
                            .background(DeepNavy)
                            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.smallControl))
                            .clickable { bioOpen = !bioOpen }
                            .padding(horizontal = 10.dp, vertical = 7.dp)
                            .align(Alignment.Start),
                        fontSize = BookReaderStyle.labelSize,
                        color = Gold
                    )
                }
            }
        }

        item {
            BookNavigationCard(
                selectedBook = selectedBook,
                bookMenuOpen = bookMenuOpen,
                content = content,
                page = page,
                chapter = chapter,
                selectedPageIndex = selectedPageIndex,
                chapterMenuOpen = chapterMenuOpen,
                strings = strings,
                onBookMenuOpenChange = { bookMenuOpen = it },
                onBookChange = { selectedBook = it },
                onChapterMenuOpenChange = { chapterMenuOpen = it },
                onPageChange = { selectedPageIndex = it }
            )
        }

        item {
            BookSearchCard(
                query = searchQuery,
                results = searchResults,
                strings = strings,
                onQueryChange = { searchQuery = it },
                onResultClick = {
                    selectedPageIndex = it.pageIndex
                    searchQuery = ""
                }
            )
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
                    verticalArrangement = Arrangement.spacedBy(BookReaderStyle.cardGap)
                ) {
                    Text(
                        chapter?.title.orEmpty(),
                        modifier = Modifier.fillMaxWidth(),
                        fontSize = BookReaderStyle.chapterTitleSize,
                        color = Gold,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.End
                    )
                    SelectionContainer {
                        Text(
                            pageText.ifBlank { strings.loadingBook },
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(
                                    min = BookReaderStyle.pageMinHeight,
                                    max = BookReaderStyle.pageMaxHeight
                                )
                                .verticalScroll(rememberScrollState()),
                            style = TextStyle(
                                fontSize = BookReaderStyle.pageTextSize,
                                lineHeight = BookReaderStyle.pageLineHeight,
                                textDirection = TextDirection.Rtl,
                                textAlign = TextAlign.End,
                                color = GoldLight
                            )
                        )
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(64.dp)) }
    }
}

@Composable
private fun BookNavigationCard(
    selectedBook: BookDefinition,
    bookMenuOpen: Boolean,
    content: BookContent?,
    page: BookPage?,
    chapter: BookChapter?,
    selectedPageIndex: Int,
    chapterMenuOpen: Boolean,
    strings: BookReaderStrings,
    onBookMenuOpenChange: (Boolean) -> Unit,
    onBookChange: (BookDefinition) -> Unit,
    onChapterMenuOpenChange: (Boolean) -> Unit,
    onPageChange: (Int) -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MidNavy,
        shape = RoundedCornerShape(AppShape.control),
        tonalElevation = 0.dp
    ) {
        Column(
            modifier = Modifier.padding(AppSpacing.list),
            verticalArrangement = Arrangement.spacedBy(BookReaderStyle.cardGap)
        ) {
            Box(modifier = Modifier.fillMaxWidth()) {
                OutlinedButton(
                    onClick = { onBookMenuOpenChange(true) },
                    modifier = Modifier.fillMaxWidth().height(BookReaderStyle.navButtonHeight),
                    shape = RoundedCornerShape(AppShape.control),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight),
                    contentPadding = PaddingValues(horizontal = 12.dp)
                ) {
                    Icon(Icons.Default.MenuBook, contentDescription = null, tint = Gold)
                    Spacer(modifier = Modifier.width(8.dp))
                    Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
                        Text(strings.bookLabel, maxLines = 1, fontSize = BookReaderStyle.labelSize, color = MutedGold)
                        Text(
                            selectedBook.titleEn,
                            maxLines = 1,
                            fontSize = BookReaderStyle.subtitleSize,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.End,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = Gold)
                }
                DropdownMenu(
                    expanded = bookMenuOpen,
                    onDismissRequest = { onBookMenuOpenChange(false) }
                ) {
                    FiqhBooks.forEach { book ->
                        DropdownMenuItem(
                            text = {
                                Column(horizontalAlignment = Alignment.End, modifier = Modifier.fillMaxWidth()) {
                                    Text(book.titleAr, textAlign = TextAlign.End, modifier = Modifier.fillMaxWidth())
                                    Text(book.titleEn, fontSize = BookReaderStyle.labelSize, color = MutedGold)
                                }
                            },
                            onClick = {
                                onBookChange(book)
                                onBookMenuOpenChange(false)
                            }
                        )
                    }
                }
            }

            Box(modifier = Modifier.fillMaxWidth()) {
                OutlinedButton(
                    enabled = content != null,
                    onClick = { onChapterMenuOpenChange(true) },
                    modifier = Modifier.fillMaxWidth().height(BookReaderStyle.navButtonHeight),
                    shape = RoundedCornerShape(AppShape.control),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight),
                    contentPadding = PaddingValues(horizontal = 12.dp)
                ) {
                    Icon(Icons.Default.MenuBook, contentDescription = null, tint = Gold)
                    Spacer(modifier = Modifier.width(8.dp))
                    Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
                        Text(strings.contents, maxLines = 1, fontSize = BookReaderStyle.labelSize, color = MutedGold)
                        Text(
                            chapter?.title ?: strings.loadingBook,
                            maxLines = 1,
                            fontSize = BookReaderStyle.subtitleSize,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.End,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = Gold)
                }
                DropdownMenu(
                    expanded = chapterMenuOpen,
                    onDismissRequest = { onChapterMenuOpenChange(false) }
                ) {
                    content?.chapters?.forEach { item ->
                        DropdownMenuItem(
                            text = {
                                Text(
                                    item.title,
                                    textAlign = TextAlign.End,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            },
                            onClick = {
                                onPageChange(item.firstPageIndex.coerceIn(0, content.pages.lastIndex))
                                onChapterMenuOpenChange(false)
                            }
                        )
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    enabled = selectedPageIndex > 0,
                    onClick = { onPageChange(selectedPageIndex - 1) }
                ) {
                    Icon(Icons.Default.KeyboardArrowLeft, contentDescription = null, tint = Gold)
                }
                Text(
                    page?.let { strings.pageLabel.format(it.pageNumber, content?.pages?.size ?: 0) } ?: strings.loading,
                    fontSize = BookReaderStyle.bodySize,
                    color = MutedGold,
                    fontWeight = FontWeight.Bold
                )
                IconButton(
                    enabled = content != null && selectedPageIndex < content.pages.lastIndex,
                    onClick = { onPageChange(selectedPageIndex + 1) }
                ) {
                    Icon(Icons.Default.KeyboardArrowRight, contentDescription = null, tint = Gold)
                }
            }
        }
    }
}

@Composable
private fun BookSearchCard(
    query: String,
    results: List<BookSearchResult>,
    strings: BookReaderStrings,
    onQueryChange: (String) -> Unit,
    onResultClick: (BookSearchResult) -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MidNavy,
        shape = RoundedCornerShape(AppShape.control),
        tonalElevation = 0.dp
    ) {
        Column(
            modifier = Modifier.padding(AppSpacing.list),
            verticalArrangement = Arrangement.spacedBy(BookReaderStyle.cardGap)
        ) {
            OutlinedTextField(
                value = query,
                onValueChange = onQueryChange,
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                label = { Text(strings.searchLabel) },
                placeholder = { Text(strings.searchPlaceholder) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = GoldLight,
                    unfocusedTextColor = GoldLight,
                    focusedBorderColor = Gold,
                    unfocusedBorderColor = BorderNavy,
                    focusedLabelColor = Gold,
                    unfocusedLabelColor = MutedGold,
                    focusedContainerColor = DeepNavy,
                    unfocusedContainerColor = DeepNavy,
                    cursorColor = Gold
                )
            )
            if (query.trim().length >= 2) {
                Text(
                    if (results.isEmpty()) strings.noSearchResults else strings.searchResults.format(results.size),
                    fontSize = BookReaderStyle.labelSize,
                    color = MutedGold
                )
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = BookReaderStyle.searchResultsMaxHeight)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    results.forEach { result ->
                        SearchResultRow(result = result, onClick = { onResultClick(result) })
                    }
                }
            }
        }
    }
}

@Composable
private fun SearchResultRow(result: BookSearchResult, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.smallControl))
            .background(DeepNavy)
            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.smallControl))
            .clickable(onClick = onClick)
            .padding(AppSpacing.list),
        verticalArrangement = Arrangement.spacedBy(5.dp)
    ) {
        Text(result.title, fontSize = BookReaderStyle.bodySize, color = GoldLight, fontWeight = FontWeight.Bold)
        Text(
            result.preview,
            modifier = Modifier.fillMaxWidth(),
            fontSize = BookReaderStyle.labelSize,
            lineHeight = BookReaderStyle.bodyLineHeight,
            color = SoftTextGold,
            textAlign = TextAlign.End,
            maxLines = BookReaderStyle.resultPreviewLines,
            overflow = TextOverflow.Ellipsis
        )
    }
}

private object BookDatabase {
    private const val DbAsset = "books/books.db"
    private const val DbName = "books.db"

    fun loadBook(context: Context, definition: BookDefinition): BookContent {
        val db = openDatabase(context)
        return try {
            val chapters = mutableListOf<BookChapter>()
            db.rawQuery(
                "SELECT title, first_page_index FROM chapters WHERE book_id = ? ORDER BY chapter_index",
                arrayOf(definition.id)
            ).use { cursor ->
                while (cursor.moveToNext()) {
                    chapters.add(
                        BookChapter(
                            title = cursor.getString(0),
                            firstPageIndex = cursor.getInt(1)
                        )
                    )
                }
            }

            val pages = mutableListOf<BookPage>()
            db.rawQuery(
                "SELECT page_number, marker, chapter_index FROM pages WHERE book_id = ? ORDER BY page_index",
                arrayOf(definition.id)
            ).use { cursor ->
                while (cursor.moveToNext()) {
                    pages.add(
                        BookPage(
                            pageNumber = cursor.getInt(0),
                            marker = cursor.getString(1),
                            chapterIndex = cursor.getInt(2)
                        )
                    )
                }
            }
            BookContent(
                chapters = chapters.ifEmpty { listOf(BookChapter("\u0645\u0642\u062f\u0645\u0629", 0)) },
                pages = pages
            )
        } finally {
            db.close()
        }
    }

    fun loadPageText(context: Context, bookId: String, pageIndex: Int): String {
        val db = openDatabase(context)
        return try {
            db.rawQuery(
                "SELECT text FROM pages WHERE book_id = ? AND page_index = ? LIMIT 1",
                arrayOf(bookId, pageIndex.toString())
            ).use { cursor ->
                if (cursor.moveToFirst()) cursor.getString(0) else ""
            }
        } finally {
            db.close()
        }
    }

    fun search(context: Context, bookId: String, query: String, pageLabel: String): List<BookSearchResult> {
        val needle = query.trim()
        if (needle.length < 2) return emptyList()
        val db = openDatabase(context)
        return try {
            val results = mutableListOf<BookSearchResult>()
            db.rawQuery(
                """
                SELECT p.page_index, p.page_number, p.text, c.title
                FROM pages p
                LEFT JOIN chapters c ON c.book_id = p.book_id AND c.chapter_index = p.chapter_index
                WHERE p.book_id = ? AND (p.text LIKE ? OR c.title LIKE ?)
                ORDER BY p.page_index
                LIMIT 60
                """.trimIndent(),
                arrayOf(bookId, "%$needle%", "%$needle%")
            ).use { cursor ->
                while (cursor.moveToNext()) {
                    val pageIndex = cursor.getInt(0)
                    val pageNumber = cursor.getInt(1)
                    val text = cursor.getString(2)
                    val chapter = cursor.getString(3).orEmpty().ifBlank { "\u0645\u0642\u062f\u0645\u0629" }
                    results.add(
                        BookSearchResult(
                            pageIndex = pageIndex,
                            title = "$chapter - ${pageLabel.format(pageNumber, "?")}",
                            preview = searchPreview(text, needle)
                        )
                    )
                }
            }
            results
        } finally {
            db.close()
        }
    }

    private fun openDatabase(context: Context): SQLiteDatabase {
        val target = File(context.filesDir, DbName)
        val sourceSize = context.assets.open(DbAsset).use { it.available().toLong() }
        if (!target.exists() || target.length() != sourceSize) {
            context.assets.open(DbAsset).use { input ->
                FileOutputStream(target).use { output -> input.copyTo(output) }
            }
        }
        return SQLiteDatabase.openDatabase(target.absolutePath, null, SQLiteDatabase.OPEN_READONLY)
    }
}

private fun searchPreview(text: String, query: String): String {
    val index = text.indexOf(query, ignoreCase = true).takeIf { it >= 0 } ?: 0
    val start = (index - 90).coerceAtLeast(0)
    val end = (index + query.length + 140).coerceAtMost(text.length)
    return text.substring(start, end)
        .replace("\n", " ")
        .trim()
}

private fun cleanBookText(text: String): String {
    return text
        .replace(HeadingRegex, "$1")
        .replace(Regex("Milestone\\d+"), "")
        .replace(Regex("###\\s*\\|+"), "")
        .lines()
        .map { it.trim() }
        .filter { it.isNotBlank() }
        .joinToString("\n")
        .trim()
}

fun bookMenuStrings(language: String): BookMenuStrings {
    return when (language) {
        "en" -> BookMenuStrings("Books", "Read fiqh texts by madhhab")
        "ar" -> BookMenuStrings("\u0627\u0644\u0643\u062a\u0628", "\u0627\u0642\u0631\u0623 \u0643\u062a\u0628 \u0627\u0644\u0641\u0642\u0647 \u062d\u0633\u0628 \u0627\u0644\u0645\u0630\u0647\u0628")
        "fr" -> BookMenuStrings("Livres", "Lire des textes de fiqh par ecole")
        else -> BookMenuStrings("Boeken", "Lees fiqhboeken per madhhab")
    }
}

private fun BookDefinition.summaryFor(language: String): String {
    return when (language) {
        "en" -> summaryEn
        "ar" -> summaryAr
        "fr" -> summaryFr
        else -> summaryNl
    }
}

private fun bookReaderStrings(language: String): BookReaderStrings {
    return when (language) {
        "en" -> BookReaderStrings(
            screenTitle = "Books",
            bookLabel = "Book",
            authorLabel = "Author",
            biographyCollapsed = "Show short biography",
            biographyExpanded = "Show less",
            biography = "Shafi'i jurist and hadith scholar. This work belongs to Shafi'i fiqh and became one of the central manuals of the madhhab.",
            contents = "Contents",
            loadingBook = "Loading book...",
            pageLabel = "Page %s / %s",
            loading = "Loading...",
            searchLabel = "Search in book",
            searchPlaceholder = "Type Arabic text",
            searchResults = "%s results",
            noSearchResults = "No results found"
        )
        "ar" -> BookReaderStrings(
            screenTitle = "\u0627\u0644\u0643\u062a\u0628",
            bookLabel = "\u0627\u0644\u0643\u062a\u0627\u0628",
            authorLabel = "\u0627\u0644\u0645\u0624\u0644\u0641",
            biographyCollapsed = "\u0625\u0638\u0647\u0627\u0631 \u062a\u0631\u062c\u0645\u0629 \u0645\u062e\u062a\u0635\u0631\u0629",
            biographyExpanded = "\u0625\u0638\u0647\u0627\u0631 \u0623\u0642\u0644",
            biography = "\u0641\u0642\u064a\u0647 \u0634\u0627\u0641\u0639\u064a \u0648\u0645\u062d\u062f\u062b\u060c \u0648\u0647\u0630\u0627 \u0627\u0644\u0643\u062a\u0627\u0628 \u0645\u0646 \u0645\u062a\u0648\u0646 \u0627\u0644\u0641\u0642\u0647 \u0627\u0644\u0634\u0627\u0641\u0639\u064a \u0627\u0644\u0645\u0639\u062a\u0645\u062f\u0629.",
            contents = "\u0627\u0644\u0641\u0647\u0631\u0633",
            loadingBook = "\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0643\u062a\u0627\u0628...",
            pageLabel = "\u0635\u0641\u062d\u0629 %s / %s",
            loading = "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...",
            searchLabel = "\u0627\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0643\u062a\u0627\u0628",
            searchPlaceholder = "\u0627\u0643\u062a\u0628 \u0646\u0635\u0627 \u0639\u0631\u0628\u064a\u0627",
            searchResults = "%s \u0646\u062a\u064a\u062c\u0629",
            noSearchResults = "\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c"
        )
        "fr" -> BookReaderStrings(
            screenTitle = "Livres",
            bookLabel = "Livre",
            authorLabel = "Auteur",
            biographyCollapsed = "Afficher une courte biographie",
            biographyExpanded = "Afficher moins",
            biography = "Juriste shafi'i et savant du hadith. Ce livre appartient au fiqh shafi'i et fait partie des manuels centraux de cette ecole.",
            contents = "Table des matieres",
            loadingBook = "Chargement du livre...",
            pageLabel = "Page %s / %s",
            loading = "Chargement...",
            searchLabel = "Rechercher dans le livre",
            searchPlaceholder = "Tape du texte arabe",
            searchResults = "%s resultats",
            noSearchResults = "Aucun resultat"
        )
        else -> BookReaderStrings(
            screenTitle = "Boeken",
            bookLabel = "Boek",
            authorLabel = "Auteur",
            biographyCollapsed = "Korte biografie tonen",
            biographyExpanded = "Minder tonen",
            biography = "Shafi'i jurist en hadithgeleerde. Dit werk hoort bij de Shafi'i fiqh en werd een van de centrale handboeken van de madhhab.",
            contents = "Inhoudsopgave",
            loadingBook = "Boek laden...",
            pageLabel = "Pagina %s / %s",
            loading = "Laden...",
            searchLabel = "Zoek in boek",
            searchPlaceholder = "Typ Arabische tekst",
            searchResults = "%s resultaten",
            noSearchResults = "Geen resultaten gevonden"
        )
    }
}
