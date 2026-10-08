package com.Ameender.qurantracker.ui

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.pdf.PdfRenderer
import android.content.Intent
import android.os.ParcelFileDescriptor
import android.util.LruCache
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.FormatSize
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.Ameender.qurantracker.data.QuranChapter
import com.Ameender.qurantracker.data.QuranDatabaseHelper
import com.Ameender.qurantracker.data.QuranSearchResult
import com.caverock.androidsvg.SVG
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import java.io.File
import java.util.zip.GZIPInputStream

data class SurahAudioOption(
    val reciterName: String,
    val rewayaName: String,
    val link: String
)

data class QuranWord(
    val position: Int,
    val arabic: String,
    val translation: String,
    val transliteration: String
)

data class WordByWordAyah(
    val ayah: Int,
    val words: List<QuranWord>,
    val e3rab: String
)

data class ReaderAyahAction(
    val surahId: Int,
    val surahName: String,
    val ayahNumber: Int,
    val ayahText: String,
    val wordInfo: WordByWordAyah?,
    val isBookmarked: Boolean
)

data class WarshAyahPosition(
    val surahId: Int,
    val ayahNumber: Int,
    val rawLeft: Float,
    val line: Int,
    val rawWidth: Float
)

data class HafsAyahPosition(
    val surahId: Int,
    val ayahNumber: Int,
    val left: Float,
    val top: Float,
    val width: Float,
    val height: Float
)

private val AyahToolbarGreen = Color(0xFF244F2E)

@Composable
fun QuranReaderScreen(
    mushafMode: String = "hafs",
    initialSurahId: Int? = null,
    initialAyah: Int? = null,
    initialWarshPage: Int? = null,
    openInitialTargetInMushaf: Boolean = false,
    selectedReciterName: String = "",
    appLanguage: String = "nl",
    audioPlayer: GlobalAudioPlayer,
    onOpenNotes: (Int, Int) -> Unit = { _, _ -> },
    surahNoteCounts: Map<Int, Int> = emptyMap(),
    onOpenSurahNotes: (Int) -> Unit = {},
    onReaderModeChanged: (Boolean) -> Unit = {},
    onInitialTargetConsumed: () -> Unit = {}
) {
    val context = LocalContext.current
    val dbHelper = remember { QuranDatabaseHelper(context) }
    val text = AppText.strings(appLanguage)

    var selectedChapter by remember { mutableStateOf<QuranChapter?>(null) }
    SideEffect { onReaderModeChanged(selectedChapter != null) }
    DisposableEffect(Unit) { onDispose { onReaderModeChanged(false) } }
    var selectedAyah by remember { mutableStateOf<Int?>(null) }
    var chapters by remember { mutableStateOf<List<QuranChapter>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var searchQuery by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<QuranSearchResult>>(emptyList()) }
    var isSearching by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            val loaded = dbHelper.getAllChapters()
            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                chapters = loaded
                isLoading = false
            }
        }
    }

    LaunchedEffect(chapters, initialSurahId, initialAyah, initialWarshPage) {
        val surahId = initialSurahId
        if (surahId != null && chapters.isNotEmpty()) {
            chapters.firstOrNull { it.id == surahId }?.let { chapter ->
                selectedChapter = chapter
                selectedAyah = initialAyah
                onInitialTargetConsumed()
            }
        }
    }

    LaunchedEffect(searchQuery) {
        val cleanQuery = searchQuery.trim()
        if (cleanQuery.length < 2) {
            searchResults = emptyList()
            isSearching = false
            return@LaunchedEffect
        }
        isSearching = true
        delay(250)
        searchResults = withContext(Dispatchers.IO) { dbHelper.searchAyahs(cleanQuery) }
        isSearching = false
    }

    if (selectedChapter != null) {
        ChapterReaderScreen(
            chapter = selectedChapter!!,
            dbHelper = dbHelper,
            mushafMode = mushafMode,
            repeatText = text,
            initialAyah = selectedAyah,
            initialWarshPage = initialWarshPage,
            openInitialTargetInMushaf = openInitialTargetInMushaf,
            selectedReciterName = selectedReciterName,
            audioPlayer = audioPlayer,
            onOpenNotes = onOpenNotes,
            onBack  = {
                selectedChapter = null
                selectedAyah = null
            }
        )
    } else {
        ChapterListScreen(
            chapters  = chapters,
            noteCounts = surahNoteCounts,
            onOpenNotes = onOpenSurahNotes,
            isLoading = isLoading,
            searchQuery = searchQuery,
            searchResults = searchResults,
            isSearching = isSearching,
            text = text,
            onSearchQueryChange = { searchQuery = it },
            onSelect  = {
                selectedChapter = it
                selectedAyah = null
            },
            onSearchResultSelect = { result ->
                chapters.firstOrNull { it.id == result.surahId }?.let { chapter ->
                    selectedChapter = chapter
                    selectedAyah = result.ayahNumber
                }
            }
        )
    }
}

@Composable
fun ChapterListScreen(
    chapters: List<QuranChapter>,
    isLoading: Boolean,
    searchQuery: String,
    searchResults: List<QuranSearchResult>,
    isSearching: Boolean,
    text: AppStrings,
    onSearchQueryChange: (String) -> Unit,
    onSelect: (QuranChapter) -> Unit,
    onSearchResultSelect: (QuranSearchResult) -> Unit,
    noteCounts: Map<Int, Int> = emptyMap(),
    onOpenNotes: (Int) -> Unit = {}
) {
    LazyColumn(modifier = Modifier.fillMaxSize().background(DarkNavy)) {
        item(key = "chapter-header") {
        Column {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(MidNavy)
                .padding(AppSpacing.screen),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("﷽", fontSize = 24.sp, color = GoldLight)
            Text(
                "القرآن الكريم",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = GoldLight
            )
            Text(text.readerSubtitle, fontSize = 13.sp, color = Gold)
        }

        QuranSearchBox(
            query = searchQuery,
            results = searchResults,
            isSearching = isSearching,
            placeholder = text.quranSearchPlaceholder,
            onQueryChange = onSearchQueryChange,
            onResultClick = onSearchResultSelect
        )
        }
        }
        if (isLoading) {
            item(key = "chapter-loading") {
            Box(modifier = Modifier.fillMaxWidth().height(160.dp), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Gold)
            }
            }
        } else {
                items(chapters, key = { it.id }) { chapter ->
                    Box(Modifier.padding(horizontal = AppSpacing.list)) {
                    ChapterListItem(chapter = chapter, onClick = { onSelect(chapter) },
                        noteCount = noteCounts[chapter.id] ?: 0, onOpenNotes = { onOpenNotes(chapter.id) })
                    }
                }
        }
    }
}

@Composable
fun QuranSearchBox(
    query: String,
    results: List<QuranSearchResult>,
    isSearching: Boolean,
    placeholder: String,
    onQueryChange: (String) -> Unit,
    onResultClick: (QuranSearchResult) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(AppSpacing.list)
    ) {
        OutlinedTextField(
            value = query,
            onValueChange = onQueryChange,
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Gold) },
            placeholder = { Text(placeholder, color = DimGold) },
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = GoldLight,
                unfocusedTextColor = GoldLight,
                focusedBorderColor = Gold,
                unfocusedBorderColor = BorderNavy,
                focusedContainerColor = DeepNavy,
                unfocusedContainerColor = DeepNavy,
                cursorColor = Gold
            ),
            shape = RoundedCornerShape(AppShape.control)
        )

        if (query.trim().length >= 2) {
            Spacer(modifier = Modifier.height(8.dp))
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = ReaderSearchStyle.maxResultsHeight)
                    .verticalScroll(rememberScrollState())
            ) {
                when {
                    isSearching -> Text(
                        "Zoeken...",
                        fontSize = 12.sp,
                        color = MutedGold,
                        modifier = Modifier.padding(AppSpacing.list)
                    )
                    results.isEmpty() -> Text(
                        "Geen resultaten gevonden",
                        fontSize = 12.sp,
                        color = MutedGold,
                        modifier = Modifier.padding(AppSpacing.list)
                    )
                    else -> results.forEach { result ->
                        SearchResultItem(result = result, onClick = { onResultClick(result) })
                    }
                }
            }
        }
    }
}

@Composable
fun SearchResultItem(result: QuranSearchResult, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 6.dp)
            .clip(RoundedCornerShape(AppShape.tile))
            .background(MidNavy)
            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.tile))
            .clickable(onClick = onClick)
            .padding(AppSpacing.list)
    ) {
        Text(
            "${result.surahName} ${result.surahId}:${result.ayahNumber}",
            fontSize = 12.sp,
            color = Gold,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            result.ayahText,
            fontSize = 15.sp,
            color = SoftTextGold,
            textAlign = TextAlign.End,
            maxLines = ReaderSearchStyle.resultPreviewLines,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
fun ChapterListItem(chapter: QuranChapter, onClick: () -> Unit, noteCount: Int = 0, onOpenNotes: () -> Unit = {}) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = AppSpacing.itemBottom)
            .clip(RoundedCornerShape(AppShape.tile))
            .background(MidNavy)
            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.tile))
            .clickable(onClick = onClick)
            .padding(horizontal = AppSpacing.list, vertical = AppSpacing.itemVertical),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(AppShape.pill))
                .background(DeepNavy)
                .border(1.dp, Gold.copy(alpha = 0.4f), RoundedCornerShape(AppShape.pill)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                "${chapter.id}",
                fontSize = 11.sp,
                color = Gold,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                ALL_SURAHS.firstOrNull { it.id == chapter.id }?.name ?: "Surah ${chapter.id}",
                fontSize = 14.sp,
                color = SoftTextGold,
                fontWeight = FontWeight.Medium
            )
            Text(
                "${chapter.versesCount} ayah's",
                fontSize = 11.sp,
                color = DimGold
            )
        }

        Text(
            chapter.nameAr,
            fontSize = 18.sp,
            color = Gold,
            fontWeight = FontWeight.Bold
        )
        NoteCountButton(noteCount, "Notities · ${chapter.nameAr}", onOpenNotes)
    }
}

@Composable
fun ChapterReaderScreen(
    chapter: QuranChapter,
    dbHelper: QuranDatabaseHelper,
    mushafMode: String = "hafs",
    repeatText: AppStrings = AppText.strings("nl"),
    initialAyah: Int? = null,
    initialWarshPage: Int? = null,
    openInitialTargetInMushaf: Boolean = false,
    selectedReciterName: String = "",
    audioPlayer: GlobalAudioPlayer,
    onOpenNotes: (Int, Int) -> Unit = { _, _ -> },
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val configuration = LocalConfiguration.current
    val density = LocalDensity.current
    val pageWidthPx = with(density) { configuration.screenWidthDp.dp.toPx().toInt() }
    var ayahs by remember { mutableStateOf<List<Pair<Int, String>>>(emptyList()) }
    var audioStatus by remember { mutableStateOf("") }
    var showSurahCard by remember(chapter.id) { mutableStateOf(false) }
    var bookmarkedAyahs by remember(chapter.id) {
        mutableStateOf(loadAyahBookmarks(context, chapter.id))
    }
    var bookmarkedWarshPages by remember(chapter.id) {
        mutableStateOf(loadWarshPageBookmarks(context, chapter.id))
    }
    val wordByWordAyahs = remember(chapter.id) { loadWordByWordAyahs(context, chapter.id) }
    var showWordByWord by remember(chapter.id) { mutableStateOf(false) }
    var selectedWordAyah by remember { mutableStateOf<WordByWordAyah?>(null) }
    var selectedWord by remember { mutableStateOf<QuranWord?>(null) }
    var selectedAyahInfo by remember { mutableStateOf<WordByWordAyah?>(null) }
    var selectedAyahAction by remember { mutableStateOf<ReaderAyahAction?>(null) }
    var selectedAyahToolbarY by remember { mutableStateOf<Float?>(null) }
    var selectedWarshAyahKey by remember { mutableStateOf<Pair<Int, Int>?>(null) }
    val warshPageNumbers = remember(chapter.id) { warshPagesForSurah(chapter.id) }
    val warshPageResIds = remember(chapter.id) {
        warshPageNumbers.mapNotNull { page ->
            val resId = context.resources.getIdentifier(
                "warsh_page_${page.toString().padStart(3, '0')}",
                "drawable",
                context.packageName
            )
            if (resId == 0) null else page to resId
        }
    }
    val continuousWarshPageResIds = warshPageResIds
    val hafsMadinaPageNumbers = remember(chapter.id) { hafsMadinaPagesForSurah(chapter.id) }
    val hafsMadinaPageResIds = remember(context) {
        (1..604).mapNotNull { page ->
            val resId = context.resources.getIdentifier(
                "hafs_madina_page_${page.toString().padStart(3, '0')}",
                "drawable",
                context.packageName
            )
            if (resId == 0) null else page to resId
        }
    }
    val downloadedMushafPdf = remember(mushafMode) {
        downloadedMushafPdfFile(context, mushafMode).takeIf { it.exists() && it.length() > 0L }
    }
    val maknoonPagesInstalled = remember(mushafMode) {
        (mushafMode == "warsh_maknoon" || mushafMode == "hafs_maknoon") &&
            downloadedMushafPageCount(context, mushafMode) >= 604
    }
    val maknoonSurahPages = remember(chapter.id, mushafMode) {
        if (mushafMode == "warsh_maknoon") WarshMaknoonPages.pagesForSurah(context, chapter.id)
        else hafsMadinaPageNumbers.toList()
    }
    val maknoonReadingPages = remember(maknoonSurahPages) {
        ((maknoonSurahPages.firstOrNull() ?: 1)..604).toList()
    }
    val downloadedMushafPageCount by produceState(initialValue = 0, downloadedMushafPdf) {
        value = withContext(Dispatchers.IO) { downloadedMushafPdf?.pdfPageCount() ?: 0 }
    }
    val shouldOpenInitialTargetInMushaf = (openInitialTargetInMushaf || initialAyah != null) && initialAyah != null
    var showWarshMushaf by remember(chapter.id, mushafMode, warshPageResIds, initialAyah, shouldOpenInitialTargetInMushaf) {
        mutableStateOf(
            (initialAyah == null || shouldOpenInitialTargetInMushaf) &&
                mushafMode == "warsh" &&
                warshPageResIds.isNotEmpty()
        )
    }
    var showHafsMadinaMushaf by remember(chapter.id, mushafMode, hafsMadinaPageResIds, initialAyah, shouldOpenInitialTargetInMushaf) {
        mutableStateOf(
            (initialAyah == null || shouldOpenInitialTargetInMushaf) &&
                mushafMode == "hafs" &&
                hafsMadinaPageResIds.isNotEmpty()
        )
    }
    var showDownloadedPdfMushaf by remember(chapter.id, mushafMode, downloadedMushafPdf, downloadedMushafPageCount, initialAyah, shouldOpenInitialTargetInMushaf) {
        mutableStateOf(
            (initialAyah == null || shouldOpenInitialTargetInMushaf) &&
                downloadedMushafPdf != null &&
                downloadedMushafPageCount > 0
        )
    }
    var showMaknoonWarshMushaf by remember(chapter.id, mushafMode, maknoonPagesInstalled, initialAyah, shouldOpenInitialTargetInMushaf) {
        mutableStateOf((initialAyah == null || shouldOpenInitialTargetInMushaf) && maknoonPagesInstalled)
    }
    val hasWarshMushaf = warshPageResIds.isNotEmpty()
    val hasHafsMadinaMushaf = hafsMadinaPageResIds.isNotEmpty()
    val hasDownloadedPdfMushaf = downloadedMushafPdf != null && downloadedMushafPageCount > 0
    val hasMaknoonWarshMushaf = maknoonPagesInstalled
    val showMushafImage = showWarshMushaf || showHafsMadinaMushaf || showDownloadedPdfMushaf || showMaknoonWarshMushaf
    val hasMushafImage = hasWarshMushaf || hasHafsMadinaMushaf || hasDownloadedPdfMushaf || hasMaknoonWarshMushaf
    val hasWordByWord = wordByWordAyahs.isNotEmpty()
    val hideAyahText = showMushafImage || showWordByWord
    val mushafContentPadding = if (showMushafImage) PaddingValues(0.dp) else PaddingValues(AppSpacing.screen)
    val surahCardResId = remember(chapter.id) {
            context.resources.getIdentifier(
                "surah_card_${chapter.id.toString().padStart(3, '0')}",
                "drawable",
                context.packageName
            )
    }
    val audioOptions = remember(chapter.id) {
        loadSurahAudioOptions(context, chapter.id)
    }
    val selectedAudio by remember(chapter.id, audioOptions, selectedReciterName) {
        mutableStateOf(
            audioOptions.firstOrNull { it.reciterName == selectedReciterName }
                ?: audioOptions.firstOrNull()
        )
    }
    val isCurrentAudio = selectedAudio?.link == audioPlayer.currentTrack?.audioUrl
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()
    var arabicFontSize by remember {
        mutableIntStateOf(loadReaderArabicFontSize(context))
    }
    var selectedTextAyah by remember { mutableStateOf<Int?>(null) }

    LaunchedEffect(selectedAudio?.link) {
        val audio = selectedAudio ?: return@LaunchedEffect
        val currentTrack = audioPlayer.currentTrack ?: return@LaunchedEffect
        if (currentTrack.surahId == chapter.id && currentTrack.audioUrl != audio.link) {
            audioPlayer.replaceCurrentTrack(
                track = currentTrack.copy(
                    reciterName = audio.reciterName,
                    audioUrl = audio.link
                ),
                startWhenReady = audioPlayer.isPlaying || audioPlayer.isPreparing
            )
        }
    }

    LaunchedEffect(chapter.id) {
        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            val loadedAyahs = dbHelper.getAyahsForChapter(chapter.id)
            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                ayahs = loadedAyahs
            }
        }
    }

    LaunchedEffect(initialAyah, ayahs) {
        val ayah = initialAyah ?: loadLastReadAyah(context, chapter.id)
        if (ayah != null && ayahs.isNotEmpty()) {
            if (shouldOpenInitialTargetInMushaf) {
                showWordByWord = false
                when {
                    mushafMode == "hafs_maknoon" && hasMaknoonWarshMushaf -> {
                        showWarshMushaf = false
                        showHafsMadinaMushaf = false
                        showDownloadedPdfMushaf = false
                        showMaknoonWarshMushaf = true
                    }
                    mushafMode == "warsh_maknoon" && hasMaknoonWarshMushaf -> {
                        showWarshMushaf = false
                        showHafsMadinaMushaf = false
                        showDownloadedPdfMushaf = false
                        showMaknoonWarshMushaf = true
                    }
                    mushafMode == "warsh" && hasWarshMushaf -> {
                        showWarshMushaf = true
                        showHafsMadinaMushaf = false
                        showDownloadedPdfMushaf = false
                        showMaknoonWarshMushaf = false
                    }
                    mushafMode == "hafs" && hasHafsMadinaMushaf -> {
                        showWarshMushaf = false
                        showHafsMadinaMushaf = true
                        showDownloadedPdfMushaf = false
                        showMaknoonWarshMushaf = false
                    }
                    hasDownloadedPdfMushaf -> {
                        showWarshMushaf = false
                        showHafsMadinaMushaf = false
                        showDownloadedPdfMushaf = true
                        showMaknoonWarshMushaf = false
                    }
                    hasHafsMadinaMushaf -> {
                        showWarshMushaf = false
                        showHafsMadinaMushaf = true
                        showDownloadedPdfMushaf = false
                        showMaknoonWarshMushaf = false
                    }
                    else -> {
                        val offset = ayahListIndexOffset(chapter.id, surahCardResId != 0 && showSurahCard)
                        listState.animateScrollToItem((offset + ayah - 1).coerceAtLeast(0))
                    }
                }
                return@LaunchedEffect
            }
            showWarshMushaf = false
            showHafsMadinaMushaf = false
            showDownloadedPdfMushaf = false
            showMaknoonWarshMushaf = false
            showWordByWord = false
            val offset = ayahListIndexOffset(chapter.id, surahCardResId != 0 && showSurahCard)
            listState.animateScrollToItem((offset + ayah - 1).coerceAtLeast(0))
            selectedTextAyah = ayah
        }
    }

    LaunchedEffect(
        shouldOpenInitialTargetInMushaf,
        initialAyah,
        showWarshMushaf,
        showHafsMadinaMushaf,
        showDownloadedPdfMushaf,
        showMaknoonWarshMushaf,
        continuousWarshPageResIds,
        hafsMadinaPageResIds,
        downloadedMushafPageCount,
        pageWidthPx
    ) {
        val ayah = initialAyah
        if (!shouldOpenInitialTargetInMushaf || ayah == null) return@LaunchedEffect
        delay(120)

        when {
            showWarshMushaf && continuousWarshPageResIds.isNotEmpty() -> {
                val target = withContext(Dispatchers.IO) {
                    findWarshAyahMushafTarget(
                        context = context,
                        surahId = chapter.id,
                        ayahNumber = ayah,
                        pages = continuousWarshPageResIds.map { it.first }
                    )
                }
                val page = target?.page ?: warshPageNumbers.first
                val pageIndex = continuousWarshPageResIds.indexOfFirst { it.first == page }.coerceAtLeast(0)
                val scrollFraction = target?.scrollFraction ?: 0f
                listState.scrollToItem(
                    index = pageIndex,
                    scrollOffset = (scrollFraction * pageWidthPx * ReaderInfoStyle.warshPageRatio).toInt()
                )
            }
            showHafsMadinaMushaf && hafsMadinaPageResIds.isNotEmpty() -> {
                val target = withContext(Dispatchers.IO) {
                    findHafsAyahMushafTarget(
                        context = context,
                        surahId = chapter.id,
                        ayahNumber = ayah,
                        pages = hafsMadinaPageResIds.map { it.first }
                    )
                }
                val page = target?.page ?: hafsMadinaPageNumbers.first
                val pageIndex = hafsMadinaPageResIds.indexOfFirst { it.first == page }.coerceAtLeast(0)
                val scrollFraction = target?.scrollFraction ?: 0f
                listState.scrollToItem(
                    index = pageIndex,
                    scrollOffset = (scrollFraction * pageWidthPx * ReaderInfoStyle.hafsMadinaPageRatio).toInt()
                )
            }
            showMaknoonWarshMushaf -> {
                val pages = maknoonReadingPages
                val target = withContext(Dispatchers.IO) {
                    if (mushafMode == "warsh_maknoon") {
                        WarshMaknoonPages.findAyah(context, chapter.id, ayah, maknoonSurahPages)
                    } else findHafsAyahMushafTarget(
                        context = context,
                        surahId = chapter.id,
                        ayahNumber = ayah,
                        pages = pages
                    )
                }
                val page = target?.page ?: pages.first()
                val pageIndex = pages.indexOf(page).coerceAtLeast(0)
                val scrollFraction = target?.scrollFraction ?: 0f
                val pageRatio = if (mushafMode == "warsh_maknoon") {
                    WarshMaknoonPages.load(context, page).let { it.height / it.width }
                } else ReaderInfoStyle.hafsMadinaPageRatio
                listState.scrollToItem(
                    index = pageIndex,
                    scrollOffset = (scrollFraction * pageWidthPx * pageRatio).toInt()
                )
            }
            showDownloadedPdfMushaf && downloadedMushafPageCount > 0 -> {
                val fallbackPages = if (mushafMode == "warsh_madina") warshPageNumbers else hafsMadinaPageNumbers
                val pages = downloadedPdfPagesForSurah(
                    mushafMode = mushafMode,
                    pageCount = downloadedMushafPageCount,
                    fallbackPages = fallbackPages
                )
                val target = withContext(Dispatchers.IO) {
                    findHafsAyahMushafTarget(
                        context = context,
                        surahId = chapter.id,
                        ayahNumber = ayah,
                        pages = pages
                    )
                }
                val page = target?.page ?: fallbackPages.first
                val pageIndex = pages.indexOf(page).coerceAtLeast(0)
                val scrollFraction = target?.scrollFraction ?: 0f
                listState.scrollToItem(
                    index = pageIndex,
                    scrollOffset = (scrollFraction * pageWidthPx * ReaderInfoStyle.hafsMadinaPageRatio).toInt()
                )
            }
        }
    }

    LaunchedEffect(initialWarshPage, continuousWarshPageResIds) {
        val page = initialWarshPage
        if (page != null && continuousWarshPageResIds.isNotEmpty()) {
            showWarshMushaf = true
            showHafsMadinaMushaf = false
            showDownloadedPdfMushaf = false
            showMaknoonWarshMushaf = false
            showWordByWord = false
            val pageIndex = continuousWarshPageResIds.indexOfFirst { it.first == page }.coerceAtLeast(0)
            listState.animateScrollToItem(pageIndex)
        }
    }

    LaunchedEffect(showWarshMushaf, chapter.id, pageWidthPx, warshPageNumbers) {
        if (showWarshMushaf && !shouldOpenInitialTargetInMushaf && chapter.id > 2 && warshPageNumbers.first > 0) {
            val offsetFraction = withContext(Dispatchers.IO) {
                warshSurahStartScrollFraction(
                    loadWarshPagePositions(context, warshPageNumbers.first),
                    chapter.id
                )
            }
            delay(120)
            listState.scrollToItem(
                index = 0,
                scrollOffset = (offsetFraction * pageWidthPx * ReaderInfoStyle.warshPageRatio).toInt()
            )
        }
    }

    LaunchedEffect(showHafsMadinaMushaf, chapter.id, pageWidthPx, hafsMadinaPageNumbers, hafsMadinaPageResIds) {
        if (showHafsMadinaMushaf && !shouldOpenInitialTargetInMushaf && hafsMadinaPageResIds.isNotEmpty()) {
            val offsetFraction = withContext(Dispatchers.IO) {
                hafsSurahStartScrollFraction(
                    loadHafsMadinaPagePositions(context, hafsMadinaPageNumbers.first),
                    chapter.id
                )
            }
            delay(120)
            listState.scrollToItem(
                index = hafsMadinaPageResIds.indexOfFirst { it.first == hafsMadinaPageNumbers.first }.coerceAtLeast(0),
                scrollOffset = (offsetFraction * pageWidthPx * ReaderInfoStyle.hafsMadinaPageRatio).toInt()
            )
        }
    }

    fun playAudio(startWhenReady: Boolean = true) {
        val audio = selectedAudio
        if (audio == null) {
            audioStatus = "Geen reciteur gekozen"
        } else {
            val canonicalSurah = ALL_SURAHS.firstOrNull { it.id == chapter.id }
            val track = AudioTrack(
                surahId = chapter.id,
                surahName = canonicalSurah?.name
                    ?: chapter.namePronEn.takeIf(String::isNotBlank)
                    ?: "Soera ${chapter.id}",
                surahNameArabic = canonicalSurah?.arabic ?: chapter.nameAr,
                ayahNumber = null,
                reciterName = audio.reciterName,
                audioUrl = audio.link
            )
            if (startWhenReady && isCurrentAudio && !audioPlayer.isPreparing && !audioPlayer.isPlaying) {
                audioPlayer.resume()
            } else {
                audioPlayer.play(track, startWhenReady = startWhenReady)
            }
            audioStatus = if (startWhenReady) "Soera ${chapter.id} speelt af: ${audio.reciterName}" else ""
        }
    }
    var readerMenuOpen by remember { mutableStateOf(false) }
    var showBookmarkList by remember { mutableStateOf(false) }
    val currentWarshPage by remember(showWarshMushaf, continuousWarshPageResIds, listState.firstVisibleItemIndex) {
        derivedStateOf {
            if (showWarshMushaf) {
                continuousWarshPageResIds.getOrNull(listState.firstVisibleItemIndex)?.first
            } else {
                null
            }
        }
    }
    var repeatInitialAyah by remember { mutableStateOf<Int?>(null) }
    var repeatSurah by remember(chapter.id) { mutableIntStateOf(chapter.id) }
    val repeatPageIndex = (listState.firstVisibleItemIndex - if (showSurahCard && surahCardResId != 0) 1 else 0).coerceAtLeast(0)
    val repeatPage = when {
        showMaknoonWarshMushaf -> maknoonReadingPages.getOrNull(repeatPageIndex)
        showHafsMadinaMushaf -> hafsMadinaPageResIds.getOrNull(repeatPageIndex)?.first
        else -> null
    }
    DisposableEffect(audioPlayer) {
        audioPlayer.canConfigureSelection = true
        onDispose { audioPlayer.canConfigureSelection = false; audioPlayer.repeatSheetRequested = false }
    }
    if (audioPlayer.repeatSheetRequested) {
        RepeatSelectionSheet(surah = repeatSurah, page = repeatPage, warsh = mushafMode.startsWith("warsh"),
            text = repeatText, player = audioPlayer, initialAyah = repeatInitialAyah,
            onDismiss = {
                audioPlayer.repeatSheetRequested = false
                repeatInitialAyah = null
                audioPlayer.playerSheetRequested = true
            })
    }
    val openCurrentSurahInWarsh: () -> Unit = {
        selectedWord = null
        selectedWordAyah = null
        selectedAyahInfo = null
        selectedAyahAction = null
        showSurahCard = false
        showWordByWord = false
        showHafsMadinaMushaf = false
        showDownloadedPdfMushaf = false
        showMaknoonWarshMushaf = hasMaknoonWarshMushaf
        showWarshMushaf = false
        scope.launch {
            delay(80)
            listState.scrollToItem(0)
        }
    }

    if (selectedWord != null && selectedWordAyah != null) {
        WordInfoDialog(
            word = selectedWord!!,
            ayah = selectedWordAyah!!,
            canOpenWarsh = hasMaknoonWarshMushaf,
            onOpenWarsh = openCurrentSurahInWarsh,
            onDismiss = {
                selectedWord = null
                selectedWordAyah = null
            }
        )
    }
    if (selectedAyahInfo != null) {
        AyahInfoDialog(
            ayah = selectedAyahInfo!!,
            onWordClick = { word ->
                selectedWordAyah = selectedAyahInfo
                selectedWord = word
                selectedAyahInfo = null
            },
            canOpenWarsh = hasMaknoonWarshMushaf,
            onOpenWarsh = openCurrentSurahInWarsh,
            onDismiss = { selectedAyahInfo = null }
        )
    }
    val copySelectedAyah: () -> Unit = {
        selectedAyahAction?.let { action ->
            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
            val clip = android.content.ClipData.newPlainText(
                "Quran ${action.surahId}:${action.ayahNumber}",
                "${action.ayahText}\n${action.surahName} ${action.surahId}:${action.ayahNumber}"
            )
            clipboard.setPrimaryClip(clip)
            Toast.makeText(context, "Ayah gekopieerd", Toast.LENGTH_SHORT).show()
        }
    }
    val shareSelectedAyah: () -> Unit = {
        selectedAyahAction?.let { action ->
            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(
                    Intent.EXTRA_TEXT,
                    "${action.ayahText}\n${action.surahName} ${action.surahId}:${action.ayahNumber}"
                )
            }
            context.startActivity(Intent.createChooser(shareIntent, "Ayah delen"))
        }
    }
    val toggleSelectedAyahBookmark: () -> Unit = {
        selectedAyahAction?.let { action ->
            val currentSet = if (action.surahId == chapter.id) {
                bookmarkedAyahs
            } else {
                loadAyahBookmarks(context, action.surahId)
            }
            val updated = currentSet.toggle(action.ayahNumber)
            if (action.surahId == chapter.id) bookmarkedAyahs = updated
            saveAyahBookmarks(context, action.surahId, updated)
            selectedAyahAction = action.copy(isBookmarked = updated.contains(action.ayahNumber))
        }
    }
    val selectMushafAyah: (Int, Int, String, WordByWordAyah?, Float?) -> Unit = { surahId, ayahNumber, ayahText, wordInfo, toolbarY ->
        if (surahId == 0) {
            selectedWarshAyahKey = null
            selectedAyahAction = null
            selectedAyahToolbarY = null
        } else {
            selectedWarshAyahKey = surahId to ayahNumber
            selectedAyahToolbarY = toolbarY
            val surahName = if (surahId == chapter.id) chapter.nameAr else dbHelper.getChapterName(surahId)
            selectedAyahAction = ReaderAyahAction(
                surahId = surahId,
                surahName = surahName,
                ayahNumber = ayahNumber,
                ayahText = ayahText,
                wordInfo = wordInfo,
                isBookmarked = if (surahId == chapter.id) {
                    bookmarkedAyahs.contains(ayahNumber)
                } else {
                    loadAyahBookmarks(context, surahId).contains(ayahNumber)
                }
            )
        }
    }
    if (showBookmarkList) {
        ReaderBookmarkDialog(
            showWarshMushaf = showWarshMushaf,
            ayahBookmarks = bookmarkedAyahs,
            warshPageBookmarks = bookmarkedWarshPages,
            warshPageResIds = warshPageResIds,
            onSelectAyah = { ayah ->
                showBookmarkList = false
                val offset = ayahListIndexOffset(chapter.id, surahCardResId != 0 && showSurahCard)
                scope.launch { listState.animateScrollToItem((offset + ayah - 1).coerceAtLeast(0)) }
            },
            onSelectWarshPage = { page ->
                showBookmarkList = false
                val pageIndex = warshPageResIds.indexOfFirst { it.first == page }.coerceAtLeast(0)
                scope.launch { listState.animateScrollToItem(pageIndex) }
            },
            onDismiss = { showBookmarkList = false }
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkNavy)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
        if (!showMushafImage) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MidNavy)
                    .padding(horizontal = AppSpacing.list, vertical = AppSpacing.itemVertical),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Terug", tint = Gold)
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "Soera ${chapter.id}",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = GoldLight
                    )
                    Text(
                        "${chapter.versesCount} ayah's",
                        fontSize = 12.sp,
                        color = MutedGold
                    )
                }
                if (surahCardResId != 0) {
                    OutlinedButton(
                        onClick = { showSurahCard = !showSurahCard },
                        modifier = Modifier
                            .height(32.dp)
                            .padding(end = 8.dp),
                        shape = RoundedCornerShape(AppShape.smallControl),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight)
                    ) {
                        Text("Kaart", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
                if (hasMushafImage) {
                    OutlinedButton(
                        onClick = {
                            if (mushafMode == "warsh") {
                                showWarshMushaf = !showWarshMushaf
                                showHafsMadinaMushaf = false
                                showDownloadedPdfMushaf = false
                                showMaknoonWarshMushaf = false
                            } else if (hasMaknoonWarshMushaf) {
                                showMaknoonWarshMushaf = !showMaknoonWarshMushaf
                                showWarshMushaf = false
                                showHafsMadinaMushaf = false
                                showDownloadedPdfMushaf = false
                            } else if (hasDownloadedPdfMushaf) {
                                showDownloadedPdfMushaf = !showDownloadedPdfMushaf
                                showWarshMushaf = false
                                showHafsMadinaMushaf = false
                                showMaknoonWarshMushaf = false
                            } else {
                                showHafsMadinaMushaf = !showHafsMadinaMushaf
                                showWarshMushaf = false
                                showDownloadedPdfMushaf = false
                                showMaknoonWarshMushaf = false
                            }
                        },
                        modifier = Modifier
                            .height(32.dp)
                            .padding(end = 8.dp),
                        shape = RoundedCornerShape(AppShape.smallControl),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Gold.copy(alpha = 0.45f)),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight)
                    ) {
                        Text("Mushaf", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
                Text(
                    chapter.nameAr,
                    fontSize = 22.sp,
                    color = Gold,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        LazyColumn(
            state = listState,
            modifier = Modifier.weight(1f),
            contentPadding = mushafContentPadding
        ) {
            if (surahCardResId != 0 && showSurahCard) {
                item {
                    Image(
                        painter = painterResource(id = surahCardResId),
                        contentDescription = "Kaart van soera ${chapter.id}",
                        contentScale = ContentScale.FillWidth,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = AppSpacing.list)
                            .clip(RoundedCornerShape(AppShape.tile))
                            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.tile))
                    )
                }
            }

            if (hasWarshMushaf && showWarshMushaf) {
                items(continuousWarshPageResIds) { (page, resId) ->
                    WarshMushafPage(
                        page = page,
                        resId = resId,
                        dbHelper = dbHelper,
                        currentChapterId = chapter.id,
                        ayahs = ayahs,
                        wordByWordAyahs = wordByWordAyahs,
                        bookmarkedAyahs = bookmarkedAyahs,
                        selectedAyahKey = selectedWarshAyahKey,
                        onSelectAyah = selectMushafAyah,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            if (hasHafsMadinaMushaf && showHafsMadinaMushaf) {
                items(hafsMadinaPageResIds) { (page, resId) ->
                    HafsMadinaMushafPage(
                        page = page,
                        resId = resId,
                        dbHelper = dbHelper,
                        currentChapterId = chapter.id,
                        ayahs = ayahs,
                        wordByWordAyahs = wordByWordAyahs,
                        bookmarkedAyahs = bookmarkedAyahs,
                        selectedAyahKey = selectedWarshAyahKey,
                        onSelectAyah = selectMushafAyah,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            if (hasDownloadedPdfMushaf && showDownloadedPdfMushaf && downloadedMushafPdf != null) {
                val pages = downloadedPdfPagesForSurah(
                    mushafMode = mushafMode,
                    pageCount = downloadedMushafPageCount,
                    fallbackPages = if (mushafMode == "warsh_madina") warshPageNumbers else hafsMadinaPageNumbers
                )
                items(pages) { page ->
                    DownloadedPdfMushafPage(
                        pdfFile = downloadedMushafPdf,
                        pageNumber = page,
                        mushafMode = mushafMode,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            if (hasMaknoonWarshMushaf && showMaknoonWarshMushaf) {
                val pages = maknoonReadingPages
                items(pages) { page ->
                    MaknoonWarshMushafPage(
                        pageNumber = page,
                        pageFile = downloadedMushafPageFile(context, mushafMode, page),
                        dbHelper = dbHelper,
                        currentChapterId = chapter.id,
                        ayahs = ayahs,
                        bookmarkedAyahs = bookmarkedAyahs,
                        selectedAyahKey = selectedWarshAyahKey,
                        onSelectAyah = selectMushafAyah,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            if (showWordByWord) {
                items(wordByWordAyahs) { ayah ->
                    WordByWordAyahCard(
                        ayah = ayah,
                        onWordClick = { word ->
                            selectedWordAyah = ayah
                            selectedWord = word
                        }
                    )
                }
            }

            if (!hideAyahText && chapter.id != 9 && chapter.id != 1) {
                item {
                    Text(
                        "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                        fontSize = 22.sp,
                        color = Gold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = AppSpacing.screen)
                    )
                }
            }

            if (!hideAyahText) {
                items(ayahs, key = { it.first }) { (number, text) ->
                    val wordByWordAyah = wordByWordAyahs.firstOrNull { it.ayah == number }
                    AyahItem(
                        number = number,
                        text = text,
                        arabicFontSize = arabicFontSize,
                        isSelected = selectedTextAyah == number,
                        isBookmarked = bookmarkedAyahs.contains(number),
                        onClick = {
                            selectedTextAyah = number
                            saveLastReadAyah(context, chapter.id, number)
                        },
                        onBookmarkClick = {
                            val updated = bookmarkedAyahs.toggle(number)
                            bookmarkedAyahs = updated
                            saveAyahBookmarks(context, chapter.id, updated)
                        },
                        hasAyahInfo = wordByWordAyah != null,
                        onInfoClick = {
                            if (wordByWordAyah != null) selectedAyahInfo = wordByWordAyah
                        },
                        onLongPress = {
                            selectedTextAyah = number
                            saveLastReadAyah(context, chapter.id, number)
                            selectedAyahAction = ReaderAyahAction(
                                surahId = chapter.id,
                                surahName = chapter.nameAr,
                                ayahNumber = number,
                                ayahText = text,
                                wordInfo = wordByWordAyah,
                                isBookmarked = bookmarkedAyahs.contains(number)
                            )
                        }
                    )
                }
            }
        }
        }

        if (showMushafImage) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(ReaderOverlayStyle.edgePadding)
            ) {
                IconButton(
                    onClick = { readerMenuOpen = true },
                    modifier = Modifier
                        .size(ReaderOverlayStyle.menuButton)
                        .clip(RoundedCornerShape(ReaderOverlayStyle.roundButton))
                        .background(DeepNavy.copy(alpha = ReaderOverlayStyle.overlayAlpha))
                        .border(1.dp, Gold.copy(alpha = 0.45f), RoundedCornerShape(ReaderOverlayStyle.roundButton))
                ) {
                    Icon(Icons.Default.MoreVert, contentDescription = repeatText.t("reader.menu"), tint = GoldLight)
                }
                DropdownMenu(
                    expanded = readerMenuOpen,
                    onDismissRequest = { readerMenuOpen = false }
                ) {
                    DropdownMenuItem(
                        text = { Text(repeatText.t("reader.readText")) },
                        onClick = {
                            showWarshMushaf = false
                            showHafsMadinaMushaf = false
                            showDownloadedPdfMushaf = false
                            showMaknoonWarshMushaf = false
                            showWordByWord = false
                            readerMenuOpen = false
                        }
                    )
                    DropdownMenuItem(
                        text = { Text(repeatText.t("reader.fontSize", arabicFontSize)) },
                        leadingIcon = { Icon(Icons.Default.FormatSize, contentDescription = null) },
                        onClick = {
                            arabicFontSize = (arabicFontSize + 2).coerceAtMost(36)
                            saveReaderArabicFontSize(context, arabicFontSize)
                        }
                    )
                    DropdownMenuItem(
                        text = { Text(repeatText.t("reader.smallerFont")) },
                        onClick = {
                            arabicFontSize = (arabicFontSize - 2).coerceAtLeast(20)
                            saveReaderArabicFontSize(context, arabicFontSize)
                        }
                    )
                    DropdownMenuItem(
                        text = { Text(repeatText.t("reader.backToSurahs")) },
                        leadingIcon = { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null) },
                        onClick = {
                            readerMenuOpen = false
                            onBack()
                        }
                    )
                    DropdownMenuItem(
                        text = { Text(repeatText.t("reader.pageBookmarks", bookmarkedWarshPages.size)) },
                        enabled = bookmarkedWarshPages.isNotEmpty(),
                        onClick = {
                            readerMenuOpen = false
                            showBookmarkList = true
                        }
                    )
                    if (surahCardResId != 0) {
                        DropdownMenuItem(
                            text = { Text(repeatText.t(if (showSurahCard) "reader.hideCard" else "reader.showCard")) },
                            onClick = {
                                showSurahCard = !showSurahCard
                                if (showSurahCard) {
                                    showWarshMushaf = false
                                    showHafsMadinaMushaf = false
                                    showDownloadedPdfMushaf = false
                                    showMaknoonWarshMushaf = false
                                    showWordByWord = false
                                }
                                readerMenuOpen = false
                            }
                        )
                    }
                    if (hasWordByWord) {
                        DropdownMenuItem(
                            text = { Text(repeatText.t("reader.showWordByWord")) },
                            onClick = {
                                showWordByWord = true
                                showWarshMushaf = false
                                showHafsMadinaMushaf = false
                                showDownloadedPdfMushaf = false
                                showMaknoonWarshMushaf = false
                                readerMenuOpen = false
                            }
                        )
                    }
                }
            }
        } else {
            Box(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(ReaderOverlayStyle.edgePadding)
            ) {
                IconButton(
                    onClick = { readerMenuOpen = true },
                    modifier = Modifier
                        .size(ReaderOverlayStyle.menuButton)
                        .clip(RoundedCornerShape(ReaderOverlayStyle.roundButton))
                        .background(DeepNavy.copy(alpha = ReaderOverlayStyle.overlayAlpha))
                        .border(1.dp, Gold.copy(alpha = 0.45f), RoundedCornerShape(ReaderOverlayStyle.roundButton))
                ) {
                    Icon(Icons.Default.MoreVert, contentDescription = repeatText.t("reader.menu"), tint = GoldLight)
                }
                DropdownMenu(
                    expanded = readerMenuOpen,
                    onDismissRequest = { readerMenuOpen = false }
                ) {
                    DropdownMenuItem(
                        text = { Text(repeatText.t("reader.readText")) },
                        onClick = {
                            showWarshMushaf = false
                            showHafsMadinaMushaf = false
                            showDownloadedPdfMushaf = false
                            showMaknoonWarshMushaf = false
                            showWordByWord = false
                            readerMenuOpen = false
                        }
                    )
                    DropdownMenuItem(
                        text = { Text(repeatText.t("reader.fontSize", arabicFontSize)) },
                        leadingIcon = { Icon(Icons.Default.FormatSize, contentDescription = null) },
                        onClick = {
                            arabicFontSize = (arabicFontSize + 2).coerceAtMost(36)
                            saveReaderArabicFontSize(context, arabicFontSize)
                        }
                    )
                    DropdownMenuItem(
                        text = { Text(repeatText.t("reader.smallerFont")) },
                        onClick = {
                            arabicFontSize = (arabicFontSize - 2).coerceAtLeast(20)
                            saveReaderArabicFontSize(context, arabicFontSize)
                        }
                    )
                    DropdownMenuItem(
                        text = { Text(repeatText.t("reader.backToSurahs")) },
                        leadingIcon = { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null) },
                        onClick = {
                            readerMenuOpen = false
                            onBack()
                        }
                    )
                    DropdownMenuItem(
                        text = { Text(repeatText.t("reader.ayahBookmarks", bookmarkedAyahs.size)) },
                        enabled = bookmarkedAyahs.isNotEmpty(),
                        onClick = {
                            readerMenuOpen = false
                            showBookmarkList = true
                        }
                    )
                    if (surahCardResId != 0) {
                        DropdownMenuItem(
                            text = { Text(repeatText.t(if (showSurahCard) "reader.hideCard" else "reader.showCard")) },
                            onClick = {
                                showSurahCard = !showSurahCard
                                if (showSurahCard) {
                                    showWarshMushaf = false
                                    showHafsMadinaMushaf = false
                                    showDownloadedPdfMushaf = false
                                    showWordByWord = false
                                }
                                readerMenuOpen = false
                            }
                        )
                    }
                    if (hasHafsMadinaMushaf) {
                        DropdownMenuItem(
                            text = { Text(repeatText.t("reader.showMushaf", "Hafs Madina")) },
                            onClick = {
                                showHafsMadinaMushaf = true
                                showWarshMushaf = false
                                showDownloadedPdfMushaf = false
                                showMaknoonWarshMushaf = false
                                showWordByWord = false
                                readerMenuOpen = false
                            }
                        )
                    }
                    if (hasDownloadedPdfMushaf) {
                        DropdownMenuItem(
                            text = { Text(repeatText.t("reader.showMushaf", mushafDisplayName(mushafMode))) },
                            onClick = {
                                showDownloadedPdfMushaf = true
                                showWarshMushaf = false
                                showHafsMadinaMushaf = false
                                showMaknoonWarshMushaf = false
                                showWordByWord = false
                                readerMenuOpen = false
                            }
                        )
                    }
                    if (hasMaknoonWarshMushaf) {
                        DropdownMenuItem(
                            text = { Text(repeatText.t("reader.showMushaf", "Warsh - Maknoon")) },
                            onClick = {
                                showMaknoonWarshMushaf = true
                                showWarshMushaf = false
                                showHafsMadinaMushaf = false
                                showDownloadedPdfMushaf = false
                                showWordByWord = false
                                readerMenuOpen = false
                            }
                        )
                    }
                    if (hasWordByWord) {
                        DropdownMenuItem(
                            text = { Text(repeatText.t("reader.showWordByWord")) },
                            onClick = {
                                showWordByWord = true
                                showWarshMushaf = false
                                showHafsMadinaMushaf = false
                                showDownloadedPdfMushaf = false
                                showMaknoonWarshMushaf = false
                                readerMenuOpen = false
                            }
                        )
                    }
                }
            }
        }

        selectedAyahAction?.let { action ->
            val toolbarTop = with(density) {
                val selectedY = selectedAyahToolbarY ?: (configuration.screenHeightDp.dp.toPx() * 0.58f)
                (selectedY + 8.dp.toPx())
                    .toDp()
                    .coerceIn(72.dp, (configuration.screenHeightDp.dp - 150.dp).coerceAtLeast(72.dp))
            }
            AyahSelectionToolbar(
                action = action,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .offset(y = toolbarTop),
                onCopy = copySelectedAyah,
                onBookmark = toggleSelectedAyahBookmark,
                onShare = shareSelectedAyah,
                onNotes = {
                    selectedAyahAction = null
                    onOpenNotes(action.surahId, action.ayahNumber)
                },
                onWords = {
                    action.wordInfo?.let { info ->
                        selectedAyahInfo = info
                        selectedAyahAction = null
                    }
                },
                onRepeat = {
                    selectedAyahAction = null
                    repeatSurah = action.surahId
                    repeatInitialAyah = if (!mushafMode.startsWith("warsh")) action.ayahNumber else null
                    audioPlayer.repeatSheetRequested = true
                },
                onPlay = {
                    selectedAyahAction = null
                    playAudio()
                }
            )
        }

        if (audioOptions.isNotEmpty() && (!audioPlayer.isVisible || !isCurrentAudio) && audioPlayer.selectionTitle == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(end = ReaderOverlayStyle.audioPadding, bottom = ReaderOverlayStyle.audioPadding),
                contentAlignment = Alignment.BottomEnd
            ) {
                SmallFloatingActionButton(
                    onClick = {
                        repeatSurah = chapter.id
                        repeatInitialAyah = null
                        playAudio(startWhenReady = false)
                        audioPlayer.playerSheetRequested = true
                    },
                    modifier = Modifier
                        .size(ReaderOverlayStyle.audioButton)
                        .border(1.dp, Gold.copy(alpha = 0.5f), RoundedCornerShape(ReaderOverlayStyle.roundButton)),
                    containerColor = DeepNavy.copy(alpha = ReaderOverlayStyle.audioAlpha),
                    contentColor = GoldLight
                ) {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = "Speel ${ALL_SURAHS.firstOrNull { it.id == chapter.id }?.name ?: "soera ${chapter.id}"} af",
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
        }
        if (showWarshMushaf && currentWarshPage != null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(end = ReaderOverlayStyle.audioPadding, bottom = 104.dp),
                contentAlignment = Alignment.BottomEnd
            ) {
                BookmarkIconButton(
                    isBookmarked = bookmarkedWarshPages.contains(currentWarshPage),
                    onClick = {
                        currentWarshPage?.let { page ->
                            val updated = bookmarkedWarshPages.toggle(page)
                            bookmarkedWarshPages = updated
                            saveWarshPageBookmarks(context, chapter.id, updated)
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun TransparentWarshAudioBar(
    isPlaying: Boolean,
    isPreparing: Boolean,
    positionMs: Int,
    durationMs: Int,
    playbackSpeed: Float,
    onInteraction: () -> Unit,
    onSpeedChange: (Float) -> Unit,
    onPlayStop: () -> Unit,
    onSeek: (Int) -> Unit,
    onSkip: (Int) -> Unit
) {
    var speedMenuOpen by remember { mutableStateOf(false) }
    val speedOptions = remember {
        listOf(0.75f, 1f, 1.25f, 1.5f, 2f)
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(ReaderOverlayStyle.roundButton))
            .background(DeepNavy.copy(alpha = 0.34f))
            .border(1.dp, Gold.copy(alpha = 0.18f), RoundedCornerShape(ReaderOverlayStyle.roundButton))
            .clickable { onInteraction() }
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Box(
            modifier = Modifier
                .size(AppComponentDefaults.minTouchTarget)
                .clip(RoundedCornerShape(ReaderOverlayStyle.roundButton))
                .background((if (isPlaying || isPreparing) DeleteRed else Gold).copy(alpha = 0.58f))
                .clickable(onClick = onPlayStop),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (isPlaying || isPreparing) Icons.Default.Stop else Icons.Default.PlayArrow,
                contentDescription = if (isPlaying || isPreparing) "Stop audio" else "Speel audio af",
                tint = DarkNavy,
                modifier = Modifier.size(22.dp)
            )
        }

        AudioSkipButton(label = "-10", onClick = { onSkip(-10_000) })

        Column(modifier = Modifier.weight(1f)) {
            Slider(
                value = if (durationMs > 0) positionMs.coerceIn(0, durationMs).toFloat() else 0f,
                onValueChange = {
                    onInteraction()
                    if (durationMs > 0) onSeek(it.toInt())
                },
                valueRange = 0f..(durationMs.takeIf { it > 0 } ?: 1).toFloat(),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(24.dp),
                colors = SliderDefaults.colors(
                    thumbColor = Gold,
                    activeTrackColor = Gold,
                    inactiveTrackColor = BorderNavy.copy(alpha = 0.42f)
                )
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(formatAudioTime(positionMs), fontSize = 10.sp, color = GoldLight)
                Text(formatAudioTime(durationMs), fontSize = 10.sp, color = MutedGold)
            }
        }

        AudioSkipButton(label = "+10", onClick = { onSkip(10_000) })

        Box {
            TextButton(
                onClick = {
                    onInteraction()
                    speedMenuOpen = true
                },
                shape = RoundedCornerShape(AppShape.control),
                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp),
                colors = ButtonDefaults.textButtonColors(contentColor = GoldLight)
            ) {
                Text("${"%.2f".format(playbackSpeed)}x", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
            DropdownMenu(
                expanded = speedMenuOpen,
                onDismissRequest = { speedMenuOpen = false }
            ) {
                speedOptions.forEach { speed ->
                    DropdownMenuItem(
                        text = { Text("${"%.2f".format(speed)}x") },
                        onClick = {
                            onSpeedChange(speed)
                            speedMenuOpen = false
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun AudioSkipButton(label: String, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(AppComponentDefaults.minTouchTarget)
            .clip(RoundedCornerShape(AppShape.control))
            .background(DeepNavy.copy(alpha = 0.28f))
            .border(1.dp, Gold.copy(alpha = 0.20f), RoundedCornerShape(AppShape.control))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(label, fontSize = 10.sp, color = GoldLight, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun SurahAudioControls(
    audioOptions: List<SurahAudioOption>,
    selectedAudio: SurahAudioOption?,
    onSelectAudio: (SurahAudioOption) -> Unit,
    status: String,
    positionMs: Int,
    durationMs: Int,
    onSeek: (Int) -> Unit
) {
    var menuOpen by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MidNavy.copy(alpha = 0.88f))
            .padding(horizontal = AppSpacing.list, vertical = 6.dp)
    ) {
        Box(modifier = Modifier.fillMaxWidth()) {
            OutlinedButton(
                onClick = { menuOpen = true },
                modifier = Modifier.fillMaxWidth().height(44.dp),
                shape = RoundedCornerShape(AppShape.control),
                contentPadding = PaddingValues(horizontal = AppSpacing.list, vertical = 4.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight)
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        selectedAudio?.reciterName ?: "Kies reciteur",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        selectedAudio?.rewayaName ?: "Riwāyah",
                        fontSize = 10.sp,
                        color = MutedGold
                    )
                }
            }
            DropdownMenu(
                expanded = menuOpen,
                onDismissRequest = { menuOpen = false }
            ) {
                audioOptions.forEach { option ->
                    DropdownMenuItem(
                        text = {
                            Column {
                                Text(option.reciterName)
                                Text(option.rewayaName, fontSize = 11.sp, color = MutedGold)
                            }
                        },
                        onClick = {
                            onSelectAudio(option)
                            menuOpen = false
                        }
                    )
                }
            }
        }

        if (status.isNotBlank()) {
            Text(
                status,
                fontSize = 10.sp,
                color = MutedGold,
                maxLines = 1,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
        if (durationMs > 0) {
            Slider(
                value = positionMs.coerceIn(0, durationMs).toFloat(),
                onValueChange = { onSeek(it.toInt()) },
                valueRange = 0f..durationMs.toFloat(),
                modifier = Modifier.fillMaxWidth().height(28.dp)
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(formatAudioTime(positionMs), fontSize = 11.sp, color = MutedGold)
                Text(formatAudioTime(durationMs), fontSize = 11.sp, color = MutedGold)
            }
        }
    }
}

fun formatAudioTime(ms: Int): String {
    val totalSeconds = (ms / 1000).coerceAtLeast(0)
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return "$minutes:${seconds.toString().padStart(2, '0')}"
}

fun ayahListIndexOffset(chapterId: Int, hasSurahCard: Boolean): Int {
    val cardOffset = if (hasSurahCard) 1 else 0
    val basmalaOffset = if (chapterId != 9 && chapterId != 1) 1 else 0
    return cardOffset + basmalaOffset
}

@Composable
fun ReaderBookmarkDialog(
    showWarshMushaf: Boolean,
    ayahBookmarks: Set<Int>,
    warshPageBookmarks: Set<Int>,
    warshPageResIds: List<Pair<Int, Int>>,
    onSelectAyah: (Int) -> Unit,
    onSelectWarshPage: (Int) -> Unit,
    onDismiss: () -> Unit
) {
    val sortedBookmarks = if (showWarshMushaf) {
        warshPageBookmarks.sorted()
    } else {
        ayahBookmarks.sorted()
    }
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        titleContentColor = GoldLight,
        textContentColor = SoftTextGold,
        title = {
            Text("Bladwijzers", fontSize = 18.sp, fontWeight = FontWeight.Bold)
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 360.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                if (sortedBookmarks.isEmpty()) {
                    Text("Nog geen bladwijzers.", fontSize = 13.sp, color = MutedGold)
                } else {
                    sortedBookmarks.forEach { value ->
                        val existsInWarsh = !showWarshMushaf || warshPageResIds.any { it.first == value }
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 6.dp)
                                .clip(RoundedCornerShape(AppShape.control))
                                .background(DeepNavy)
                                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                                .clickable(enabled = existsInWarsh) {
                                    if (showWarshMushaf) onSelectWarshPage(value) else onSelectAyah(value)
                                }
                                .padding(horizontal = AppSpacing.list, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Bookmark,
                                contentDescription = null,
                                tint = Gold,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                if (showWarshMushaf) "Pagina $value" else "Ayah $value",
                                fontSize = 13.sp,
                                color = GoldLight,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Sluiten", color = Gold)
            }
        }
    )
}

@Composable
fun AudioPickerDialog(
    audioOptions: List<SurahAudioOption>,
    selectedAudio: SurahAudioOption?,
    onSelectAudio: (SurahAudioOption) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        titleContentColor = GoldLight,
        textContentColor = SoftTextGold,
        title = {
            Text("Reciteur kiezen", fontSize = 18.sp, fontWeight = FontWeight.Bold)
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 420.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                audioOptions.forEach { option ->
                    val selected = option == selectedAudio
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 6.dp)
                            .clip(RoundedCornerShape(AppShape.control))
                            .background(if (selected) StrongGoldSurface else DeepNavy)
                            .border(
                                1.dp,
                                if (selected) Gold else BorderNavy,
                                RoundedCornerShape(AppShape.control)
                            )
                            .clickable { onSelectAudio(option) }
                            .padding(horizontal = AppSpacing.list, vertical = 10.dp)
                    ) {
                        Text(
                            option.reciterName,
                            fontSize = 13.sp,
                            color = GoldLight,
                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
                        )
                        Text(
                            option.rewayaName,
                            fontSize = 11.sp,
                            color = MutedGold
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Sluiten", color = Gold)
            }
        }
    )
}

fun warshPagesForSurah(surahId: Int): IntRange = when (surahId) {
    1 -> 1..1
    2 -> 2..48
    3 -> 48..74
    4 -> 75..104
    5 -> 104..126
    6 -> 126..150
    7 -> 150..176
    8 -> 177..186
    9 -> 187..207
    10 -> 207..221
    11 -> 221..236
    12 -> 236..249
    13 -> 250..256
    14 -> 256..263
    15 -> 263..269
    16 -> 269..284
    17 -> 284..296
    18 -> 297..309
    19 -> 309..316
    20 -> 317..327
    21 -> 327..337
    22 -> 337..347
    23 -> 347..356
    24 -> 356..366
    25 -> 366..373
    26 -> 374..385
    27 -> 385..394
    28 -> 394..405
    29 -> 405..413
    30 -> 413..420
    31 -> 420..424
    32 -> 424..427
    33 -> 427..438
    34 -> 438..444
    35 -> 445..451
    36 -> 451..457
    37 -> 457..465
    38 -> 465..471
    39 -> 471..480
    40 -> 480..490
    41 -> 490..496
    42 -> 497..503
    43 -> 503..510
    44 -> 510..513
    45 -> 513..517
    46 -> 517..522
    47 -> 522..527
    48 -> 527..531
    49 -> 532..534
    50 -> 535..537
    51 -> 538..540
    52 -> 541..543
    53 -> 543..546
    54 -> 546..549
    55 -> 550..553
    56 -> 553..557
    57 -> 557..561
    58 -> 562..565
    59 -> 566..569
    60 -> 570..572
    61 -> 572..574
    62 -> 574..576
    63 -> 576..577
    64 -> 578..579
    65 -> 580..582
    66 -> 582..584
    67 -> 584..587
    68 -> 587..590
    69 -> 590..592
    70 -> 593..595
    71 -> 595..597
    72 -> 597..599
    73 -> 599..601
    74 -> 601..603
    75 -> 604..605
    76 -> 605..607
    77 -> 607..609
    78 -> 609..611
    79 -> 611..613
    80 -> 613..615
    81 -> 615..616
    82 -> 616..617
    83 -> 617..618
    84 -> 618..619
    85 -> 620..621
    86 -> 621..621
    87 -> 622..622
    88 -> 623..623
    89 -> 624..625
    90 -> 625..626
    91 -> 626..627
    92 -> 627..627
    93 -> 628..628
    94 -> 628..628
    95 -> 629..629
    96 -> 629..630
    97 -> 630..630
    98 -> 631..631
    99 -> 632..632
    100 -> 632..632
    101 -> 633..633
    102 -> 633..634
    103 -> 634..634
    104 -> 634..635
    105 -> 635..635
    106 -> 635..635
    107 -> 636..636
    108 -> 636..636
    109 -> 637..637
    110 -> 637..637
    111 -> 637..637
    112 -> 638..638
    113 -> 638..638
    114 -> 638..638
    else -> IntRange.EMPTY
}

fun hafsMadinaPagesForSurah(surahId: Int): IntRange = when (surahId) {
    1 -> 1..1
    2 -> 2..49
    3 -> 50..76
    4 -> 77..105
    5 -> 106..127
    6 -> 128..150
    7 -> 151..176
    8 -> 177..186
    9 -> 187..207
    10 -> 208..220
    11 -> 221..234
    12 -> 235..248
    13 -> 249..254
    14 -> 255..261
    15 -> 262..266
    16 -> 267..281
    17 -> 282..292
    18 -> 293..304
    19 -> 305..311
    20 -> 312..321
    21 -> 322..331
    22 -> 332..341
    23 -> 342..349
    24 -> 350..358
    25 -> 359..366
    26 -> 367..376
    27 -> 377..384
    28 -> 385..395
    29 -> 396..403
    30 -> 404..410
    31 -> 411..414
    32 -> 415..417
    33 -> 418..427
    34 -> 428..433
    35 -> 434..439
    36 -> 440..445
    37 -> 446..452
    38 -> 453..457
    39 -> 458..466
    40 -> 467..476
    41 -> 477..482
    42 -> 483..488
    43 -> 489..495
    44 -> 496..498
    45 -> 499..501
    46 -> 502..506
    47 -> 507..510
    48 -> 511..514
    49 -> 515..517
    50 -> 518..519
    51 -> 520..522
    52 -> 523..525
    53 -> 526..527
    54 -> 528..530
    55 -> 531..533
    56 -> 534..536
    57 -> 537..541
    58 -> 542..544
    59 -> 545..548
    60 -> 549..550
    61 -> 551..552
    62 -> 553..553
    63 -> 554..555
    64 -> 556..557
    65 -> 558..559
    66 -> 560..561
    67 -> 562..563
    68 -> 564..565
    69 -> 566..567
    70 -> 568..569
    71 -> 570..571
    72 -> 572..573
    73 -> 574..574
    74 -> 575..576
    75 -> 577..577
    76 -> 578..579
    77 -> 580..581
    78 -> 582..582
    79 -> 583..584
    80 -> 585..585
    81 -> 586..586
    82 -> 587..587
    83 -> 587..588
    84 -> 589..589
    85 -> 590..590
    86 -> 591..591
    87 -> 591..591
    88 -> 592..592
    89 -> 593..593
    90 -> 594..594
    91 -> 595..595
    92 -> 595..595
    93 -> 596..596
    94 -> 596..596
    95 -> 597..597
    96 -> 597..597
    97 -> 598..598
    98 -> 598..598
    99 -> 599..599
    100 -> 599..599
    101 -> 600..600
    102 -> 600..600
    103 -> 601..601
    104 -> 601..601
    105 -> 601..601
    106 -> 602..602
    107 -> 602..602
    108 -> 602..602
    109 -> 603..603
    110 -> 603..603
    111 -> 603..603
    112 -> 604..604
    113 -> 604..604
    114 -> 604..604
    else -> IntRange.EMPTY
}

fun loadWordByWordAyahs(context: Context, surahId: Int): List<WordByWordAyah> {
    return try {
        val json = context.assets.open("word_by_word_surah_$surahId.json")
            .bufferedReader()
            .use { it.readText() }
        val array = JSONArray(json)
        List(array.length()) { ayahIndex ->
            val item = array.getJSONObject(ayahIndex)
            val wordsArray = item.getJSONArray("words")
            WordByWordAyah(
                ayah = item.getInt("ayah"),
                e3rab = item.optString("e3rab"),
                words = List(wordsArray.length()) { wordIndex ->
                    val word = wordsArray.getJSONObject(wordIndex)
                    QuranWord(
                        position = word.getInt("position"),
                        arabic = word.getString("arabic"),
                        translation = word.optString("translation"),
                        transliteration = word.optString("transliteration")
                    )
                }
            )
        }
    } catch (e: Exception) {
        emptyList()
    }
}

fun loadWordInfoByKey(
    context: Context,
    surahIds: List<Int>,
    currentSurahId: Int? = null,
    currentSurahAyahs: List<WordByWordAyah> = emptyList()
): Map<Pair<Int, Int>, WordByWordAyah> =
    buildMap {
        surahIds.forEach { surahId ->
            val ayahs = if (surahId == currentSurahId && currentSurahAyahs.isNotEmpty()) {
                currentSurahAyahs
            } else {
                loadWordByWordAyahs(context, surahId)
            }
            ayahs.forEach { ayah ->
                put(surahId to ayah.ayah, ayah)
            }
        }
    }

fun loadSurahAudioOptions(context: Context, surahId: Int): List<SurahAudioOption> {
    return try {
        val json = context.assets.open("audio_surah_$surahId.json")
            .bufferedReader()
            .use { it.readText() }
        val array = JSONArray(json)
        List(array.length()) { index ->
            val item = array.getJSONObject(index)
            SurahAudioOption(
                reciterName = item.getJSONObject("reciter").getString("en"),
                rewayaName = item.getJSONObject("rewaya").getString("en"),
                link = item.getString("link")
            )
        }
    } catch (e: Exception) {
        emptyList()
    }
}

fun loadWarshPagePositions(context: Context, page: Int): List<WarshAyahPosition> {
    return try {
        val js = context.assets.open("coordinate_muhammadi.js")
            .bufferedReader()
            .use { it.readText() }
        val start = js.indexOf('[')
        val end = js.lastIndexOf(']')
        if (start == -1 || end == -1 || end <= start) return emptyList()
        val root = JSONArray(js.substring(start, end + 1))
        if (page < 0 || page >= root.length()) return emptyList()
        val pageArray = root.optJSONArray(page) ?: return emptyList()
        buildWarshOverlayPositions(pageArray)
    } catch (e: Exception) {
        emptyList()
    }
}

fun buildWarshOverlayPositions(pageArray: JSONArray): List<WarshAyahPosition> {
    val positions = mutableListOf<WarshAyahPosition>()
    if (pageArray.length() == 0) return positions

    val originalWidth = 456f
    val originalHeight = 990f
    val lineCount = 15f
    val lineHeight = originalHeight / lineCount
    val leftMargin = 15f
    var previousLine = 0
    var previousLeft = originalWidth

    for (index in 0 until pageArray.length()) {
        val item = pageArray.getJSONArray(index)
        val surahId = item.getInt(0)
        val ayahNumber = item.getInt(1)
        val rawLeft = item.getDouble(2).toFloat()
        val rawTop = item.getDouble(3).toFloat()
        val left = (rawLeft - leftMargin).coerceIn(0f, originalWidth)
        val line = (rawTop / lineHeight).toInt().coerceIn(0, 14)
        val lineDistance = line - previousLine

        fun addSegment(segmentLeft: Float, segmentLine: Int, segmentWidth: Float) {
            if (segmentWidth <= 0f) return
            positions.add(
                WarshAyahPosition(
                    surahId = surahId,
                    ayahNumber = ayahNumber,
                    rawLeft = segmentLeft / originalWidth,
                    line = segmentLine,
                    rawWidth = segmentWidth / originalWidth
                )
            )
        }

        if (index == 0) {
            addSegment(left, line, originalWidth - left)
        } else if (lineDistance <= 0) {
            addSegment(left, line, previousLeft - left)
        } else if (lineDistance == 1) {
            addSegment(left, line, originalWidth - left)
            addSegment(0f, previousLine, previousLeft)
        } else if (lineDistance > 1) {
            addSegment(left, line, originalWidth - left)
            addSegment(0f, previousLine, previousLeft)
            for (extraLine in (previousLine + 1) until line) {
                addSegment(0f, extraLine, originalWidth)
            }
        }

        previousLine = line
        previousLeft = left
    }

    return positions
}

fun loadAyahBookmarks(context: Context, surahId: Int): Set<Int> {
    val prefs = context.getSharedPreferences("reader_bookmarks", Context.MODE_PRIVATE)
    return prefs.getStringSet("ayah_bookmarks_$surahId", emptySet()).orEmpty()
        .mapNotNull { it.toIntOrNull() }
        .toSet()
}

fun saveAyahBookmarks(context: Context, surahId: Int, bookmarks: Set<Int>) {
    val prefs = context.getSharedPreferences("reader_bookmarks", Context.MODE_PRIVATE)
    prefs.edit()
        .putStringSet("ayah_bookmarks_$surahId", bookmarks.map { it.toString() }.toSet())
        .apply()
}

fun loadWarshPageBookmarks(context: Context, surahId: Int): Set<Int> {
    val prefs = context.getSharedPreferences("reader_bookmarks", Context.MODE_PRIVATE)
    return prefs.getStringSet("warsh_page_bookmarks_$surahId", emptySet()).orEmpty()
        .mapNotNull { it.toIntOrNull() }
        .toSet()
}

fun saveWarshPageBookmarks(context: Context, surahId: Int, bookmarks: Set<Int>) {
    val prefs = context.getSharedPreferences("reader_bookmarks", Context.MODE_PRIVATE)
    prefs.edit()
        .putStringSet("warsh_page_bookmarks_$surahId", bookmarks.map { it.toString() }.toSet())
        .apply()
}

fun loadLastReadAyah(context: Context, surahId: Int): Int? {
    val value = context
        .getSharedPreferences("reader_state", Context.MODE_PRIVATE)
        .getInt("last_read_ayah_$surahId", 0)
    return value.takeIf { it > 0 }
}

fun saveLastReadAyah(context: Context, surahId: Int, ayahNumber: Int) {
    context.getSharedPreferences("reader_state", Context.MODE_PRIVATE)
        .edit()
        .putInt("last_read_surah", surahId)
        .putInt("last_read_ayah_$surahId", ayahNumber)
        .apply()
}

fun loadReaderArabicFontSize(context: Context): Int =
    context.getSharedPreferences("reader_state", Context.MODE_PRIVATE)
        .getInt("arabic_font_size", 26)
        .coerceIn(20, 36)

fun saveReaderArabicFontSize(context: Context, fontSize: Int) {
    context.getSharedPreferences("reader_state", Context.MODE_PRIVATE)
        .edit()
        .putInt("arabic_font_size", fontSize.coerceIn(20, 36))
        .apply()
}

fun Set<Int>.toggle(value: Int): Set<Int> {
    return if (contains(value)) this - value else this + value
}

fun loadHafsMadinaPagePositions(context: Context, page: Int): List<HafsAyahPosition> {
    return try {
        val dbFile = ensureHafsAyahInfoDatabase(context)
        val db = SQLiteDatabase.openDatabase(
            dbFile.absolutePath,
            null,
            SQLiteDatabase.OPEN_READONLY or SQLiteDatabase.NO_LOCALIZED_COLLATORS
        )
        db.use { database ->
            database.rawQuery(
                """
                SELECT sura_number, ayah_number, line_number,
                       MIN(min_x), MIN(min_y), MAX(max_x), MAX(max_y)
                FROM glyphs
                WHERE page_number = ?
                GROUP BY sura_number, ayah_number, line_number
                ORDER BY sura_number, ayah_number, line_number
                """.trimIndent(),
                arrayOf(page.toString())
            ).use { cursor ->
                buildList {
                    while (cursor.moveToNext()) {
                        val minX = cursor.getFloat(3)
                        val minY = cursor.getFloat(4)
                        val maxX = cursor.getFloat(5)
                        val maxY = cursor.getFloat(6)
                        add(
                            HafsAyahPosition(
                                surahId = cursor.getInt(0),
                                ayahNumber = cursor.getInt(1),
                                left = (minX / 1260f).coerceIn(0f, 1f),
                                top = (minY / 1834f).coerceIn(0f, 1f),
                                width = ((maxX - minX) / 1260f).coerceIn(0f, 1f),
                                height = ((maxY - minY) / 1834f).coerceIn(0f, 1f)
                            )
                        )
                    }
                }
            }
        }
    } catch (e: Exception) {
        emptyList()
    }
}

fun ensureHafsAyahInfoDatabase(context: Context): File {
    val target = File(context.filesDir, "hafs_ayahinfo_1260.db")
    if (!target.exists() || target.length() == 0L) {
        context.assets.open("hafs_ayahinfo_1260.db").use { input ->
            target.outputStream().use { output ->
                input.copyTo(output)
            }
        }
    }
    return target
}

fun downloadedPdfPagesForSurah(
    mushafMode: String,
    pageCount: Int,
    fallbackPages: IntRange
): List<Int> {
    if (pageCount <= 0) return emptyList()
    if (mushafMode == "hafs_indopak_15") return (1..pageCount).toList()
    val startPage = fallbackPages.first.takeIf { it in 1..pageCount } ?: 1
    return (startPage..pageCount).toList()
}

fun downloadedMaknoonPagesForSurah(fallbackPages: IntRange): List<Int> =
    (fallbackPages.first..604).toList()

fun File.pdfPageCount(): Int {
    if (!exists() || length() <= 0L) return 0
    return ParcelFileDescriptor.open(this, ParcelFileDescriptor.MODE_READ_ONLY).use { descriptor ->
        PdfRenderer(descriptor).use { renderer ->
            renderer.pageCount
        }
    }
}

data class PdfCropProfile(
    val left: Float,
    val top: Float,
    val right: Float,
    val bottom: Float
)

private val mushafBitmapCache = object : LruCache<String, Bitmap>(24 * 1024) {
    override fun sizeOf(key: String, value: Bitmap): Int = value.byteCount / 1024
}

fun pdfCropProfileForMushaf(mushafMode: String, pageNumber: Int): PdfCropProfile =
    when (mushafMode) {
        "warsh_quran_world" -> {
            val sideShift = 0.035f
            val baseSide = 0.115f
            val isOddPage = pageNumber % 2 == 1
            PdfCropProfile(
                left = if (isOddPage) baseSide - sideShift else baseSide + sideShift,
                top = 0.085f,
                right = if (isOddPage) baseSide + sideShift else baseSide - sideShift,
                bottom = 0.095f
            )
        }
        else -> PdfCropProfile(
            left = 0.055f,
            top = 0.045f,
            right = 0.055f,
            bottom = 0.055f
        )
    }

fun renderPdfPage(
    pdfFile: File,
    pageNumber: Int,
    cropProfile: PdfCropProfile,
    targetWidth: Int = 1440
): Bitmap? {
    if (!pdfFile.exists() || pdfFile.length() <= 0L || pageNumber <= 0) return null
    return ParcelFileDescriptor.open(pdfFile, ParcelFileDescriptor.MODE_READ_ONLY).use { descriptor ->
        PdfRenderer(descriptor).use { renderer ->
            if (pageNumber > renderer.pageCount) return@use null
            renderer.openPage(pageNumber - 1).use { page ->
                val cropLeft = page.width * cropProfile.left
                val cropTop = page.height * cropProfile.top
                val cropWidth = page.width * (1f - cropProfile.left - cropProfile.right)
                val cropHeight = page.height * (1f - cropProfile.top - cropProfile.bottom)
                val scale = targetWidth.toFloat() / cropWidth
                val targetHeight = (cropHeight * scale).toInt().coerceAtLeast(1)
                val matrix = Matrix().apply {
                    setScale(scale, scale)
                    postTranslate(-cropLeft * scale, -cropTop * scale)
                }
                Bitmap.createBitmap(targetWidth, targetHeight, Bitmap.Config.ARGB_8888).also { bitmap ->
                    bitmap.eraseColor(android.graphics.Color.WHITE)
                    page.render(bitmap, null, matrix, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                }
            }
        }
    }
}

fun hafsSurahStartScrollFraction(
    positions: List<HafsAyahPosition>,
    surahId: Int?
): Float {
    if (surahId == null) return 0f
    val firstTop = positions
        .filter { it.surahId == surahId }
        .minOfOrNull { it.top } ?: return 0f
    return (firstTop - 0.14f).coerceIn(0f, 0.62f)
}

fun warshSurahStartScrollFraction(
    positions: List<WarshAyahPosition>,
    surahId: Int?
): Float {
    if (surahId == null) return 0f
    val firstLine = positions
        .filter { it.surahId == surahId }
        .minOfOrNull { it.line } ?: return 0f
    return ((firstLine / 15f) - 0.10f).coerceIn(0f, 0.62f)
}

data class MushafAyahTarget(
    val page: Int,
    val scrollFraction: Float
)

fun findHafsAyahMushafTarget(
    context: Context,
    surahId: Int,
    ayahNumber: Int,
    pages: List<Int>
): MushafAyahTarget? {
    for (page in pages) {
        val position = loadHafsMadinaPagePositions(context, page)
            .filter { it.surahId == surahId && it.ayahNumber == ayahNumber }
            .minByOrNull { it.top }
        if (position != null) {
            return MushafAyahTarget(
                page = page,
                scrollFraction = (position.top - 0.14f).coerceIn(0f, 0.62f)
            )
        }
    }
    return null
}

fun findWarshAyahMushafTarget(
    context: Context,
    surahId: Int,
    ayahNumber: Int,
    pages: List<Int>
): MushafAyahTarget? {
    for (page in pages) {
        val position = loadWarshPagePositions(context, page)
            .filter { it.surahId == surahId && ayahNumber in WarshAyahReferences.hafsAyahs(context, surahId, it.ayahNumber) }
            .minByOrNull { it.line }
        if (position != null) {
            return MushafAyahTarget(
                page = page,
                scrollFraction = ((position.line / 15f) - 0.10f).coerceIn(0f, 0.62f)
            )
        }
    }
    return null
}

@Composable
fun DownloadedPdfMushafPage(
    pdfFile: File,
    pageNumber: Int,
    mushafMode: String,
    modifier: Modifier = Modifier
) {
    val cropProfile = remember(mushafMode, pageNumber) { pdfCropProfileForMushaf(mushafMode, pageNumber) }
    val pageAspectRatio = remember(cropProfile) {
        val baseRatio = ReaderInfoStyle.hafsMadinaPageRatio
        val vertical = 1f - cropProfile.top - cropProfile.bottom
        val horizontal = 1f - cropProfile.left - cropProfile.right
        baseRatio * (vertical / horizontal)
    }
    val cacheKey = remember(pdfFile, pageNumber, cropProfile) {
        "pdf:${pdfFile.absolutePath}:${pdfFile.lastModified()}:$pageNumber:$cropProfile"
    }
    val rendered by produceState<Bitmap?>(initialValue = mushafBitmapCache.get(cacheKey), cacheKey) {
        if (value == null) {
            value = withContext(Dispatchers.IO) {
                renderPdfPage(pdfFile, pageNumber, cropProfile)?.also { mushafBitmapCache.put(cacheKey, it) }
            }
        }
    }

    Box(
        modifier = modifier
            .background(Color.White)
            .fillMaxWidth()
            .aspectRatio(1f / pageAspectRatio),
        contentAlignment = Alignment.Center
    ) {
        if (rendered == null) {
            CircularProgressIndicator(
                color = Gold,
                modifier = Modifier.padding(48.dp)
            )
        } else {
            Image(
                bitmap = rendered!!.asImageBitmap(),
                contentDescription = "Gedownloade mushaf pagina $pageNumber",
                contentScale = ContentScale.Fit,
                modifier = Modifier.matchParentSize()
            )
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MaknoonWarshMushafPage(
    pageNumber: Int,
    pageFile: File,
    dbHelper: QuranDatabaseHelper,
    currentChapterId: Int,
    ayahs: List<Pair<Int, String>>,
    bookmarkedAyahs: Set<Int>,
    selectedAyahKey: Pair<Int, Int>?,
    onSelectAyah: (Int, Int, String, WordByWordAyah?, Float?) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val cacheKey = remember(pageFile) {
        "maknoon-v2:${pageFile.absolutePath}:${pageFile.lastModified()}"
    }
    val rendered by produceState<Bitmap?>(initialValue = mushafBitmapCache.get(cacheKey), cacheKey) {
        if (value == null) {
            value = withContext(Dispatchers.IO) {
                renderMaknoonPage(pageFile)?.also { mushafBitmapCache.put(cacheKey, it) }
            }
        }
    }
    val isWarsh = !pageFile.extension.equals("png", ignoreCase = true)
    val warshGeometry = remember(pageNumber, isWarsh) {
        if (isWarsh) WarshMaknoonPages.load(context, pageNumber) else null
    }
    val positions = remember(pageNumber, isWarsh) {
        warshGeometry?.positions ?: loadHafsMadinaPagePositions(context, pageNumber)
    }
    val pageRatio = warshGeometry?.let { it.height / it.width }
        ?: (MAKNOON_WARSH_PAGE_HEIGHT / MAKNOON_WARSH_PAGE_WIDTH)
    val ayahTextByNumber = remember(ayahs) { ayahs.toMap() }
    val wordInfoByKey = remember(positions) { loadWordInfoByKey(context, positions.map { it.surahId }.distinct()) }
    val pageCropZoom = if (pageFile.extension.equals("png", ignoreCase = true)) {
        MAKNOON_HAFS_PAGE_CROP_ZOOM
    } else {
        MAKNOON_WARSH_PAGE_ZOOM
    }

    BoxWithConstraints(
        modifier = modifier
            .background(Color.White)
            .fillMaxWidth()
            .clipToBounds()
            .aspectRatio(1f / pageRatio),
        contentAlignment = Alignment.Center
    ) {
        if (rendered == null) {
            CircularProgressIndicator(
                color = Gold,
                modifier = Modifier.padding(48.dp)
            )
        } else {
            Image(
                bitmap = rendered!!.asImageBitmap(),
                contentDescription = "${if (isWarsh) "Warsh" else "Hafs"} Maknoon pagina $pageNumber",
                contentScale = ContentScale.Fit,
                modifier = Modifier
                    .matchParentSize()
                    .graphicsLayer(
                        scaleX = pageCropZoom,
                        scaleY = pageCropZoom
                    )
            )
        }

        val pageHeight = maxWidth * pageRatio
        val cropInsetX = maxWidth * (pageCropZoom - 1f) / 2f
        val cropInsetY = pageHeight * (pageCropZoom - 1f) / 2f

        positions.forEach { position ->
            val refs = if (isWarsh) WarshAyahReferences.hafsAyahs(context, position.surahId, position.ayahNumber)
                else listOf(position.ayahNumber)
            val selection = remember(position.surahId, refs, ayahTextByNumber, wordInfoByKey) {
                resolveMushafSelection(refs, { number ->
                    (if (position.surahId == currentChapterId) ayahTextByNumber[number].orEmpty() else "")
                        .ifBlank { dbHelper.getAyahText(position.surahId, number) }
                }, { number -> wordInfoByKey[position.surahId to number] })
            }
            var ayahBounds by remember(position.surahId, position.ayahNumber, position.top) { mutableStateOf<Rect?>(null) }
            Box(
                modifier = Modifier
                    .align(androidx.compose.ui.AbsoluteAlignment.TopLeft)
                    .absoluteOffset(
                        x = (maxWidth * position.left * pageCropZoom) - cropInsetX,
                        y = (pageHeight * position.top * pageCropZoom) - cropInsetY
                    )
                    .width(maxWidth * position.width * pageCropZoom)
                    .height(pageHeight * position.height * pageCropZoom)
                    .onGloballyPositioned { coordinates ->
                        ayahBounds = coordinates.boundsInRoot()
                    }
                    .combinedClickable(
                        onClick = {
                            onSelectAyah(0, 0, "", null, null)
                        },
                        onLongClick = {
                            onSelectAyah(
                                position.surahId,
                                selection.ayahNumber,
                                selection.text,
                                selection.wordInfo,
                                ayahBounds?.bottom
                            )
                        }
                    )
            )
        }
    }
}

private const val MAKNOON_WARSH_PAGE_WIDTH = 346.35f
private const val MAKNOON_WARSH_PAGE_HEIGHT = 468.71f
private const val MAKNOON_HAFS_PAGE_CROP_ZOOM = 1.15f
private const val MAKNOON_WARSH_PAGE_ZOOM = 1.12f

fun renderMaknoonPage(file: File, targetWidth: Int = 1440): Bitmap? {
    if (file.extension.equals("png", ignoreCase = true)) {
        return BitmapFactory.decodeFile(file.absolutePath)
    }
    return renderMaknoonSvgPage(file, targetWidth)
}

fun renderMaknoonSvgPage(file: File, targetWidth: Int = 1440): Bitmap? =
    runCatching {
        val svgText = readSvgzText(file) ?: return@runCatching null
        val svgStart = svgText.indexOf("<svg")
        val cleanSvg = if (svgStart >= 0) svgText.substring(svgStart) else svgText
        val svg = SVG.getFromString(cleanSvg)
        val viewBox = svg.documentViewBox ?: return@runCatching null
        val targetHeight = (targetWidth * viewBox.height() / viewBox.width()).toInt().coerceAtLeast(1)
        val bitmap = Bitmap.createBitmap(targetWidth, targetHeight, Bitmap.Config.ARGB_8888)
        bitmap.eraseColor(android.graphics.Color.WHITE)
        svg.documentWidth = targetWidth.toFloat()
        svg.documentHeight = targetHeight.toFloat()
        val canvas = Canvas(bitmap)
        // Zoom is applied by Compose to both bitmap and ayah rectangles.
        svg.renderToCanvas(canvas)
        bitmap
    }.getOrNull()

fun readSvgzText(file: File): String? =
    runCatching {
        val bytes = file.readBytes()
        if (bytes.size >= 2 && bytes[0] == 0x1f.toByte() && bytes[1] == 0x8b.toByte()) {
            GZIPInputStream(bytes.inputStream()).use { input ->
                input.readBytes().decodeToString()
            }
        } else {
            bytes.decodeToString()
        }
    }.getOrNull()

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun HafsMadinaMushafPage(
    page: Int,
    resId: Int,
    dbHelper: QuranDatabaseHelper,
    currentChapterId: Int,
    ayahs: List<Pair<Int, String>>,
    wordByWordAyahs: List<WordByWordAyah>,
    bookmarkedAyahs: Set<Int>,
    selectedAyahKey: Pair<Int, Int>?,
    onSelectAyah: (Int, Int, String, WordByWordAyah?, Float?) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val positions = remember(page) { loadHafsMadinaPagePositions(context, page) }
    val ayahTextByNumber = remember(ayahs) { ayahs.toMap() }
    val wordInfoByKey = remember(positions, wordByWordAyahs) {
        loadWordInfoByKey(context, positions.map { it.surahId }.distinct(), currentChapterId, wordByWordAyahs)
    }

    BoxWithConstraints(
        modifier = modifier
            .background(Color.White)
            .aspectRatio(1f / ReaderInfoStyle.hafsMadinaPageRatio)
    ) {
        Image(
            painter = painterResource(id = resId),
            contentDescription = "Hafs Madina pagina $page",
            contentScale = ContentScale.Fit,
            modifier = Modifier.matchParentSize()
        )

        positions.forEach { position ->
            val ayahText = if (position.surahId == currentChapterId) {
                ayahTextByNumber[position.ayahNumber].orEmpty()
            } else {
                ""
            }.ifBlank { dbHelper.getAyahText(position.surahId, position.ayahNumber) }
            val wordInfo = wordInfoByKey[position.surahId to position.ayahNumber]
            val isSelected = selectedAyahKey == (position.surahId to position.ayahNumber)
            var ayahBounds by remember(position.surahId, position.ayahNumber, position.top) { mutableStateOf<Rect?>(null) }
            Box(
                modifier = Modifier
                    .offset(
                        x = maxWidth * position.left,
                        y = maxWidth * ReaderInfoStyle.hafsMadinaPageRatio * position.top
                    )
                    .width(maxWidth * position.width)
                    .height(maxWidth * ReaderInfoStyle.hafsMadinaPageRatio * position.height)
                    .onGloballyPositioned { coordinates ->
                        ayahBounds = coordinates.boundsInRoot()
                    }
                    .combinedClickable(
                        onClick = {
                            onSelectAyah(0, 0, "", null, null)
                        },
                        onLongClick = {
                            onSelectAyah(
                                position.surahId,
                                position.ayahNumber,
                                ayahText,
                                wordInfo,
                                ayahBounds?.bottom
                            )
                        }
                    )
            )
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun WarshMushafPage(
    page: Int,
    resId: Int,
    dbHelper: QuranDatabaseHelper,
    currentChapterId: Int,
    ayahs: List<Pair<Int, String>>,
    wordByWordAyahs: List<WordByWordAyah>,
    bookmarkedAyahs: Set<Int>,
    selectedAyahKey: Pair<Int, Int>?,
    onSelectAyah: (Int, Int, String, WordByWordAyah?, Float?) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val positions = remember(page) { loadWarshPagePositions(context, page) }
    val ayahTextByNumber = remember(ayahs) { ayahs.toMap() }
    val wordInfoByKey = remember(positions, wordByWordAyahs) {
        loadWordInfoByKey(context, positions.map { it.surahId }.distinct(), currentChapterId, wordByWordAyahs)
    }

    BoxWithConstraints(
        modifier = modifier
            .aspectRatio(1f / ReaderInfoStyle.warshPageRatio)
    ) {
        Image(
            painter = painterResource(id = resId),
            contentDescription = "Warsh mushaf pagina $page",
            contentScale = ContentScale.FillBounds,
            modifier = Modifier.matchParentSize()
        )

        val overlayHeight = maxWidth * ReaderInfoStyle.warshPageRatio - 25.dp
        val lineHeight = (overlayHeight / 15f) + 0.3.dp

        positions.forEach { position ->
            val refs = WarshAyahReferences.hafsAyahs(context, position.surahId, position.ayahNumber)
            val selection = remember(position.surahId, refs, ayahTextByNumber, wordInfoByKey) {
                resolveMushafSelection(refs, { number ->
                    (if (position.surahId == currentChapterId) ayahTextByNumber[number].orEmpty() else "")
                        .ifBlank { dbHelper.getAyahText(position.surahId, number) }
                }, { number -> wordInfoByKey[position.surahId to number] })
            }
            var ayahBounds by remember(position.surahId, position.ayahNumber, position.line, position.rawLeft) { mutableStateOf<Rect?>(null) }
            Box(
                modifier = Modifier
                    .offset(
                        x = (maxWidth * position.rawLeft) - 15.dp,
                        y = (lineHeight * position.line) + 4.2.dp
                    )
                    .width(maxWidth * position.rawWidth)
                    .height(lineHeight)
                    .onGloballyPositioned { coordinates ->
                        ayahBounds = coordinates.boundsInRoot()
                    }
                    .combinedClickable(
                        onClick = {
                            onSelectAyah(0, 0, "", null, null)
                        },
                        onLongClick = {
                            onSelectAyah(
                                position.surahId,
                                selection.ayahNumber,
                                selection.text,
                                selection.wordInfo,
                                ayahBounds?.bottom
                            )
                        }
                    )
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun WordByWordAyahCard(
    ayah: WordByWordAyah,
    onWordClick: (QuranWord) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = AppSpacing.list)
            .clip(RoundedCornerShape(AppShape.tile))
            .background(MidNavy)
            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.tile))
            .padding(AppSpacing.compactCard)
    ) {
        Text(
            "Ayah ${ayah.ayah}",
            fontSize = 11.sp,
            color = MutedGold,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.End
        )
        Spacer(modifier = Modifier.height(8.dp))
        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            ayah.words.forEach { word ->
                Column(
                    modifier = Modifier
                        .padding(start = 6.dp, bottom = 6.dp)
                        .clip(RoundedCornerShape(AppShape.smallControl))
                        .background(DeepNavy.copy(alpha = 0.78f))
                        .border(1.dp, Gold.copy(alpha = 0.25f), RoundedCornerShape(AppShape.smallControl))
                        .clickable { onWordClick(word) }
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        word.arabic,
                        fontSize = 22.sp,
                        color = GoldLight,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        word.translation,
                        fontSize = 10.sp,
                        color = SoftTextGold,
                        textAlign = TextAlign.Center,
                        maxLines = 2
                    )
                    Text(
                        word.transliteration,
                        fontSize = 9.sp,
                        color = DimGold,
                        textAlign = TextAlign.Center,
                        maxLines = 1
                    )
                }
            }
        }
    }
}

@Composable
fun WordInfoDialog(
    word: QuranWord,
    ayah: WordByWordAyah,
    canOpenWarsh: Boolean,
    onOpenWarsh: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        titleContentColor = GoldLight,
        textContentColor = SoftTextGold,
        title = {
            Column(horizontalAlignment = Alignment.End, modifier = Modifier.fillMaxWidth()) {
                Text(word.arabic, fontSize = 30.sp, color = GoldLight, textAlign = TextAlign.End)
                Text(word.translation, fontSize = 13.sp, color = SoftTextGold, textAlign = TextAlign.End)
                Text(word.transliteration, fontSize = 11.sp, color = MutedGold, textAlign = TextAlign.End)
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 360.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                ReaderInfoSectionTitle("I'rab ayah ${ayah.ayah}")
                I3rabTextBox(
                    text = ayah.e3rab.ifBlank { "Geen i'rab gevonden voor deze ayah." }
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Sluiten", color = Gold)
            }
        },
        dismissButton = {
            if (canOpenWarsh) {
                TextButton(onClick = onOpenWarsh) {
                    Icon(Icons.AutoMirrored.Filled.MenuBook, contentDescription = null, tint = Gold, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Open in Warsh", color = Gold)
                }
            }
        }
    )
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AyahInfoDialog(
    ayah: WordByWordAyah,
    onWordClick: (QuranWord) -> Unit,
    canOpenWarsh: Boolean,
    onOpenWarsh: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        titleContentColor = GoldLight,
        textContentColor = SoftTextGold,
        title = {
            Column(horizontalAlignment = Alignment.End, modifier = Modifier.fillMaxWidth()) {
                Text("Ayah ${ayah.ayah}", fontSize = 19.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                Text("Woord voor woord en i'rab", fontSize = 11.sp, color = MutedGold)
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = ReaderInfoStyle.dialogMaxHeight)
                    .verticalScroll(rememberScrollState())
            ) {
                ReaderInfoSectionTitle("Woorden")
                Spacer(modifier = Modifier.height(8.dp))
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ayah.words.forEach { word ->
                        Column(
                            modifier = Modifier
                                .widthIn(min = ReaderInfoStyle.wordChipMinWidth)
                                .padding(start = 6.dp)
                                .clip(RoundedCornerShape(AppShape.smallControl))
                                .background(DeepNavy.copy(alpha = 0.86f))
                                .border(1.dp, Gold.copy(alpha = 0.25f), RoundedCornerShape(AppShape.smallControl))
                                .clickable { onWordClick(word) }
                                .padding(horizontal = 9.dp, vertical = 7.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                word.arabic,
                                fontSize = 20.sp,
                                color = GoldLight,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Center
                            )
                            Text(
                                word.translation,
                                fontSize = 10.sp,
                                color = SoftTextGold,
                                textAlign = TextAlign.Center,
                                maxLines = 2
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))
                ReaderInfoSectionTitle("I'rab")
                I3rabTextBox(
                    text = ayah.e3rab.ifBlank { "Geen i'rab gevonden voor deze ayah." }
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Sluiten", color = Gold)
            }
        },
        dismissButton = {
            if (canOpenWarsh) {
                TextButton(onClick = onOpenWarsh) {
                    Icon(Icons.AutoMirrored.Filled.MenuBook, contentDescription = null, tint = Gold, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Open in Warsh", color = Gold)
                }
            }
        }
    )
}

@Composable
fun ReaderInfoSectionTitle(text: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.End,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text, fontSize = 13.sp, color = Gold, fontWeight = FontWeight.Bold, textAlign = TextAlign.End)
    }
}

@Composable
fun I3rabTextBox(text: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp)
            .clip(RoundedCornerShape(AppShape.control))
            .background(DeepNavy.copy(alpha = 0.78f))
            .border(1.dp, BorderNavy.copy(alpha = 0.72f), RoundedCornerShape(AppShape.control))
            .padding(horizontal = 12.dp, vertical = 12.dp)
    ) {
        Text(
            text,
            fontSize = 14.sp,
            color = SoftTextGold,
            lineHeight = 24.sp,
            textAlign = TextAlign.End,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
fun AyahSelectionToolbar(
    action: ReaderAyahAction,
    modifier: Modifier = Modifier,
    onCopy: () -> Unit,
    onBookmark: () -> Unit,
    onShare: () -> Unit,
    onNotes: () -> Unit,
    onWords: () -> Unit,
    onRepeat: () -> Unit,
    onPlay: () -> Unit
) {
    Surface(
        modifier = modifier,
        color = AyahToolbarGreen.copy(alpha = 0.92f),
        contentColor = Color.White,
        shape = RoundedCornerShape(2.dp),
        tonalElevation = 6.dp,
        shadowElevation = 8.dp
    ) {
        Row(
            modifier = Modifier
                .height(54.dp)
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            SelectionToolbarButton(
                icon = if (action.isBookmarked) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                label = "Bladwijzer",
                onClick = onBookmark
            )
            SelectionToolbarButton(
                icon = Icons.Default.ContentCopy,
                label = "Kopieer",
                onClick = onCopy
            )
            SelectionToolbarButton(
                icon = Icons.Default.Share,
                label = "Delen",
                onClick = onShare
            )
            SelectionToolbarButton(
                icon = Icons.Default.EditNote,
                label = "Notitie",
                onClick = onNotes
            )
            SelectionToolbarButton(
                icon = Icons.Default.Info,
                label = "Woorden",
                enabled = action.wordInfo != null,
                onClick = onWords
            )
            SelectionToolbarButton(
                icon = Icons.Default.Replay,
                label = "Herhaal",
                onClick = onRepeat
            )
            SelectionToolbarButton(
                icon = Icons.Default.PlayArrow,
                label = "Afspelen",
                onClick = onPlay
            )
        }
    }
}

@Composable
fun SelectionToolbarButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    enabled: Boolean = true,
    onClick: () -> Unit
) {
    IconButton(
        enabled = enabled,
        onClick = onClick,
        modifier = Modifier.size(AppComponentDefaults.minTouchTarget)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = if (enabled) Color.White else Color.White.copy(alpha = 0.35f),
            modifier = Modifier.size(26.dp)
        )
    }
}

@Composable
fun AyahActionDialog(
    action: ReaderAyahAction,
    onPlay: () -> Unit,
    onBookmark: (ReaderAyahAction) -> Unit,
    onInfo: (ReaderAyahAction) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        titleContentColor = GoldLight,
        textContentColor = SoftTextGold,
        title = {
            Column {
                Text(
                    "${action.surahName} ${action.surahId}:${action.ayahNumber}",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = GoldLight
                )
                Text("Ayah acties", fontSize = 11.sp, color = MutedGold)
            }
        },
        text = {
            Column {
                Text(
                    action.ayahText,
                    fontSize = 18.sp,
                    lineHeight = 31.sp,
                    color = SoftTextGold,
                    textAlign = TextAlign.End,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(14.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    AyahActionButton(
                        label = "Afspelen",
                        icon = Icons.Default.PlayArrow,
                        onClick = onPlay,
                        modifier = Modifier.weight(1f)
                    )
                    AyahActionButton(
                        label = if (action.isBookmarked) "Bewaard" else "Bladwijzer",
                        icon = if (action.isBookmarked) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                        onClick = { onBookmark(action) },
                        modifier = Modifier.weight(1f)
                    )
                    AyahActionButton(
                        label = "Woorden",
                        icon = Icons.Default.Info,
                        enabled = action.wordInfo != null,
                        onClick = { onInfo(action) },
                        modifier = Modifier.weight(1f)
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    AyahActionButton(
                        label = "Tafsir",
                        icon = Icons.AutoMirrored.Filled.MenuBook,
                        enabled = false,
                        onClick = {},
                        modifier = Modifier.weight(1f)
                    )
                    AyahActionButton(
                        label = "Delen",
                        icon = Icons.Default.Share,
                        enabled = false,
                        onClick = {},
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Sluiten", color = Gold)
            }
        }
    )
}

@Composable
fun AyahActionButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    enabled: Boolean = true,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.height(ReaderInfoStyle.actionButtonHeight),
        shape = RoundedCornerShape(AppShape.control),
        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, if (enabled) BorderNavy else BorderNavy.copy(alpha = 0.4f)),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = if (enabled) GoldLight else DimGold,
            disabledContentColor = DimGold
        )
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp))
            Text(label, fontSize = 10.sp, maxLines = 1)
        }
    }
}

@Composable
fun BookmarkIconButton(
    isBookmarked: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    IconButton(
        onClick = onClick,
        modifier = modifier
            .size(ReaderOverlayStyle.bookmarkButton)
            .clip(RoundedCornerShape(ReaderOverlayStyle.roundButton))
            .background(DeepNavy.copy(alpha = ReaderOverlayStyle.overlayAlpha))
            .border(1.dp, Gold.copy(alpha = 0.45f), RoundedCornerShape(ReaderOverlayStyle.roundButton))
    ) {
        Icon(
            imageVector = if (isBookmarked) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
            contentDescription = if (isBookmarked) "Bladwijzer verwijderen" else "Bladwijzer toevoegen",
            tint = if (isBookmarked) Gold else GoldLight,
            modifier = Modifier.size(19.dp)
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun AyahItem(
    number: Int,
    text: String,
    arabicFontSize: Int,
    isSelected: Boolean = false,
    isBookmarked: Boolean = false,
    onClick: () -> Unit = {},
    onBookmarkClick: () -> Unit = {},
    hasAyahInfo: Boolean = false,
    onInfoClick: () -> Unit = {},
    onLongPress: () -> Unit = {}
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = AppSpacing.list)
            .clip(RoundedCornerShape(AppShape.tile))
            .background(if (isSelected) TodayFocusSurface else MidNavy)
            .border(
                width = if (isSelected) AppBorder.selected else AppBorder.thin,
                color = if (isSelected) TodayFocusBorder else BorderNavy,
                shape = RoundedCornerShape(AppShape.tile)
            )
            .combinedClickable(
                onClick = onClick,
                onLongClick = onLongPress
            )
            .padding(horizontal = AppSpacing.card, vertical = AppSpacing.xxl)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                BookmarkIconButton(
                    isBookmarked = isBookmarked,
                    onClick = onBookmarkClick
                )
                if (hasAyahInfo) {
                    IconButton(
                        onClick = onInfoClick,
                        modifier = Modifier
                            .size(ReaderOverlayStyle.bookmarkButton)
                            .clip(RoundedCornerShape(ReaderOverlayStyle.roundButton))
                            .background(DeepNavy.copy(alpha = ReaderOverlayStyle.overlayAlpha))
                            .border(1.dp, Gold.copy(alpha = 0.45f), RoundedCornerShape(ReaderOverlayStyle.roundButton))
                    ) {
                        Icon(
                            Icons.Default.Info,
                            contentDescription = "Ayah informatie",
                            tint = GoldLight,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(AppShape.pill))
                    .background(MediumGoldSurface)
                    .border(1.dp, Gold.copy(alpha = 0.5f), RoundedCornerShape(AppShape.pill)),
                contentAlignment = Alignment.Center
            ) {
                Text("$number", fontSize = 10.sp, color = Gold)
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = text,
            fontSize = arabicFontSize.coerceIn(20, 36).sp,
            color = GoldLight,
            textAlign = TextAlign.End,
            lineHeight = (arabicFontSize.coerceIn(20, 36) + 16).sp,
            modifier = Modifier.fillMaxWidth()
        )
    }
}
