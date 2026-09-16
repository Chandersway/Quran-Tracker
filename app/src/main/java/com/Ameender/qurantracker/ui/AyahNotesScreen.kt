package com.Ameender.qurantracker.ui

import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.material3.Scaffold
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AutoStories
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.style.TextDirection
import kotlinx.coroutines.launch
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.OffsetMapping
import androidx.compose.ui.text.input.TransformedText
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.Ameender.qurantracker.data.*
import com.Ameender.qurantracker.data.QuranChapter
import com.Ameender.qurantracker.data.QuranDatabaseHelper
import com.Ameender.qurantracker.viewmodel.AyahNoteViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

private data class NoteStrings(
    val title: String,
    val subtitle: String,
    val surahLoading: String,
    val ayah: String,
    val noteTitle: String,
    val folder: String,
    val tags: String,
    val note: String,
    val notePlaceholder: String,
    val savedNotes: String,
    val noNotes: String,
    val search: String,
    val filterAll: String = "Alles",
    val pinned: String = "Vastgezet",
    val pin: String = "Vastzetten",
    val unpin: String = "Losmaken",
    val noteCount: String = "%d notities",
    val emptyFiltered: String = "Geen notities gevonden met deze filters.",
    val save: String,
    val fontSize: String,
    val format: String,
    val preview: String,
    val deleteTitle: String,
    val deleteMessage: String,
    val deleteConfirm: String,
    val exportNotes: String,
    val exportNoNotes: String,
    val exportSuccess: String,
    val exportFailed: String,
    val cancel: String
)

private fun noteStrings(language: String): NoteStrings = when (language) {
    "ar" -> NoteStrings(
        title = "ملاحظات الآيات",
        subtitle = "اكتب ملاحظاتك الخاصة لكل آية",
        surahLoading = "جار تحميل السورة...",
        ayah = "الآية",
        noteTitle = "العنوان",
        folder = "المجلد / المجلد الفرعي",
        tags = "الوسوم",
        note = "الملاحظة",
        notePlaceholder = "اكتب ملاحظتك هنا...",
        savedNotes = "الملاحظات المحفوظة",
        noNotes = "لا توجد ملاحظات بعد.",
        search = "ابحث في العنوان أو النص أو الوسوم",
        filterAll = "الكل", pinned = "المثبتة", pin = "تثبيت", unpin = "إلغاء التثبيت",
        noteCount = "%d ملاحظات", emptyFiltered = "لا توجد ملاحظات مطابقة للبحث.",
        save = "حفظ",
        fontSize = "حجم الخط",
        format = "تنسيق",
        preview = "معاينة",
        deleteTitle = "حذف الملاحظة؟",
        deleteMessage = "هل أنت متأكد أنك تريد حذف هذه الملاحظة؟",
        deleteConfirm = "حذف",
        exportNotes = "تصدير الملاحظات",
        exportNoNotes = "لا توجد ملاحظات للتصدير.",
        exportSuccess = "تم تصدير الملاحظات.",
        exportFailed = "تعذر تصدير الملاحظات.",
        cancel = "إلغاء"
    )
    "en" -> NoteStrings(
        title = "Ayah Notes",
        subtitle = "Write your own note for each ayah",
        surahLoading = "Loading surah...",
        ayah = "Ayah",
        noteTitle = "Title",
        folder = "Folder / subfolder",
        tags = "Tags",
        note = "Note",
        notePlaceholder = "Write your note here...",
        savedNotes = "Saved notes",
        noNotes = "No notes yet.",
        search = "Search title, text or tags",
        filterAll = "All",
        pinned = "Pinned",
        pin = "Pin",
        unpin = "Unpin",
        noteCount = "%d notes",
        emptyFiltered = "No notes match your search.",
        save = "Save",
        fontSize = "Font size",
        format = "Format",
        preview = "Preview",
        deleteTitle = "Delete note?",
        deleteMessage = "Are you sure you want to delete this note?",
        deleteConfirm = "Delete",
        exportNotes = "Export notes",
        exportNoNotes = "No notes to export.",
        exportSuccess = "Notes exported.",
        exportFailed = "Could not export notes.",
        cancel = "Cancel"
    )
    else -> NoteStrings(
        title = "Ayah-notities",
        subtitle = "Schrijf je eigen notitie per soera en ayah",
        surahLoading = "Soera laden...",
        ayah = "Ayah",
        noteTitle = "Titel",
        folder = "Map / submap",
        tags = "Labels",
        note = "Notitie",
        notePlaceholder = "Schrijf hier je notitie...",
        savedNotes = "Opgeslagen notities",
        noNotes = "Nog geen notities.",
        search = "Zoek in titel, tekst of labels",
        save = "Opslaan",
        fontSize = "Lettergrootte",
        format = "Opmaak",
        preview = "Voorbeeld",
        deleteTitle = "Notitie verwijderen?",
        deleteMessage = "Weet je zeker dat je deze notitie wilt verwijderen?",
        deleteConfirm = "Verwijderen",
        exportNotes = "Notities exporteren",
        exportNoNotes = "Er zijn geen notities om te exporteren.",
        exportSuccess = "Notities geexporteerd.",
        exportFailed = "Notities exporteren is niet gelukt.",
        cancel = "Annuleren"
    )
}

private object NoteLayoutColors {
    val Background: Color get() = DarkNavy
    val Panel: Color get() = MidNavy
    val PanelRaised: Color get() = HifzDashboardItem
    val Field: Color get() = DeepNavy
    val Card: Color get() = HifzDashboardSurface
    val PinnedCard: Color get() = TodayFocusSurface
    val Border: Color get() = BorderNavy
    val SoftBorder: Color get() = ButtonBorderNavy
    val TextPrimary: Color get() = GoldLight
    val TextSecondary: Color get() = SoftTextGold
    val TextMuted: Color get() = MutedGold
    val Accent: Color get() = Gold
    val Chip: Color get() = DeepNavy
    val ChipSelected: Color get() = StrongGoldSurface
}

@Composable
fun AyahNotesScreen(
    viewModel: AyahNoteViewModel,
    appLanguage: String = "nl",
    onEditorModeChanged: (Boolean) -> Unit = {},
    initialTarget: QuranNoteTarget? = null
) {
    val strings = noteStrings(appLanguage)
    fun label(nl: String, en: String, ar: String) = when (appLanguage) { "en" -> en; "ar" -> ar; else -> nl }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val notes by viewModel.allNotes.collectAsState()
    var editing by rememberSaveable { mutableStateOf(false) }
    var editingId by rememberSaveable { mutableStateOf(0L) }
    var targetType by rememberSaveable { mutableStateOf("surah") }
    var targetChosen by rememberSaveable { mutableStateOf(false) }
    var targetNumber by rememberSaveable { mutableIntStateOf(1) }
    var targetAyah by rememberSaveable { mutableStateOf<Int?>(null) }
    var selectedScope by rememberSaveable { mutableStateOf<String?>(null) }
    var includeChildren by rememberSaveable { mutableStateOf(false) }
    var contextScope by rememberSaveable { mutableStateOf(initialTarget?.scope?.key) }
    var contextNumber by rememberSaveable { mutableStateOf(initialTarget?.number) }
    var contextAyah by rememberSaveable { mutableStateOf(initialTarget?.ayah) }
    val currentTarget = contextScope?.let { QuranNoteTarget(NoteScope.fromKey(it), contextNumber!!, contextAyah) }
    val editorTarget = QuranNoteTarget(NoteScope.fromKey(targetType), targetNumber, targetAyah)
    val validTarget = targetChosen && runCatching { editorTarget.validate() }.isSuccess
    var titleInput by rememberSaveable { mutableStateOf("") }
    var noteInput by rememberSaveable { mutableStateOf("") }
    var folderInput by rememberSaveable { mutableStateOf("") }
    var tagsInput by rememberSaveable { mutableStateOf("") }
    var fontSize by rememberSaveable { mutableIntStateOf(16) }
    var headingLevel by rememberSaveable { mutableIntStateOf(0) }
    var isBold by rememberSaveable { mutableStateOf(false) }
    var isItalic by rememberSaveable { mutableStateOf(false) }
    var isUnderline by rememberSaveable { mutableStateOf(false) }
    var isStrike by rememberSaveable { mutableStateOf(false) }
    var listMode by rememberSaveable { mutableStateOf("none") }
    var textColorKey by rememberSaveable { mutableStateOf("gold") }
    var encodedSpans by rememberSaveable { mutableStateOf("") }
    var originalFingerprint by rememberSaveable { mutableStateOf("") }
    var showMetadata by rememberSaveable { mutableStateOf(false) }
    var showFormatting by rememberSaveable { mutableStateOf(false) }
    var preview by rememberSaveable { mutableStateOf(false) }
    var saving by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var confirmLeave by remember { mutableStateOf(false) }
    var pendingDelete by remember { mutableStateOf<AyahNote?>(null) }
    var deleting by remember { mutableStateOf(false) }
    var searchQuery by rememberSaveable { mutableStateOf("") }
    var pinnedOnly by rememberSaveable { mutableStateOf(false) }
    var selectedFolder by rememberSaveable { mutableStateOf<String?>(null) }
    var selectedTag by rememberSaveable { mutableStateOf<String?>(null) }
    var sortByTitle by rememberSaveable { mutableStateOf(false) }
    var optionsOpen by remember { mutableStateOf(false) }
    var filtersOpen by remember { mutableStateOf(false) }
    var surahMenuOpen by remember { mutableStateOf(false) }
    var pendingExportJson by remember { mutableStateOf<String?>(null) }
    val snackbar = remember { SnackbarHostState() }
    val formatSpans = remember(encodedSpans) { decodeFormatSpans(encodedSpans) }
    val noteCategories = remember(notes, appLanguage) {
        (notes.flatMap { noteTagList(it.tags) } + noteTagCategories(appLanguage)).distinct()
    }
    fun fingerprint() = listOf(targetChosen, targetType, targetNumber, targetAyah, titleInput, noteInput, folderInput, tagsInput,
        fontSize, headingLevel, isBold, isItalic, isUnderline, isStrike, listMode, textColorKey, encodedSpans).toString()
    fun leaveEditor() {
        if (saving) return
        if (fingerprint() != originalFingerprint) confirmLeave = true else editing = false
    }
    fun openNote(note: AyahNote?) {
        editingId = note?.id ?: 0L
        val target = note?.target() ?: currentTarget ?: QuranNoteTarget(
            selectedScope?.let(NoteScope::fromKey) ?: NoteScope.SURAH, 1,
            if (selectedScope == "ayah") 1 else null)
        targetType = target.scope.key
        targetChosen = note != null || currentTarget != null || selectedScope != null
        targetNumber = target.number
        targetAyah = target.ayah
        titleInput = note?.title.orEmpty()
        noteInput = note?.note.orEmpty()
        folderInput = note?.folder ?: selectedFolder.orEmpty()
        tagsInput = note?.tags.orEmpty()
        fontSize = note?.fontSize ?: 16
        headingLevel = note?.headingLevel ?: 0
        isBold = note?.isBold ?: false
        isItalic = note?.isItalic ?: false
        isUnderline = note?.isUnderline ?: false
        isStrike = note?.isStrike ?: false
        listMode = note?.listMode ?: "none"
        textColorKey = note?.textColorKey ?: "gold"
        encodedSpans = note?.formatSpans.orEmpty()
        showMetadata = false
        showFormatting = false
        preview = note != null
        errorMessage = null
        originalFingerprint = fingerprint()
        editing = true
    }
    SideEffect { onEditorModeChanged(editing) }
    DisposableEffect(Unit) { onDispose { onEditorModeChanged(false) } }
    BackHandler(enabled = editing) { leaveEditor() }
    val exportLauncher = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        val json = pendingExportJson
        pendingExportJson = null
        if (uri != null && json != null) scope.launch {
            val succeeded = withContext(Dispatchers.IO) {
                runCatching {
                    context.contentResolver.openOutputStream(uri)?.use { it.write(json.toByteArray(Charsets.UTF_8)) }
                        ?: error("No output stream")
                }.isSuccess
            }
            snackbar.showSnackbar(if (succeeded) strings.exportSuccess else strings.exportFailed)
        }
    }
    val filteredNotes = remember(notes, searchQuery, pinnedOnly, selectedFolder, selectedTag, sortByTitle, selectedScope, currentTarget, includeChildren) {
        notes.filter { note ->
            (selectedScope == null || note.scopeType == selectedScope) &&
            (currentTarget == null || note.target() == currentTarget || (includeChildren && currentTarget.includes(note.target()))) &&
            (!pinnedOnly || note.isPinned) &&
            (selectedFolder == null || note.folder == selectedFolder) &&
            (selectedTag == null || noteTagList(note.tags).contains(selectedTag)) &&
            (searchQuery.isBlank() || listOf(note.title, note.note, note.tags, note.folder,
                note.surahName, ALL_SURAHS.firstOrNull { it.id == note.surahId }?.name.orEmpty(),
                noteTargetTitle(note.target(), appLanguage)).any { it.contains(searchQuery.trim(), true) })
        }.let { found ->
            if (sortByTitle) found.sortedWith(compareByDescending<AyahNote> { it.isPinned }.thenBy(String.CASE_INSENSITIVE_ORDER) { noteDisplayTitle(it) })
            else found.sortedWith(compareByDescending<AyahNote> { it.isPinned }.thenByDescending { it.updatedAt })
        }
    }
    Box(Modifier.fillMaxSize().background(NoteLayoutColors.Background).imePadding()) {
        if (editing) {
            Scaffold(modifier = Modifier.fillMaxSize(), containerColor = NoteLayoutColors.Background,
                contentWindowInsets = WindowInsets(0, 0, 0, 0), topBar = {
                Column {
                Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = ::leaveEditor, enabled = !saving) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, strings.cancel, tint = NoteLayoutColors.TextPrimary)
                    }
                    Text(if (editingId == 0L) label("Nieuwe notitie", "New note", "ملاحظة جديدة") else strings.note,
                        Modifier.weight(1f), color = NoteLayoutColors.TextPrimary, fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
                    if (editingId != 0L) IconButton(onClick = { preview = !preview }) {
                        Icon(if (preview) Icons.Default.EditNote else Icons.Default.Visibility,
                            if (preview) label("Bewerken", "Edit", "تعديل") else strings.preview, tint = NoteLayoutColors.Accent)
                    }
                    val canSave = !saving && validTarget && (noteInput.isNotBlank() || titleInput.isNotBlank()) && fingerprint() != originalFingerprint
                    TextButton(
                        enabled = canSave,
                        onClick = {
                            if (!validTarget) return@TextButton
                            saving = true
                            errorMessage = null
                            val existing = notes.firstOrNull { it.id == editingId }
                            val updated = AyahNote(id = editingId,
                                surahName = if (editorTarget.scope in listOf(NoteScope.SURAH, NoteScope.AYAH))
                                    ALL_SURAHS.first { it.id == editorTarget.number }.name else "",
                                title = titleInput.trim(), note = noteInput,
                                folder = folderInput.trim(), tags = tagsInput.trim(), fontSize = fontSize, headingLevel = headingLevel,
                                isBold = isBold, isItalic = isItalic, isUnderline = isUnderline, isStrike = isStrike,
                                listMode = listMode, textColorKey = textColorKey, formatSpans = encodedSpans,
                                isPinned = existing?.isPinned ?: false).withTarget(editorTarget)
                            scope.launch {
                                try {
                                    viewModel.persistNote(updated)
                                    if (currentTarget != null && currentTarget != updated.target()) {
                                        if (currentTarget.includes(updated.target())) includeChildren = true
                                        else {
                                            contextScope = updated.scopeType
                                            contextNumber = updated.target().number
                                            contextAyah = updated.target().ayah
                                            includeChildren = false
                                        }
                                    }
                                    selectedScope = null
                                    searchQuery = ""
                                    pinnedOnly = false
                                    selectedFolder = null
                                    selectedTag = null
                                    editing = false
                                    snackbar.showSnackbar(label("Opgeslagen bij ", "Saved to ", "تم الحفظ في ") + noteTargetTitle(updated.target(), appLanguage))
                                } catch (e: Exception) {
                                    if (e is kotlinx.coroutines.CancellationException) throw e
                                    errorMessage = label("Opslaan is niet gelukt. Je tekst blijft hier staan. Probeer opnieuw.",
                                        "Could not save. Your text is still here. Try again.", "تعذر الحفظ. لا يزال النص هنا. حاول مجددا.")
                                } finally { saving = false }
                            }
                        }
                    ) {
                        if (saving) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp, color = NoteLayoutColors.Accent)
                        else Text(strings.save, color = if (canSave) NoteLayoutColors.Accent else NoteLayoutColors.TextMuted)
                    }
                }
                HorizontalDivider(color = NoteLayoutColors.SoftBorder.copy(alpha = 0.5f))
                }
            }) { editorPadding ->
                Column(
                    Modifier.fillMaxSize().padding(editorPadding).consumeWindowInsets(editorPadding)
                        .verticalScroll(rememberScrollState()).padding(horizontal = AppSpacing.screen, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    errorMessage?.let { Text(it, color = DeleteRed, fontSize = 13.sp) }
                    if (preview) {
                        Text(titleInput.ifBlank { noteTargetTitle(editorTarget, appLanguage) },
                            fontSize = 25.sp, lineHeight = 32.sp, fontWeight = FontWeight.Bold,
                            color = NoteLayoutColors.TextPrimary, style = TextStyle(textDirection = TextDirection.Content))
                        Text(listOf(noteTargetTitle(editorTarget, appLanguage), folderInput).filter { it.isNotBlank() }.joinToString(" · "),
                            color = NoteLayoutColors.TextMuted, fontSize = 12.sp)
                        if (tagsInput.isNotBlank()) Text(noteTagList(tagsInput).joinToString("  ") { "#$it" },
                            color = NoteLayoutColors.Accent, fontSize = 12.sp)
                        NoteTargetSummary(editorTarget, appLanguage)
                        FormattedNoteText(noteInput, fontSize, headingLevel, isBold, isItalic, isUnderline, isStrike, listMode,
                            textColorKey, formatSpans, modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp))
                    } else {
                        NoteTargetSelector(editorTarget, appLanguage, targetChosen) { target ->
                            targetChosen = true
                            targetType = target.scope.key
                            targetNumber = target.number
                            targetAyah = target.ayah
                        }
                        HorizontalDivider(color = NoteLayoutColors.SoftBorder.copy(alpha = 0.5f))
                        BasicTextField(value = titleInput, onValueChange = { titleInput = it },
                            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                            textStyle = TextStyle(fontSize = 25.sp, lineHeight = 32.sp, fontWeight = FontWeight.Bold,
                                color = NoteLayoutColors.TextPrimary, textDirection = TextDirection.Content),
                            cursorBrush = SolidColor(NoteLayoutColors.Accent),
                            decorationBox = { inner -> Box { if (titleInput.isEmpty()) Text(strings.noteTitle, color = NoteLayoutColors.TextMuted, fontSize = 25.sp); inner() } })
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            TextButton(onClick = { showMetadata = !showMetadata }, contentPadding = PaddingValues(0.dp)) {
                                Icon(Icons.Default.AutoStories, null, Modifier.size(17.dp), tint = NoteLayoutColors.Accent)
                                Spacer(Modifier.width(6.dp))
                                Text(label("Mappen & labels", "Folders & tags", "المجلدات والوسوم"), fontSize = 12.sp, color = NoteLayoutColors.Accent)
                                Icon(Icons.Default.ArrowDropDown, null, tint = NoteLayoutColors.Accent)
                            }
                            Spacer(Modifier.weight(1f))
                            TextButton(onClick = { showFormatting = !showFormatting }) {
                                Text("Aa", fontSize = 17.sp, color = NoteLayoutColors.Accent)
                                Spacer(Modifier.width(6.dp))
                                Text(strings.format, fontSize = 12.sp, color = NoteLayoutColors.Accent)
                            }
                        }
                        if (showMetadata) {
                            Column(Modifier.fillMaxWidth().background(NoteLayoutColors.Panel, RoundedCornerShape(12.dp)).padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = folderInput,
                        onValueChange = { folderInput = it },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        label = { Text(strings.folder) },
                        colors = noteTextFieldColors()
                    )
                    OutlinedTextField(
                        value = tagsInput,
                        onValueChange = { tagsInput = it },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        label = { Text(strings.tags) },
                        colors = noteTextFieldColors()
                    )
                }
                NoteTagChipRow(
                    tags = noteCategories,
                    selectedTags = noteTagList(tagsInput).toSet(),
                    onTagClick = { tag -> tagsInput = toggleTagText(tagsInput, tag) }
                )


                            }
                        }
                        if (showFormatting) {
                                            EditorToolbar(
                    strings = strings,
                    fontSize = fontSize,
                    onFontSizeChange = { fontSize = it.coerceIn(12, 28) },
                    headingLevel = headingLevel,
                    onHeadingChange = { headingLevel = it },
                    isBold = isBold,
                    onBoldChange = { isBold = it },
                    isItalic = isItalic,
                    onItalicChange = { isItalic = it },
                    isUnderline = isUnderline,
                    onUnderlineChange = { isUnderline = it },
                    isStrike = isStrike,
                    onStrikeChange = { isStrike = it },
                    listMode = listMode,
                    onListModeChange = { listMode = it },
                    textColorKey = textColorKey,
                    onTextColorChange = { textColorKey = it }
                )


                        }
                        BasicTextField(value = noteInput, onValueChange = { updated ->
                            encodedSpans = encodeFormatSpans(updateFormatSpansForTextChange(noteInput, updated, formatSpans,
                                ActiveNoteFormat(fontSize, headingLevel, isBold, isItalic, isUnderline, isStrike, textColorKey)))
                            noteInput = updated
                        }, modifier = Modifier.fillMaxWidth().heightIn(min = 240.dp).padding(vertical = 8.dp),
                            textStyle = TextStyle(fontSize = fontSize.sp, lineHeight = (fontSize * 1.6f).sp,
                                color = noteTextColor(textColorKey), textDirection = TextDirection.Content,
                                fontWeight = if (isBold) FontWeight.Bold else FontWeight.Normal,
                                fontStyle = if (isItalic) FontStyle.Italic else FontStyle.Normal,
                                textDecoration = noteTextDecoration(isUnderline, isStrike)),
                            cursorBrush = SolidColor(NoteLayoutColors.Accent),
                            visualTransformation = NoteFormatVisualTransformation(formatSpans),
                            decorationBox = { inner -> Box { if (noteInput.isEmpty()) Text(strings.notePlaceholder,
                                color = NoteLayoutColors.TextMuted, fontSize = 16.sp); inner() } })
                    }
                    Spacer(Modifier.height(24.dp))
                }
            }
        } else {
            LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 24.dp)) {
                item(key = "notes-header") {
                Column {
                Row(Modifier.fillMaxWidth().padding(start = AppSpacing.screen, end = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(strings.noteCount.format(filteredNotes.size), Modifier.weight(1f), color = NoteLayoutColors.TextMuted, fontSize = 13.sp)
                    TextButton(onClick = { openNote(null) }) {
                        Icon(Icons.Default.Add, null, Modifier.size(18.dp), tint = NoteLayoutColors.Accent)
                        Spacer(Modifier.width(5.dp))
                        Text(label("Nieuwe notitie", "New note", "ملاحظة جديدة"), color = NoteLayoutColors.Accent)
                    }
                    Box {
                        IconButton(onClick = { optionsOpen = true }) { Icon(Icons.Default.MoreVert,
                            label("Notitie-opties", "Note options", "خيارات الملاحظات"), tint = NoteLayoutColors.TextPrimary) }
                        DropdownMenu(optionsOpen, { optionsOpen = false }) {
                            DropdownMenuItem(text = { Text(label("Nieuwste eerst", "Most recent first", "الأحدث أولا")) },
                                trailingIcon = { if (!sortByTitle) Icon(Icons.Default.Check, null) },
                                onClick = { sortByTitle = false; optionsOpen = false })
                            DropdownMenuItem(text = { Text(label("Titel A–Z", "Title A–Z", "حسب العنوان")) },
                                trailingIcon = { if (sortByTitle) Icon(Icons.Default.Check, null) },
                                onClick = { sortByTitle = true; optionsOpen = false })
                            DropdownMenuItem(text = { Text(strings.exportNotes) }, enabled = notes.isNotEmpty(),
                                onClick = { optionsOpen = false; pendingExportJson = buildNotesExportJson(notes); exportLauncher.launch(notesExportFileName()) })
                        }
                    }
                }
                if (currentTarget != null) {
                    Column(Modifier.padding(horizontal = AppSpacing.screen, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(noteTargetTitle(currentTarget, appLanguage), color = GoldLight, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        NoteTargetSummary(currentTarget, appLanguage)
                        if (currentTarget.scope in listOf(NoteScope.SURAH, NoteScope.HIZB, NoteScope.JUZ)) {
                            NotesChip(includeChildren, { includeChildren = !includeChildren }, label = {
                                Text(label("Onderliggende notities", "Notes in this section", "ملاحظات الأقسام الفرعية"), fontSize = 12.sp)
                            })
                        }
                    }
                }
                Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = AppSpacing.screen),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    NotesChip(selectedScope == null, { selectedScope = null }, label = { Text(strings.filterAll, fontSize = 12.sp) })
                    NoteScope.entries.forEach { type ->
                        NotesChip(selectedScope == type.key, { selectedScope = type.key },
                            label = { Text(noteScopeLabel(type, appLanguage), fontSize = 12.sp) })
                    }
                }
                OutlinedTextField(value = searchQuery, onValueChange = { searchQuery = it },
                    modifier = Modifier.fillMaxWidth().padding(horizontal = AppSpacing.screen),
                    placeholder = { Text(strings.search, fontSize = 13.sp) },
                    leadingIcon = { Icon(Icons.Default.Search, null) },
                    trailingIcon = { if (searchQuery.isNotEmpty()) IconButton(onClick = { searchQuery = "" }) {
                        Icon(Icons.Default.Close, label("Zoekopdracht wissen", "Clear search", "مسح البحث")) } },
                    singleLine = true, shape = RoundedCornerShape(14.dp), colors = noteTextFieldColors())
                Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = AppSpacing.screen, vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    NotesChip(selected = !pinnedOnly && selectedFolder == null && selectedTag == null,
                        onClick = { pinnedOnly = false; selectedFolder = null; selectedTag = null }, label = { Text(strings.filterAll) })
                    NotesChip(selected = pinnedOnly, onClick = { pinnedOnly = !pinnedOnly }, label = { Text(strings.pinned) },
                        leadingIcon = { Icon(Icons.Default.PushPin, null, Modifier.size(15.dp)) })
                    NotesChip(selected = selectedFolder != null || selectedTag != null, onClick = { filtersOpen = true },
                        label = { Text(listOfNotNull(selectedFolder, selectedTag).joinToString(" · ").ifBlank { label("Mappen & labels", "Folders & tags", "المجلدات والوسوم") }) },
                        leadingIcon = { Icon(Icons.Default.FolderOpen, null, Modifier.size(16.dp)) })
                }
                }
                }
                    if (filteredNotes.isEmpty()) item {
                        val emptySection = currentTarget != null && notes.none {
                            it.target() == currentTarget || (includeChildren && currentTarget.includes(it.target()))
                        }
                        val canCreate = notes.isEmpty() || emptySection
                        Column(Modifier.fillMaxWidth().padding(horizontal = 28.dp, vertical = 48.dp),
                            horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Icon(if (notes.isEmpty()) Icons.Default.EditNote else Icons.Default.Search, null,
                                Modifier.size(32.dp), tint = NoteLayoutColors.Accent)
                            Text(if (canCreate) strings.noNotes else strings.emptyFiltered,
                                color = NoteLayoutColors.TextPrimary, textAlign = TextAlign.Center)
                            if (notes.isEmpty()) Text(label("Bewaar een inzicht, reflectie of vraag bij een Juz, Hizb, Rubʿ, surah of ayah.",
                                "Keep an insight, reflection or question with a Juz, Hizb, Rubʿ, surah or ayah.", "احتفظ بفكرة أو تأمل أو سؤال مرتبط بجزء أو حزب أو ربع أو سورة أو آية."),
                                color = NoteLayoutColors.TextMuted, textAlign = TextAlign.Center, fontSize = 13.sp)
                            TextButton(onClick = { if (canCreate) openNote(null) else {
                                searchQuery = ""; pinnedOnly = false; selectedFolder = null; selectedTag = null; selectedScope = null
                            } }) { Text(if (canCreate) label("Schrijf je eerste notitie", "Write your first note", "اكتب ملاحظتك الأولى")
                                else label("Filters wissen", "Clear filters", "مسح عوامل التصفية"), color = NoteLayoutColors.Accent) }
                        }
                    }
                    val groups = filteredNotes.groupBy { if (currentTarget != null) noteScopeLabel(NoteScope.fromKey(it.scopeType), appLanguage) else if (it.isPinned) strings.pinned else label("Notities", "Notes", "الملاحظات") }
                    groups.forEach { (pinned, group) ->
                        item(key = "section-$pinned") {
                            Text("$pinned (${group.size})",
                                Modifier.padding(horizontal = AppSpacing.screen, vertical = 8.dp),
                                color = NoteLayoutColors.TextMuted, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        }
                        items(group, key = { it.id }) { note ->
                            CompactNoteRow(note, strings, appLanguage, onOpen = { openNote(note) },
                                onPin = { scope.launch {
                                    try { viewModel.persistNote(note.copy(isPinned = !note.isPinned)) }
                                    catch (e: Exception) { if (e is kotlinx.coroutines.CancellationException) throw e
                                        snackbar.showSnackbar(label("Wijzigen is niet gelukt. Probeer opnieuw.", "Could not update. Try again.", "تعذر التحديث. حاول مجددا.")) }
                                } }, onDelete = { pendingDelete = note })
                        }
                    }
            }
        }
        SnackbarHost(snackbar, Modifier.align(Alignment.BottomCenter))
    }
    if (confirmLeave) AlertDialog(onDismissRequest = { confirmLeave = false },
        title = { Text(label("Wijzigingen bewaren?", "Keep your changes?", "هل تريد الاحتفاظ بالتغييرات؟")) },
        text = { Text(label("Deze notitie bevat nog niet-opgeslagen wijzigingen.", "This note has unsaved changes.", "تحتوي الملاحظة على تغييرات غير محفوظة.")) },
        confirmButton = { TextButton(onClick = { confirmLeave = false }) { Text(label("Verder schrijven", "Keep editing", "متابعة الكتابة")) } },
        dismissButton = { TextButton(onClick = { confirmLeave = false; editing = false }) { Text(label("Wijzigingen weggooien", "Discard changes", "تجاهل التغييرات"), color = DeleteRed) } })
    pendingDelete?.let { note ->
        AlertDialog(onDismissRequest = { if (!deleting) pendingDelete = null },
            title = { Text(strings.deleteTitle) }, text = { Text(noteDisplayTitle(note) + "\n\n" + strings.deleteMessage) },
            confirmButton = { TextButton(enabled = !deleting, onClick = {
                deleting = true
                scope.launch {
                    try { viewModel.removeNote(note); pendingDelete = null; snackbar.showSnackbar(label("Notitie verwijderd", "Note deleted", "تم حذف الملاحظة")) }
                    catch (e: Exception) { if (e is kotlinx.coroutines.CancellationException) throw e
                        pendingDelete = null; snackbar.showSnackbar(label("Verwijderen is niet gelukt.", "Could not delete note.", "تعذر حذف الملاحظة.")) }
                    finally { deleting = false }
                }
            }) { Text(strings.deleteConfirm, color = DeleteRed) } },
            dismissButton = { TextButton(enabled = !deleting, onClick = { pendingDelete = null }) { Text(strings.cancel) } })
    }
    if (filtersOpen) {
        NotesFilterSheet(strings, notes, selectedFolder, selectedTag, appLanguage,
            onFolder = { selectedFolder = it }, onTag = { selectedTag = it }, onDismiss = { filtersOpen = false })
    }
}

private fun noteReference(surahId: Int, ayah: Int): String =
    "${ALL_SURAHS.firstOrNull { it.id == surahId }?.name ?: surahId.toString()} $surahId:$ayah"

private fun noteDisplayTitle(note: AyahNote): String =
    note.title.ifBlank { note.note.lineSequence().firstOrNull { it.isNotBlank() }?.let(::cleanTodoLine).orEmpty() }
        .ifBlank { noteTargetTitle(note.target()) }

@Composable
private fun CompactNoteRow(note: AyahNote, strings: NoteStrings, language: String, onOpen: () -> Unit, onPin: () -> Unit, onDelete: () -> Unit) {
    var menuOpen by remember { mutableStateOf(false) }
    val date = remember(note.updatedAt, language) {
        java.text.DateFormat.getDateInstance(java.text.DateFormat.SHORT, java.util.Locale.forLanguageTag(language))
            .format(java.util.Date(note.updatedAt))
    }
    val excerpt = remember(note.note, note.title) {
        val lines = note.note.lineSequence().filter { it.isNotBlank() }.toList()
        (if (note.title.isBlank()) lines.drop(1) else lines).joinToString(" ") { cleanTodoLine(it) }
    }
    Column {
        Row(Modifier.fillMaxWidth().clickable(onClick = onOpen).padding(start = AppSpacing.screen, end = 4.dp, top = 10.dp, bottom = 10.dp),
            verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                    if (note.isPinned) Icon(Icons.Default.PushPin, null, Modifier.size(12.dp), tint = NoteLayoutColors.Accent)
                    Text(noteDisplayTitle(note), fontSize = 15.sp, fontWeight = FontWeight.SemiBold,
                        color = NoteLayoutColors.TextPrimary, maxLines = 1, overflow = TextOverflow.Ellipsis,
                        style = TextStyle(textDirection = TextDirection.Content))
                }
                if (excerpt.isNotBlank()) Text(excerpt, fontSize = 13.sp, lineHeight = 18.sp,
                    color = NoteLayoutColors.TextSecondary, maxLines = 1, overflow = TextOverflow.Ellipsis,
                    style = TextStyle(textDirection = TextDirection.Content))
                Text(listOf(noteTargetTitle(note.target(), language), note.folder, date).filter { it.isNotBlank() }.joinToString(" · "),
                    fontSize = 11.sp, color = NoteLayoutColors.TextMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Box {
                IconButton(onClick = { menuOpen = true }) { Icon(Icons.Default.MoreVert,
                    if (language == "ar") "خيارات الملاحظة" else if (language == "en") "Note actions" else "Notitie-acties",
                    tint = NoteLayoutColors.TextMuted, modifier = Modifier.size(20.dp)) }
                DropdownMenu(menuOpen, { menuOpen = false }) {
                    DropdownMenuItem(text = { Text(if (note.isPinned) strings.unpin else strings.pin) },
                        leadingIcon = { Icon(Icons.Default.PushPin, null) }, onClick = { menuOpen = false; onPin() })
                    DropdownMenuItem(text = { Text(strings.deleteConfirm, color = DeleteRed) },
                        leadingIcon = { Icon(Icons.Default.Delete, null, tint = DeleteRed) }, onClick = { menuOpen = false; onDelete() })
                }
            }
        }
        HorizontalDivider(Modifier.padding(horizontal = AppSpacing.screen), color = NoteLayoutColors.SoftBorder.copy(alpha = 0.45f))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NotesFilterSheet(strings: NoteStrings, notes: List<AyahNote>, folder: String?, tag: String?, language: String,
    onFolder: (String?) -> Unit, onTag: (String?) -> Unit, onDismiss: () -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = NoteLayoutColors.Panel) {
        LazyColumn(contentPadding = PaddingValues(horizontal = AppSpacing.screen, vertical = 12.dp)) {
            item { Text(if (language == "ar") "المجلدات" else if (language == "en") "Folders" else "Mappen",
                fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = NoteLayoutColors.TextPrimary) }
            item { NotesChip(folder == null, { onFolder(null) }, label = { Text(strings.filterAll) }) }
            items(notes.map { it.folder }.filter { it.isNotBlank() }.distinct().sorted()) { item ->
                NotesChip(folder == item, { onFolder(if (folder == item) null else item) },
                    label = { Text("$item (${notes.count { it.folder == item }})") })
            }
            item { Text(strings.tags, Modifier.padding(top = 16.dp), fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold, color = NoteLayoutColors.TextPrimary) }
            item { NotesChip(tag == null, { onTag(null) }, label = { Text(strings.filterAll) }) }
            items(notes.flatMap { noteTagList(it.tags) }.distinct().sorted()) { item ->
                NotesChip(tag == item, { onTag(if (tag == item) null else item) }, label = { Text("#$item") })
            }
            item { TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                Text(if (language == "ar") "تم" else if (language == "en") "Done" else "Gereed", color = NoteLayoutColors.Accent)
            } }
        }
    }
}

@Composable
private fun NoteTagChipRow(
    tags: List<String>,
    selectedTags: Set<String>,
    onTagClick: (String) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        tags.forEach { tag ->
            NoteFilterChip(
                label = tag,
                selected = selectedTags.any { it.equals(tag, ignoreCase = true) },
                onClick = { onTagClick(tag) }
            )
        }
    }
}

@Composable
private fun NoteFilterChip(label: String, selected: Boolean, onClick: () -> Unit) {
    Text(
        label,
        modifier = Modifier
            .clip(RoundedCornerShape(AppShape.smallControl))
            .background(if (selected) NoteLayoutColors.ChipSelected else NoteLayoutColors.Chip)
            .border(
                1.dp,
                if (selected) NoteLayoutColors.Accent.copy(alpha = 0.78f) else NoteLayoutColors.Border.copy(alpha = 0.72f),
                RoundedCornerShape(AppShape.smallControl)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 6.dp),
        fontSize = 11.sp,
        color = if (selected) NoteLayoutColors.TextPrimary else NoteLayoutColors.TextSecondary,
        fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
    )
}

private fun noteTagCategories(language: String): List<String> = when (language) {
    "en" -> listOf("Tafsir", "Memorization", "Question", "Reflection", "Dua", "Tajweed")
    "ar" -> listOf("تفسير", "حفظ", "سؤال", "تأمل", "دعاء", "تجويد")
    else -> listOf("Tafsir", "Memorisatie", "Vraag", "Reflectie", "Dua", "Tajweed")
}

private fun noteTagList(tags: String): List<String> =
    tags.split(",", ";", "#")
        .map { it.trim() }
        .filter { it.isNotBlank() }
        .distinctBy { it.lowercase() }

private fun toggleTagText(currentTags: String, tag: String): String {
    val tags = noteTagList(currentTags).toMutableList()
    val existingIndex = tags.indexOfFirst { it.equals(tag, ignoreCase = true) }
    if (existingIndex >= 0) {
        tags.removeAt(existingIndex)
    } else {
        tags.add(tag)
    }
    return tags.joinToString(", ")
}

private fun buildNotesExportJson(notes: List<AyahNote>): String {
    val notesArray = JSONArray()
    notes.forEach { note ->
        notesArray.put(
            JSONObject()
                .put("id", note.id)
                .put("userId", JSONObject.NULL)
                .put("scope_type", note.scopeType)
                .put("juz_number", note.juzNumber ?: JSONObject.NULL)
                .put("hizb_number", note.hizbNumber ?: JSONObject.NULL)
                .put("rub_number", note.rubNumber ?: JSONObject.NULL)
                .put("surahNumber", note.surahId ?: JSONObject.NULL)
                .put("surahName", note.surahName)
                .put("ayahNumber", note.ayahNumber ?: JSONObject.NULL)
                .put("title", note.title)
                .put("text", note.note)
                .put("folder", note.folder)
                .put("tags", JSONArray(noteTagList(note.tags)))
                .put("rawTags", note.tags)
                .put("fontSize", note.fontSize)
                .put("headingLevel", note.headingLevel)
                .put("isBold", note.isBold)
                .put("isItalic", note.isItalic)
                .put("isUnderline", note.isUnderline)
                .put("isStrike", note.isStrike)
                .put("listMode", note.listMode)
                .put("textColorKey", note.textColorKey)
                .put("formatSpans", note.formatSpans)
                .put("isPinned", note.isPinned)
                .put("createdAt", JSONObject.NULL)
                .put("updatedAt", epochMillisToIso(note.updatedAt))
                .put("updatedAtMillis", note.updatedAt)
        )
    }
    return JSONObject()
        .put("schemaVersion", 2)
        .put("exportedAt", Instant.now().toString())
        .put("app", "Quran Tracker")
        .put("type", "notes_export")
        .put("userScope", "local_device")
        .put("notes", notesArray)
        .toString(2)
}

private fun notesExportFileName(): String {
    val date = LocalDate.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_LOCAL_DATE)
    return "quran_tracker_notes_export_$date.json"
}

private fun epochMillisToIso(epochMillis: Long): String =
    Instant.ofEpochMilli(epochMillis).toString()

@Composable
private fun EditorToolbar(
    strings: NoteStrings,
    fontSize: Int,
    onFontSizeChange: (Int) -> Unit,
    headingLevel: Int,
    onHeadingChange: (Int) -> Unit,
    isBold: Boolean,
    onBoldChange: (Boolean) -> Unit,
    isItalic: Boolean,
    onItalicChange: (Boolean) -> Unit,
    isUnderline: Boolean,
    onUnderlineChange: (Boolean) -> Unit,
    isStrike: Boolean,
    onStrikeChange: (Boolean) -> Unit,
    listMode: String,
    onListModeChange: (String) -> Unit,
    textColorKey: String,
    onTextColorChange: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(strings.format, fontSize = 12.sp, color = NoteLayoutColors.TextMuted)
            Row(verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = { onFontSizeChange(fontSize - 1) }) { Text("-", color = NoteLayoutColors.Accent) }
                Text("${strings.fontSize}: $fontSize", fontSize = 11.sp, color = NoteLayoutColors.TextMuted)
                TextButton(onClick = { onFontSizeChange(fontSize + 1) }) { Text("+", color = NoteLayoutColors.Accent) }
            }
        }
        Row(
            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            FormatChip("H1", selected = headingLevel == 1) { onHeadingChange(if (headingLevel == 1) 0 else 1) }
            FormatChip("H2", selected = headingLevel == 2) { onHeadingChange(if (headingLevel == 2) 0 else 2) }
            FormatChip("H3", selected = headingLevel == 3) { onHeadingChange(if (headingLevel == 3) 0 else 3) }
            FormatChip("B", selected = isBold) { onBoldChange(!isBold) }
            FormatChip("I", selected = isItalic) { onItalicChange(!isItalic) }
            FormatChip("U", selected = isUnderline) { onUnderlineChange(!isUnderline) }
            FormatChip("S", selected = isStrike) { onStrikeChange(!isStrike) }
            FormatChip("*", selected = listMode == "bullet") {
                onListModeChange(if (listMode == "bullet") "none" else "bullet")
            }
            FormatChip("1.", selected = listMode == "numbered") {
                onListModeChange(if (listMode == "numbered") "none" else "numbered")
            }
            FormatChip("[ ]", selected = listMode == "todo") {
                onListModeChange(if (listMode == "todo") "none" else "todo")
            }
        }
        Row(
            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            noteTextColors().forEach { option ->
                ColorChip(
                    color = option.color,
                    selected = textColorKey == option.key,
                    onClick = { onTextColorChange(option.key) }
                )
            }
        }
    }
}

@Composable
private fun FormatChip(label: String, selected: Boolean = false, onClick: () -> Unit) {
    Text(
        label,
        modifier = Modifier
            .clip(RoundedCornerShape(AppShape.smallControl))
            .background(if (selected) NoteLayoutColors.Accent else NoteLayoutColors.Chip)
            .border(1.dp, if (selected) NoteLayoutColors.TextPrimary else NoteLayoutColors.Border, RoundedCornerShape(AppShape.smallControl))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 6.dp),
        fontSize = 12.sp,
        color = if (selected) NoteLayoutColors.Background else NoteLayoutColors.TextPrimary,
        fontWeight = FontWeight.Bold
    )
}

@Composable
private fun ColorChip(color: Color, selected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(AppComponentDefaults.minTouchTarget)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .size(30.dp)
                .clip(RoundedCornerShape(AppShape.smallControl))
                .background(color)
                .border(
                    width = if (selected) 3.dp else 1.dp,
                    color = if (selected) NoteLayoutColors.TextPrimary else NoteLayoutColors.Border,
                    shape = RoundedCornerShape(AppShape.smallControl)
                )
        )
    }
}

@Composable
private fun FormattedNoteText(
    note: String,
    fontSize: Int,
    headingLevel: Int,
    isBold: Boolean,
    isItalic: Boolean,
    isUnderline: Boolean,
    isStrike: Boolean,
    listMode: String,
    textColorKey: String = "gold",
    formatSpans: List<NoteFormatSpan> = emptyList(),
    modifier: Modifier = Modifier,
    maxLines: Int? = null,
    onToggleTodoLine: ((Int) -> Unit)? = null
) {
    val lines = note.lines().ifEmpty { listOf(note) }
    val visibleLines = maxLines?.let { lines.take(it) } ?: lines
    val textSize = noteDisplayFontSize(fontSize, headingLevel).sp
    val weight = if (isBold || headingLevel > 0) FontWeight.Bold else FontWeight.Normal
    val style = if (isItalic) FontStyle.Italic else FontStyle.Normal
    val decoration = noteTextDecoration(isUnderline, isStrike)
    val textColor = noteTextColor(textColorKey)

    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        when (listMode) {
            "bullet" -> visibleLines.forEach { line ->
                FormattedListLine("*", line, textSize, textColor, weight, style, decoration)
            }
            "numbered" -> visibleLines.forEachIndexed { index, line ->
                FormattedListLine("${index + 1}.", line, textSize, textColor, weight, style, decoration)
            }
            "todo" -> visibleLines.forEachIndexed { index, line ->
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                    Checkbox(
                        checked = isTodoChecked(line),
                        onCheckedChange = if (onToggleTodoLine == null) null else {
                            { _: Boolean -> onToggleTodoLine(index) }
                        }
                    )
                    Text(
                        cleanTodoLine(line),
                        modifier = Modifier.weight(1f),
                        fontSize = textSize,
                        color = textColor,
                        fontWeight = weight,
                        fontStyle = style,
                        textDecoration = decoration,
                        textAlign = TextAlign.Start,
                        style = TextStyle(textDirection = TextDirection.Content)
                    )
                }
            }
            else -> {
                if (formatSpans.isNotEmpty()) {
                    Text(
                        buildFormattedNoteString(note, formatSpans),
                        fontSize = 16.sp,
                        color = NoteLayoutColors.TextPrimary,
                        textAlign = TextAlign.Start,
                        style = TextStyle(textDirection = TextDirection.Content),
                        maxLines = maxLines ?: Int.MAX_VALUE,
                        overflow = if (maxLines == null) TextOverflow.Clip else TextOverflow.Ellipsis,
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    Text(
                        note,
                        fontSize = textSize,
                        color = textColor,
                        fontWeight = weight,
                        fontStyle = style,
                        textDecoration = decoration,
                        textAlign = TextAlign.Start,
                        style = TextStyle(textDirection = TextDirection.Content),
                        maxLines = maxLines ?: Int.MAX_VALUE,
                        overflow = if (maxLines == null) TextOverflow.Clip else TextOverflow.Ellipsis,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}

@Composable
private fun FormattedListLine(
    marker: String,
    text: String,
    fontSize: TextUnit,
    textColor: Color,
    fontWeight: FontWeight,
    fontStyle: FontStyle,
    textDecoration: TextDecoration
) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
        Text(marker, fontSize = fontSize, color = NoteLayoutColors.TextMuted, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text,
            modifier = Modifier.weight(1f),
            fontSize = fontSize,
            color = textColor,
            fontWeight = fontWeight,
            fontStyle = fontStyle,
            textDecoration = textDecoration,
            textAlign = TextAlign.Start,
                        style = TextStyle(textDirection = TextDirection.Content)
        )
    }
}

private fun noteDisplayFontSize(base: Int, headingLevel: Int): Int = when (headingLevel.coerceIn(0, 3)) {
    1 -> base + 8
    2 -> base + 5
    3 -> base + 3
    else -> base
}.coerceIn(12, 34)

private fun noteTextDecoration(isUnderline: Boolean, isStrike: Boolean): TextDecoration = when {
    isUnderline && isStrike -> TextDecoration.combine(listOf(TextDecoration.Underline, TextDecoration.LineThrough))
    isUnderline -> TextDecoration.Underline
    isStrike -> TextDecoration.LineThrough
    else -> TextDecoration.None
}

private data class NoteTextColor(val key: String, val color: Color)

private fun noteTextColors() = listOf(
    NoteTextColor("gold", NoteLayoutColors.TextPrimary),
    NoteTextColor("white", NoteLayoutColors.TextPrimary),
    NoteTextColor("green", DoneGreen),
    NoteTextColor("blue", ReadBlue),
    NoteTextColor("rose", ChartPink),
    NoteTextColor("violet", ChartPurple)
)

private fun noteTextColor(key: String): Color =
    noteTextColors().firstOrNull { it.key == key }?.color ?: NoteLayoutColors.TextPrimary

private data class ActiveNoteFormat(
    val fontSize: Int,
    val headingLevel: Int,
    val isBold: Boolean,
    val isItalic: Boolean,
    val isUnderline: Boolean,
    val isStrike: Boolean,
    val textColorKey: String
) {
    val hasFormatting: Boolean
        get() = fontSize != 16 ||
            headingLevel != 0 ||
            isBold ||
            isItalic ||
            isUnderline ||
            isStrike ||
            textColorKey != "gold"
}

private data class NoteFormatSpan(
    val start: Int,
    val end: Int,
    val fontSize: Int,
    val headingLevel: Int,
    val isBold: Boolean,
    val isItalic: Boolean,
    val isUnderline: Boolean,
    val isStrike: Boolean,
    val textColorKey: String
)

private class NoteFormatVisualTransformation(
    private val spans: List<NoteFormatSpan>
) : VisualTransformation {
    override fun filter(text: AnnotatedString): TransformedText {
        return TransformedText(buildFormattedNoteString(text.text, spans), OffsetMapping.Identity)
    }
}

private fun buildFormattedNoteString(text: String, spans: List<NoteFormatSpan>): AnnotatedString {
    val builder = AnnotatedString.Builder(text)
    spans.forEach { span ->
        val safeStart = span.start.coerceIn(0, text.length)
        val safeEnd = span.end.coerceIn(safeStart, text.length)
        if (safeEnd > safeStart) {
            builder.addStyle(
                SpanStyle(
                    fontSize = noteDisplayFontSize(span.fontSize, span.headingLevel).sp,
                    color = noteTextColor(span.textColorKey),
                    fontWeight = if (span.isBold || span.headingLevel > 0) FontWeight.Bold else FontWeight.Normal,
                    fontStyle = if (span.isItalic) FontStyle.Italic else FontStyle.Normal,
                    textDecoration = noteTextDecoration(span.isUnderline, span.isStrike)
                ),
                safeStart,
                safeEnd
            )
        }
    }
    return builder.toAnnotatedString()
}

private fun updateFormatSpansForTextChange(
    oldText: String,
    newText: String,
    spans: List<NoteFormatSpan>,
    activeFormat: ActiveNoteFormat
): List<NoteFormatSpan> {
    if (oldText == newText) return spans

    var prefix = 0
    val shortest = minOf(oldText.length, newText.length)
    while (prefix < shortest && oldText[prefix] == newText[prefix]) prefix++

    var suffix = 0
    while (
        suffix < oldText.length - prefix &&
        suffix < newText.length - prefix &&
        oldText[oldText.lastIndex - suffix] == newText[newText.lastIndex - suffix]
    ) {
        suffix++
    }

    val removedEnd = oldText.length - suffix
    val insertedEnd = newText.length - suffix
    val insertedLength = insertedEnd - prefix
    val delta = newText.length - oldText.length

    val shifted = spans.mapNotNull { span ->
        val newStart: Int
        val newEnd: Int
        when {
            span.end <= prefix -> {
                newStart = span.start
                newEnd = span.end
            }
            span.start >= removedEnd -> {
                newStart = span.start + delta
                newEnd = span.end + delta
            }
            else -> {
                newStart = minOf(span.start, prefix)
                newEnd = maxOf(newStart, span.end + delta)
            }
        }
        if (newEnd > newStart) span.copy(start = newStart, end = newEnd) else null
    }.toMutableList()

    if (insertedLength > 0 && activeFormat.hasFormatting) {
        shifted.add(
            NoteFormatSpan(
                start = prefix,
                end = insertedEnd,
                fontSize = activeFormat.fontSize,
                headingLevel = activeFormat.headingLevel,
                isBold = activeFormat.isBold,
                isItalic = activeFormat.isItalic,
                isUnderline = activeFormat.isUnderline,
                isStrike = activeFormat.isStrike,
                textColorKey = activeFormat.textColorKey
            )
        )
    }
    return mergeAdjacentFormatSpans(shifted)
}

private fun mergeAdjacentFormatSpans(spans: List<NoteFormatSpan>): List<NoteFormatSpan> {
    val sorted = spans.sortedWith(compareBy<NoteFormatSpan> { it.start }.thenBy { it.end })
    val merged = mutableListOf<NoteFormatSpan>()
    sorted.forEach { span ->
        val last = merged.lastOrNull()
        if (
            last != null &&
            last.end == span.start &&
            last.fontSize == span.fontSize &&
            last.headingLevel == span.headingLevel &&
            last.isBold == span.isBold &&
            last.isItalic == span.isItalic &&
            last.isUnderline == span.isUnderline &&
            last.isStrike == span.isStrike &&
            last.textColorKey == span.textColorKey
        ) {
            merged[merged.lastIndex] = last.copy(end = span.end)
        } else {
            merged.add(span)
        }
    }
    return merged
}

private fun encodeFormatSpans(spans: List<NoteFormatSpan>): String =
    spans.joinToString(";") { span ->
        listOf(
            span.start,
            span.end,
            span.fontSize,
            span.headingLevel,
            if (span.isBold) 1 else 0,
            if (span.isItalic) 1 else 0,
            if (span.isUnderline) 1 else 0,
            if (span.isStrike) 1 else 0,
            span.textColorKey
        ).joinToString(",")
    }

private fun decodeFormatSpans(encoded: String): List<NoteFormatSpan> {
    if (encoded.isBlank()) return emptyList()
    return encoded.split(";").mapNotNull { raw ->
        val parts = raw.split(",")
        if (parts.size != 9) return@mapNotNull null
        NoteFormatSpan(
            start = parts[0].toIntOrNull() ?: return@mapNotNull null,
            end = parts[1].toIntOrNull() ?: return@mapNotNull null,
            fontSize = parts[2].toIntOrNull() ?: 16,
            headingLevel = parts[3].toIntOrNull() ?: 0,
            isBold = parts[4] == "1",
            isItalic = parts[5] == "1",
            isUnderline = parts[6] == "1",
            isStrike = parts[7] == "1",
            textColorKey = parts[8].ifBlank { "gold" }
        )
    }
}

private fun isTodoChecked(line: String): Boolean = line.trimStart().startsWith("[x]", ignoreCase = true)

private fun cleanTodoLine(line: String): String {
    val trimmed = line.trimStart()
    return when {
        trimmed.startsWith("[x]", ignoreCase = true) -> trimmed.drop(3).trimStart()
        trimmed.startsWith("[ ]") -> trimmed.drop(3).trimStart()
        else -> trimmed
    }
}

private fun toggleTodoLine(note: String, index: Int): String {
    val lines = note.lines().toMutableList()
    val original = lines.getOrNull(index) ?: return note
    val trimmed = original.trimStart()
    val indent = original.take(original.length - trimmed.length)
    lines[index] = when {
        trimmed.startsWith("[x]", ignoreCase = true) -> indent + "[ ] " + trimmed.drop(3).trimStart()
        trimmed.startsWith("[ ]") -> indent + "[x] " + trimmed.drop(3).trimStart()
        else -> indent + "[x] " + trimmed
    }
    return lines.joinToString("\n")
}

@Composable
internal fun noteTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedTextColor = NoteLayoutColors.TextPrimary,
    unfocusedTextColor = NoteLayoutColors.TextPrimary,
    focusedBorderColor = NoteLayoutColors.Accent,
    unfocusedBorderColor = NoteLayoutColors.Border,
    focusedLabelColor = NoteLayoutColors.Accent,
    unfocusedLabelColor = NoteLayoutColors.TextMuted,
    focusedPlaceholderColor = NoteLayoutColors.TextMuted,
    unfocusedPlaceholderColor = NoteLayoutColors.TextMuted,
    focusedContainerColor = NoteLayoutColors.Field,
    unfocusedContainerColor = NoteLayoutColors.Field,
    cursorColor = NoteLayoutColors.Accent
)

@Composable
internal fun NotesChip(
    selected: Boolean,
    onClick: () -> Unit,
    label: @Composable () -> Unit,
    leadingIcon: (@Composable () -> Unit)? = null
) {
    FilterChip(
        selected = selected, onClick = onClick, label = label, leadingIcon = leadingIcon,
        colors = androidx.compose.material3.FilterChipDefaults.filterChipColors(
            containerColor = NoteLayoutColors.Background,
            labelColor = NoteLayoutColors.TextSecondary,
            iconColor = NoteLayoutColors.Accent,
            selectedContainerColor = NoteLayoutColors.PinnedCard,
            selectedLabelColor = NoteLayoutColors.TextPrimary,
            selectedLeadingIconColor = NoteLayoutColors.Accent
        ),
        border = androidx.compose.material3.FilterChipDefaults.filterChipBorder(
            enabled = true,
            selected = selected,
            borderColor = NoteLayoutColors.SoftBorder,
            selectedBorderColor = NoteLayoutColors.Accent.copy(alpha = 0.6f)
        )
    )
}
