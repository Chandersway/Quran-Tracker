package com.Ameender.qurantracker.ui

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.media.MediaPlayer
import androidx.compose.foundation.Image
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.Ameender.qurantracker.data.QuranChapter
import com.Ameender.qurantracker.data.QuranDatabaseHelper
import com.Ameender.qurantracker.data.QuranSearchResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import java.io.File

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

@Composable
fun QuranReaderScreen(
    mushafMode: String = "hafs",
    initialSurahId: Int? = null,
    initialAyah: Int? = null,
    initialWarshPage: Int? = null,
    selectedReciterName: String = "",
    onInitialTargetConsumed: () -> Unit = {}
) {
    val context = LocalContext.current
    val dbHelper = remember { QuranDatabaseHelper(context) }

    var selectedChapter by remember { mutableStateOf<QuranChapter?>(null) }
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
            initialAyah = selectedAyah,
            initialWarshPage = initialWarshPage,
            selectedReciterName = selectedReciterName,
            onBack  = {
                selectedChapter = null
                selectedAyah = null
            }
        )
    } else {
        ChapterListScreen(
            chapters  = chapters,
            isLoading = isLoading,
            searchQuery = searchQuery,
            searchResults = searchResults,
            isSearching = isSearching,
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
    onSearchQueryChange: (String) -> Unit,
    onSelect: (QuranChapter) -> Unit,
    onSearchResultSelect: (QuranSearchResult) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkNavy)
    ) {
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
            Text("De Edele Quran", fontSize = 13.sp, color = Gold)
        }

        QuranSearchBox(
            query = searchQuery,
            results = searchResults,
            isSearching = isSearching,
            onQueryChange = onSearchQueryChange,
            onResultClick = onSearchResultSelect
        )

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Gold)
            }
        } else {
            LazyColumn(contentPadding = PaddingValues(AppSpacing.list)) {
                items(chapters) { chapter ->
                    ChapterListItem(chapter = chapter, onClick = { onSelect(chapter) })
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
            placeholder = { Text("Zoek in Quran", color = DimGold) },
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
fun ChapterListItem(chapter: QuranChapter, onClick: () -> Unit) {
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
                "Soera ${chapter.id}",
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
    }
}

@Composable
fun ChapterReaderScreen(
    chapter: QuranChapter,
    dbHelper: QuranDatabaseHelper,
    mushafMode: String = "hafs",
    initialAyah: Int? = null,
    initialWarshPage: Int? = null,
    selectedReciterName: String = "",
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var ayahs by remember { mutableStateOf<List<Pair<Int, String>>>(emptyList()) }
    var audioStatus by remember { mutableStateOf("") }
    var isPreparingAudio by remember { mutableStateOf(false) }
    var isPlayingAudio by remember { mutableStateOf(false) }
    var audioPositionMs by remember { mutableIntStateOf(0) }
    var audioDurationMs by remember { mutableIntStateOf(0) }
    var playbackSpeed by remember { mutableFloatStateOf(1.0f) }
    var warshAudioBarVisible by remember { mutableStateOf(true) }
    var warshAudioBarTouchTick by remember { mutableIntStateOf(0) }
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
    val continuousWarshPageResIds = remember(chapter.id) {
        val startPage = warshPageNumbers.first.takeIf { it > 0 } ?: 1
        (startPage..638).mapNotNull { page ->
            val resId = context.resources.getIdentifier(
                "warsh_page_${page.toString().padStart(3, '0')}",
                "drawable",
                context.packageName
            )
            if (resId == 0) null else page to resId
        }
    }
    val hafsMadinaPageNumbers = remember(chapter.id) { hafsMadinaPagesForSurah(chapter.id) }
    val hafsMadinaPageResIds = remember(chapter.id) {
        hafsMadinaPageNumbers.mapNotNull { page ->
            val resId = context.resources.getIdentifier(
                "hafs_madina_page_${page.toString().padStart(3, '0')}",
                "drawable",
                context.packageName
            )
            if (resId == 0) null else page to resId
        }
    }
    var showWarshMushaf by remember(chapter.id, mushafMode, warshPageResIds) {
        mutableStateOf(initialAyah == null && mushafMode == "warsh" && warshPageResIds.isNotEmpty())
    }
    var showHafsMadinaMushaf by remember(chapter.id, mushafMode, hafsMadinaPageResIds) {
        mutableStateOf(initialAyah == null && mushafMode == "hafs" && hafsMadinaPageResIds.isNotEmpty())
    }
    val hasWarshMushaf = warshPageResIds.isNotEmpty()
    val hasHafsMadinaMushaf = hafsMadinaPageResIds.isNotEmpty()
    val showMushafImage = showWarshMushaf || showHafsMadinaMushaf
    val hasMushafImage = hasWarshMushaf || hasHafsMadinaMushaf
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
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()
    val mediaPlayer = remember(chapter.id) { MediaPlayer() }

    DisposableEffect(mediaPlayer) {
        mediaPlayer.setOnCompletionListener {
            isPlayingAudio = false
            isPreparingAudio = false
            audioPositionMs = 0
            audioStatus = "Afspelen klaar"
        }
        onDispose {
            mediaPlayer.release()
        }
    }

    LaunchedEffect(isPlayingAudio, isPreparingAudio) {
        while (isPlayingAudio || isPreparingAudio) {
            if (isPlayingAudio) {
                audioPositionMs = runCatching { mediaPlayer.currentPosition }.getOrDefault(audioPositionMs)
                audioDurationMs = runCatching { mediaPlayer.duration }.getOrDefault(audioDurationMs)
            }
            delay(500)
        }
    }

    LaunchedEffect(playbackSpeed, isPlayingAudio) {
        if (isPlayingAudio) {
            runCatching {
                mediaPlayer.playbackParams = mediaPlayer.playbackParams.setSpeed(playbackSpeed)
            }
        }
    }

    LaunchedEffect(showWarshMushaf, warshAudioBarVisible, warshAudioBarTouchTick, isPlayingAudio, isPreparingAudio) {
        if (showWarshMushaf && warshAudioBarVisible && (isPlayingAudio || isPreparingAudio)) {
            delay(4000)
            warshAudioBarVisible = false
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
        val ayah = initialAyah
        if (ayah != null && ayahs.isNotEmpty()) {
            showWarshMushaf = false
            showHafsMadinaMushaf = false
            showWordByWord = false
            val offset = ayahListIndexOffset(chapter.id, surahCardResId != 0 && showSurahCard)
            listState.animateScrollToItem((offset + ayah - 1).coerceAtLeast(0))
        }
    }

    LaunchedEffect(initialWarshPage, continuousWarshPageResIds) {
        val page = initialWarshPage
        if (page != null && continuousWarshPageResIds.isNotEmpty()) {
            showWarshMushaf = true
            showHafsMadinaMushaf = false
            showWordByWord = false
            val pageIndex = continuousWarshPageResIds.indexOfFirst { it.first == page }.coerceAtLeast(0)
            listState.animateScrollToItem(pageIndex)
        }
    }

    val playAudio = {
        val audio = selectedAudio
        if (audio == null) {
            audioStatus = "Geen reciteur gekozen"
        } else {
            try {
                isPreparingAudio = true
                audioStatus = "Audio laden..."
                mediaPlayer.reset()
                mediaPlayer.setDataSource(audio.link)
                mediaPlayer.setOnPreparedListener {
                    audioDurationMs = it.duration
                    audioPositionMs = 0
                    it.start()
                    runCatching {
                        it.playbackParams = it.playbackParams.setSpeed(playbackSpeed)
                    }
                    isPreparingAudio = false
                    isPlayingAudio = true
                    audioStatus = "Soera ${chapter.id} speelt af: ${audio.reciterName}"
                }
                mediaPlayer.prepareAsync()
            } catch (e: Exception) {
                isPreparingAudio = false
                isPlayingAudio = false
                audioStatus = "Audio kon niet starten"
            }
        }
    }
    val stopAudio = {
        if (isPlayingAudio || isPreparingAudio) {
            mediaPlayer.stop()
            mediaPlayer.reset()
        }
        isPreparingAudio = false
        isPlayingAudio = false
        audioPositionMs = 0
        audioDurationMs = 0
        audioStatus = "Audio gestopt"
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

    if (selectedWord != null && selectedWordAyah != null) {
        WordInfoDialog(
            word = selectedWord!!,
            ayah = selectedWordAyah!!,
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
            onDismiss = { selectedAyahInfo = null }
        )
    }
    if (selectedAyahAction != null) {
        AyahActionDialog(
            action = selectedAyahAction!!,
            onPlay = {
                selectedAyahAction = null
                playAudio()
            },
            onBookmark = { action ->
                val currentSet = if (action.surahId == chapter.id) {
                    bookmarkedAyahs
                } else {
                    loadAyahBookmarks(context, action.surahId)
                }
                val updated = currentSet.toggle(action.ayahNumber)
                if (action.surahId == chapter.id) bookmarkedAyahs = updated
                saveAyahBookmarks(context, action.surahId, updated)
                selectedAyahAction = action.copy(isBookmarked = updated.contains(action.ayahNumber))
            },
            onInfo = { action ->
                selectedAyahAction = null
                selectedAyahInfo = action.wordInfo
            },
            onDismiss = { selectedAyahAction = null }
        )
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
                    Icon(Icons.Default.ArrowBack, contentDescription = "Terug", tint = Gold)
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
                            } else {
                                showHafsMadinaMushaf = !showHafsMadinaMushaf
                                showWarshMushaf = false
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
                        onLongPressAyah = { surahId, ayahNumber, ayahText, wordInfo ->
                            selectedWarshAyahKey = surahId to ayahNumber
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
                        },
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
                        onLongPressAyah = { surahId, ayahNumber, ayahText, wordInfo ->
                            selectedWarshAyahKey = surahId to ayahNumber
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
                        },
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
                items(ayahs) { (number, text) ->
                    val wordByWordAyah = wordByWordAyahs.firstOrNull { it.ayah == number }
                    AyahItem(
                        number = number,
                        text = text,
                        isBookmarked = bookmarkedAyahs.contains(number),
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
                    Icon(Icons.Default.MoreVert, contentDescription = "Reader menu", tint = GoldLight)
                }
                DropdownMenu(
                    expanded = readerMenuOpen,
                    onDismissRequest = { readerMenuOpen = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Terug naar soewar") },
                        leadingIcon = { Icon(Icons.Default.ArrowBack, contentDescription = null) },
                        onClick = {
                            readerMenuOpen = false
                            onBack()
                        }
                    )
                    DropdownMenuItem(
                        text = { Text("${bookmarkedWarshPages.size} pagina-bladwijzers") },
                        enabled = bookmarkedWarshPages.isNotEmpty(),
                        onClick = {
                            readerMenuOpen = false
                            showBookmarkList = true
                        }
                    )
                    if (surahCardResId != 0) {
                        DropdownMenuItem(
                            text = { Text(if (showSurahCard) "Kaart verbergen" else "Kaart tonen") },
                            onClick = {
                                showSurahCard = !showSurahCard
                                if (showSurahCard) {
                                    showWarshMushaf = false
                                    showHafsMadinaMushaf = false
                                    showWordByWord = false
                                }
                                readerMenuOpen = false
                            }
                        )
                    }
                    DropdownMenuItem(
                        text = { Text("Tekstweergave tonen") },
                        onClick = {
                            showWarshMushaf = false
                            showHafsMadinaMushaf = false
                            showWordByWord = false
                            readerMenuOpen = false
                        }
                    )
                    if (hasWordByWord) {
                        DropdownMenuItem(
                            text = { Text("Woord voor woord tonen") },
                            onClick = {
                                showWordByWord = true
                                showWarshMushaf = false
                                showHafsMadinaMushaf = false
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
                    Icon(Icons.Default.MoreVert, contentDescription = "Reader menu", tint = GoldLight)
                }
                DropdownMenu(
                    expanded = readerMenuOpen,
                    onDismissRequest = { readerMenuOpen = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Terug naar soewar") },
                        leadingIcon = { Icon(Icons.Default.ArrowBack, contentDescription = null) },
                        onClick = {
                            readerMenuOpen = false
                            onBack()
                        }
                    )
                    DropdownMenuItem(
                        text = { Text("${bookmarkedAyahs.size} ayah-bladwijzers") },
                        enabled = bookmarkedAyahs.isNotEmpty(),
                        onClick = {
                            readerMenuOpen = false
                            showBookmarkList = true
                        }
                    )
                    if (surahCardResId != 0) {
                        DropdownMenuItem(
                            text = { Text(if (showSurahCard) "Kaart verbergen" else "Kaart tonen") },
                            onClick = {
                                showSurahCard = !showSurahCard
                                if (showSurahCard) {
                                    showWarshMushaf = false
                                    showHafsMadinaMushaf = false
                                    showWordByWord = false
                                }
                                readerMenuOpen = false
                            }
                        )
                    }
                    if (hasWarshMushaf) {
                        DropdownMenuItem(
                            text = { Text("Warsh mushaf tonen") },
                            onClick = {
                                showWarshMushaf = true
                                showWordByWord = false
                                readerMenuOpen = false
                            }
                        )
                    }
                    if (hasHafsMadinaMushaf) {
                        DropdownMenuItem(
                            text = { Text("Hafs Madina mushaf tonen") },
                            onClick = {
                                showHafsMadinaMushaf = true
                                showWarshMushaf = false
                                showWordByWord = false
                                readerMenuOpen = false
                            }
                        )
                    }
                    if (hasWordByWord) {
                        DropdownMenuItem(
                            text = { Text(if (showWordByWord) "Tekstweergave tonen" else "Woord voor woord tonen") },
                            onClick = {
                                showWordByWord = !showWordByWord
                                if (showWordByWord) {
                                    showWarshMushaf = false
                                    showHafsMadinaMushaf = false
                                }
                                readerMenuOpen = false
                            }
                        )
                    }
                }
            }
        }

        if (audioOptions.isNotEmpty() && showMushafImage) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 14.dp, vertical = ReaderOverlayStyle.audioPadding),
                contentAlignment = Alignment.BottomCenter
            ) {
                if (warshAudioBarVisible) {
                    TransparentWarshAudioBar(
                        isPlaying = isPlayingAudio,
                        isPreparing = isPreparingAudio,
                        positionMs = audioPositionMs,
                        durationMs = audioDurationMs,
                        playbackSpeed = playbackSpeed,
                        onInteraction = {
                            warshAudioBarTouchTick++
                            warshAudioBarVisible = true
                        },
                        onSpeedChange = {
                            playbackSpeed = it
                            warshAudioBarTouchTick++
                        },
                        onPlayStop = {
                            warshAudioBarTouchTick++
                            if (isPlayingAudio || isPreparingAudio) stopAudio() else playAudio()
                        },
                        onSeek = { position ->
                            warshAudioBarTouchTick++
                            runCatching {
                                mediaPlayer.seekTo(position)
                                audioPositionMs = position
                            }
                        },
                        onSkip = { delta ->
                            warshAudioBarTouchTick++
                            val safeDuration = audioDurationMs.takeIf { it > 0 } ?: Int.MAX_VALUE
                            val newPosition = (audioPositionMs + delta).coerceIn(0, safeDuration)
                            runCatching {
                                mediaPlayer.seekTo(newPosition)
                                audioPositionMs = newPosition
                            }
                        }
                    )
                } else {
                    SmallFloatingActionButton(
                        onClick = {
                            warshAudioBarVisible = true
                            warshAudioBarTouchTick++
                        },
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .size(ReaderOverlayStyle.audioButton)
                            .border(1.dp, Gold.copy(alpha = 0.32f), RoundedCornerShape(ReaderOverlayStyle.roundButton)),
                        containerColor = DeepNavy.copy(alpha = 0.34f),
                        contentColor = GoldLight
                    ) {
                        Icon(
                            imageVector = if (isPlayingAudio || isPreparingAudio) Icons.Default.Stop else Icons.Default.PlayArrow,
                            contentDescription = "Audio balk tonen",
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
            }
        } else if (audioOptions.isNotEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(end = ReaderOverlayStyle.audioPadding, bottom = ReaderOverlayStyle.audioPadding),
                contentAlignment = Alignment.BottomEnd
            ) {
                SmallFloatingActionButton(
                    onClick = {
                        if (isPlayingAudio || isPreparingAudio) stopAudio() else playAudio()
                    },
                    modifier = Modifier
                        .size(ReaderOverlayStyle.audioButton)
                        .border(1.dp, Gold.copy(alpha = 0.5f), RoundedCornerShape(ReaderOverlayStyle.roundButton)),
                    containerColor = (if (isPlayingAudio || isPreparingAudio) DeleteRed else DeepNavy).copy(alpha = ReaderOverlayStyle.audioAlpha),
                    contentColor = GoldLight
                ) {
                    Icon(
                        imageVector = if (isPlayingAudio || isPreparingAudio) Icons.Default.Stop else Icons.Default.PlayArrow,
                        contentDescription = if (isPlayingAudio || isPreparingAudio) "Stop audio" else "Speel audio af",
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
        (5..20).map { it / 10f }
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
                .size(38.dp)
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
            .size(width = 38.dp, height = 32.dp)
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
    onLongPressAyah: (Int, Int, String, WordByWordAyah?) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val positions = remember(page) { loadHafsMadinaPagePositions(context, page) }
    val ayahTextByNumber = remember(ayahs) { ayahs.toMap() }
    val wordInfoByNumber = remember(wordByWordAyahs) { wordByWordAyahs.associateBy { it.ayah } }

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
            val wordInfo = if (position.surahId == currentChapterId) {
                wordInfoByNumber[position.ayahNumber]
            } else null
            val isBookmarked = position.surahId == currentChapterId && bookmarkedAyahs.contains(position.ayahNumber)
            val isSelected = selectedAyahKey == (position.surahId to position.ayahNumber)
            Box(
                modifier = Modifier
                    .offset(
                        x = maxWidth * position.left,
                        y = maxWidth * ReaderInfoStyle.hafsMadinaPageRatio * position.top
                    )
                    .width(maxWidth * position.width)
                    .height(maxWidth * ReaderInfoStyle.hafsMadinaPageRatio * position.height)
                    .combinedClickable(
                        onClick = {},
                        onLongClick = {
                            onLongPressAyah(position.surahId, position.ayahNumber, ayahText, wordInfo)
                        }
                    )
                    .background(
                        when {
                            isSelected -> Gold.copy(alpha = ReaderInfoStyle.warshSelectedAlpha)
                            isBookmarked -> DoneGreen.copy(alpha = ReaderInfoStyle.warshDebugHighlightAlpha)
                            else -> Color.Transparent
                        }
                    )
                    .border(
                        width = if (isSelected) 1.dp else 0.dp,
                        color = if (isSelected) Gold.copy(alpha = ReaderInfoStyle.warshSelectedBorderAlpha) else Color.Transparent,
                        shape = RoundedCornerShape(AppShape.marker)
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
    onLongPressAyah: (Int, Int, String, WordByWordAyah?) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val positions = remember(page) { loadWarshPagePositions(context, page) }
    val ayahTextByNumber = remember(ayahs) { ayahs.toMap() }
    val wordInfoByNumber = remember(wordByWordAyahs) { wordByWordAyahs.associateBy { it.ayah } }

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
            val ayahText = if (position.surahId == currentChapterId) {
                ayahTextByNumber[position.ayahNumber].orEmpty()
            } else {
                ""
            }.ifBlank { dbHelper.getAyahText(position.surahId, position.ayahNumber) }
            val wordInfo = if (position.surahId == currentChapterId) {
                wordInfoByNumber[position.ayahNumber]
            } else null
            val isBookmarked = position.surahId == currentChapterId && bookmarkedAyahs.contains(position.ayahNumber)
            val isSelected = selectedAyahKey == (position.surahId to position.ayahNumber)
            Box(
                modifier = Modifier
                    .offset(
                        x = (maxWidth * position.rawLeft) - 15.dp,
                        y = (lineHeight * position.line) + 4.2.dp
                    )
                    .width(maxWidth * position.rawWidth)
                    .height(lineHeight)
                    .combinedClickable(
                        onClick = {},
                        onLongClick = {
                            onLongPressAyah(position.surahId, position.ayahNumber, ayahText, wordInfo)
                        }
                    )
                    .background(
                        when {
                            isSelected -> ReadBlue.copy(alpha = ReaderInfoStyle.warshSelectedAlpha)
                            isBookmarked -> Gold.copy(alpha = ReaderInfoStyle.warshDebugHighlightAlpha)
                            else -> Color.Transparent
                        }
                    )
                    .border(
                        width = if (isSelected) 1.dp else 0.dp,
                        color = if (isSelected) ReadBlue.copy(alpha = ReaderInfoStyle.warshSelectedBorderAlpha) else Color.Transparent
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
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        titleContentColor = GoldLight,
        textContentColor = SoftTextGold,
        title = {
            Column(horizontalAlignment = Alignment.End, modifier = Modifier.fillMaxWidth()) {
                Text(word.arabic, fontSize = 26.sp, color = GoldLight, textAlign = TextAlign.End)
                Text(word.translation, fontSize = 13.sp, color = SoftTextGold)
                Text(word.transliteration, fontSize = 11.sp, color = MutedGold)
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 360.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text("I'rab ayah ${ayah.ayah}", fontSize = 13.sp, color = Gold, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    ayah.e3rab.ifBlank { "Geen i'rab gevonden voor deze ayah." },
                    fontSize = 14.sp,
                    color = SoftTextGold,
                    lineHeight = 24.sp,
                    textAlign = TextAlign.End,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Sluiten", color = Gold)
            }
        }
    )
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AyahInfoDialog(
    ayah: WordByWordAyah,
    onWordClick: (QuranWord) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        titleContentColor = GoldLight,
        textContentColor = SoftTextGold,
        title = {
            Text("Ayah ${ayah.ayah}", fontSize = 18.sp, fontWeight = FontWeight.Bold)
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = ReaderInfoStyle.dialogMaxHeight)
                    .verticalScroll(rememberScrollState())
            ) {
                Text("Woorden", fontSize = 13.sp, color = Gold, fontWeight = FontWeight.Bold)
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
                                .background(DeepNavy)
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
                Text("I'rab", fontSize = 13.sp, color = Gold, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    ayah.e3rab.ifBlank { "Geen i'rab gevonden voor deze ayah." },
                    fontSize = 14.sp,
                    color = SoftTextGold,
                    lineHeight = 24.sp,
                    textAlign = TextAlign.End,
                    modifier = Modifier.fillMaxWidth()
                )
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
                        label = "Tafsir",
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
                        label = "Kopieren",
                        icon = Icons.Default.ContentCopy,
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
    isBookmarked: Boolean = false,
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
            .background(MidNavy)
            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.tile))
            .combinedClickable(
                onClick = {},
                onLongClick = onLongPress
            )
            .padding(AppSpacing.compactCard)
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
            fontSize = 20.sp,
            color = SoftTextGold,
            textAlign = TextAlign.End,
            lineHeight = 36.sp,
            modifier = Modifier.fillMaxWidth()
        )
    }
}
