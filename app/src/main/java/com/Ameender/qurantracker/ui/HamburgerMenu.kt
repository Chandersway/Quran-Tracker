package com.Ameender.qurantracker.ui

import android.content.Context
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.Ameender.qurantracker.data.SupabaseConfig
import com.Ameender.qurantracker.data.SupabaseService
import com.Ameender.qurantracker.data.ReadingGroupLeaderboardRow
import com.Ameender.qurantracker.viewmodel.GoalViewModel
import com.Ameender.qurantracker.viewmodel.PlanningViewModel
import com.Ameender.qurantracker.viewmodel.QuranViewModel
import com.Ameender.qurantracker.viewmodel.deriveDailyGoalFromJourney
import coil.compose.AsyncImage
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlinx.coroutines.launch

@Composable
fun HamburgerMenu(
    isOpen: Boolean,
    onClose: () -> Unit,
    onNavigateToAgenda: () -> Unit,
    onNavigateToSurahs: () -> Unit,
    onNavigateToJuzz: () -> Unit,
    onNavigateToHizb: () -> Unit,
    onNavigateToBookmark: (ReaderBookmarkSummary) -> Unit,
    goalViewModel: GoalViewModel = viewModel(),
    planningViewModel: PlanningViewModel = viewModel(),
    quranViewModel: QuranViewModel = viewModel(),
    themeMode: String = "light",
    onThemeModeChange: (String) -> Unit = {},
    hifzTintEnabled: Boolean = false,
    onHifzTintEnabledChange: (Boolean) -> Unit = {},
    mushafMode: String = "hafs",
    onMushafModeChange: (String) -> Unit = {},
    appLanguage: String = "nl",
    onAppLanguageChange: (String) -> Unit = {},
    selectedReciterName: String = "",
    onSelectedReciterNameChange: (String) -> Unit = {}
) {
    val context = LocalContext.current
    val goal by goalViewModel.dailyGoal.collectAsState()
    val readingJourney by goalViewModel.readingJourney.collectAsState()
    val bookmarkSummaries = remember(isOpen) { loadAllReaderBookmarkSummaries(context) }
    val reciterOptions = remember {
        loadSurahAudioOptions(context, 1).distinctBy { "${it.reciterName}|${it.rewayaName}" }
    }
    val text = AppText.strings(appLanguage)

    var selectedUnit by remember(goal) { mutableStateOf(goal.unit) }
    var targetInput by remember(goal) { mutableStateOf(goal.target.toString()) }
    var reminderHour by remember(goal) { mutableStateOf(goal.reminderHour) }
    var reminderMinute by remember(goal) { mutableStateOf(goal.reminderMinute) }
    var saved by remember { mutableStateOf(false) }
    var dailyGoalOpen by remember { mutableStateOf(false) }
    var readingJourneyOpen by remember { mutableStateOf(false) }
    var journeyEnabled by remember(readingJourney) { mutableStateOf(readingJourney.enabled) }
    var journeyDays by remember(readingJourney) { mutableStateOf(readingJourney.totalDays.toString()) }
    var journeyAutoGoal by remember(readingJourney) { mutableStateOf(readingJourney.autoDailyGoal) }
    var journeySaved by remember { mutableStateOf(false) }
    var fihresOpen by remember { mutableStateOf(false) }
    var bookmarksOpen by remember { mutableStateOf(false) }
    var leesplanningOpen by remember { mutableStateOf(false) }
    var mediaPageOpen by remember { mutableStateOf(false) }
    var accountPageOpen by remember { mutableStateOf(false) }
    var groupsPageOpen by remember { mutableStateOf(false) }
    var mediaFilter by remember { mutableStateOf("Alles") }
    var hifzRangeOpen by remember { mutableStateOf(false) }
    var hifzRangeType by remember { mutableStateOf("surah") }
    var hifzRangeFrom by remember { mutableStateOf("1") }
    var hifzRangeTo by remember { mutableStateOf("1") }
    var hifzRangeScore by remember { mutableStateOf("50") }
    var hifzRangeSaved by remember { mutableStateOf(false) }

    if (isOpen) {
        Box(modifier = Modifier.fillMaxSize()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(ScrimBlack)
                    .clickable { onClose() }
            )

            AnimatedVisibility(
                visible = isOpen,
                enter = slideInHorizontally { -it },
                exit = slideOutHorizontally { -it }
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxHeight()
                        .width(SettingsMenuStyle.panelWidth)
                        .background(DarkNavy)
                        .padding(horizontal = 12.dp, vertical = 12.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    if (mediaPageOpen) {
                        MediaSettingsPage(
                            reciterOptions = reciterOptions,
                            selectedReciterName = selectedReciterName,
                            selectedFilter = mediaFilter,
                            onFilterChange = { mediaFilter = it },
                            onSelectedReciterNameChange = onSelectedReciterNameChange,
                            onBack = { mediaPageOpen = false }
                        )
                    } else if (accountPageOpen) {
                        AccountSettingsPage(
                            onBack = { accountPageOpen = false }
                        )
                    } else if (groupsPageOpen) {
                        GroupsSettingsPage(
                            onBack = { groupsPageOpen = false }
                        )
                    } else {
                    SettingsCard {
                        SettingsHeader(onClose = onClose)
                        HorizontalDivider(color = BorderNavy.copy(alpha = 0.55f))
                        SettingsActionRow(
                            icon = Icons.Default.MenuBook,
                            title = text.mushaf,
                            subtitle = if (mushafMode == "warsh") text.warshMuhammadi else text.hafsMedina
                        )
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = SettingsMenuStyle.innerPadding, vertical = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            SettingsChoiceChip(
                                label = text.hafsMedina,
                                selected = mushafMode == "hafs",
                                onClick = { onMushafModeChange("hafs") },
                                modifier = Modifier.weight(1f)
                            )
                            SettingsChoiceChip(
                                label = text.warshMuhammadi,
                                selected = mushafMode == "warsh",
                                onClick = { onMushafModeChange("warsh") },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    SettingsGap()

                    SettingsCard {
                        MenuItemExpandableRow(
                            icon = Icons.Default.List,
                            title = text.tableOfContents,
                            subtitle = text.tableOfContents,
                            expanded = fihresOpen,
                            onClick = { fihresOpen = !fihresOpen }
                        )
                        AnimatedVisibility(visible = fihresOpen) {
                            Column {
                                SettingsSmallNavRow(
                                    title = text.surah,
                                    subtitle = text.allChapters,
                                    onClick = {
                                        onClose()
                                        onNavigateToSurahs()
                                    }
                                )
                                SettingsSmallNavRow(
                                    title = text.juz,
                                    subtitle = text.thirtyAjza,
                                    onClick = {
                                        onClose()
                                        onNavigateToJuzz()
                                    }
                                )
                                SettingsSmallNavRow(
                                    title = text.hizb,
                                    subtitle = text.sixtyAhzaab,
                                    onClick = {
                                        onClose()
                                        onNavigateToHizb()
                                    }
                                )
                            }
                        }
                        SettingsDivider()
                        MenuItemExpandableRow(
                            icon = Icons.Default.BookmarkBorder,
                            title = text.bookmarks,
                            subtitle = if (bookmarkSummaries.isEmpty()) text.noBookmarks else "${bookmarkSummaries.size} ${text.savedPlaces}",
                            expanded = bookmarksOpen,
                            onClick = { bookmarksOpen = !bookmarksOpen }
                        )
                        AnimatedVisibility(visible = bookmarksOpen) {
                            Column {
                                if (bookmarkSummaries.isEmpty()) {
                                    Text(
                                        "${text.noBookmarks}.",
                                        fontSize = 12.sp,
                                        color = MutedGold,
                                        modifier = Modifier.padding(
                                            start = 52.dp,
                                            end = SettingsMenuStyle.innerPadding,
                                            bottom = 12.dp
                                        )
                                    )
                                } else {
                                    bookmarkSummaries.forEach { bookmark ->
                                        SettingsBookmarkRow(
                                            bookmark = bookmark,
                                            onClick = {
                                                onClose()
                                                onNavigateToBookmark(bookmark)
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }

                    SettingsGap()

                    SettingsCard {
                        MenuSwitchRow(
                            icon = Icons.Default.Check,
                            title = text.hifzScore,
                            subtitle = text.hifzScoreSubtitle,
                            checked = hifzTintEnabled,
                            onCheckedChange = onHifzTintEnabledChange
                        )
                        SettingsDivider()
                        MenuItemExpandableRow(
                            icon = Icons.Default.Settings,
                            title = text.scoreRange,
                            subtitle = text.scoreRangeSubtitle,
                            expanded = hifzRangeOpen,
                            onClick = { hifzRangeOpen = !hifzRangeOpen }
                        )
                        AnimatedVisibility(visible = hifzRangeOpen) {
                            HifzRangeEditor(
                                selectedType = hifzRangeType,
                                from = hifzRangeFrom,
                                to = hifzRangeTo,
                                score = hifzRangeScore,
                                saved = hifzRangeSaved,
                                onTypeChange = {
                                    hifzRangeType = it
                                    hifzRangeSaved = false
                                    val max = hifzRangeMax(it)
                                    hifzRangeFrom = hifzRangeFrom.toIntOrNull()?.coerceIn(1, max)?.toString() ?: "1"
                                    hifzRangeTo = hifzRangeTo.toIntOrNull()?.coerceIn(1, max)?.toString() ?: "1"
                                },
                                onFromChange = { hifzRangeFrom = it; hifzRangeSaved = false },
                                onToChange = { hifzRangeTo = it; hifzRangeSaved = false },
                                onScoreChange = { hifzRangeScore = it; hifzRangeSaved = false },
                                onSave = {
                                    quranViewModel.updateHifzScoreRange(
                                        type = hifzRangeType,
                                        from = hifzRangeFrom.toIntOrNull() ?: 1,
                                        to = hifzRangeTo.toIntOrNull() ?: 1,
                                        score = hifzRangeScore.toIntOrNull() ?: 0
                                    )
                                    hifzRangeSaved = true
                                }
                            )
                        }
                    }

                    SettingsGap()

                    SettingsCard {
                        MenuItemExpandableRow(
                            icon = Icons.Default.DateRange,
                            title = text.readingJourney,
                            subtitle = if (readingJourney.enabled) {
                                text.quranInDays.format(readingJourney.totalDays)
                            } else {
                                text.noEndGoal
                            },
                            expanded = readingJourneyOpen,
                            onClick = { readingJourneyOpen = !readingJourneyOpen }
                        )
                        AnimatedVisibility(visible = readingJourneyOpen) {
                            ReadingJourneyEditor(
                                enabled = journeyEnabled,
                                days = journeyDays,
                                autoGoal = journeyAutoGoal,
                                saved = journeySaved,
                                onEnabledChange = {
                                    journeyEnabled = it
                                    journeySaved = false
                                },
                                onDaysChange = {
                                    journeyDays = it
                                    journeySaved = false
                                },
                                onAutoGoalChange = {
                                    journeyAutoGoal = it
                                    journeySaved = false
                                },
                                onSave = {
                                    val safeDays = (journeyDays.toIntOrNull() ?: 30).coerceIn(1, 240)
                                    journeyDays = safeDays.toString()
                                    goalViewModel.saveReadingJourney(
                                        enabled = journeyEnabled,
                                        totalDays = safeDays,
                                        startDate = todayDateKey(),
                                        autoDailyGoal = journeyAutoGoal
                                    )
                                    journeySaved = true
                                }
                            )
                        }
                    }

                    SettingsGap()

                    SettingsCard {
                        MenuItemExpandableRow(
                            icon = Icons.Default.DateRange,
                            title = text.readingPlan,
                            subtitle = text.khatmaAndAgenda,
                            expanded = leesplanningOpen,
                            onClick = { leesplanningOpen = !leesplanningOpen }
                        )
                        AnimatedVisibility(visible = leesplanningOpen) {
                            Column {
                                SettingsSmallNavRow(
                                    title = text.khatma,
                                    subtitle = text.makeReadingPlan,
                                    onClick = {
                                        onClose()
                                        onNavigateToAgenda()
                                    }
                                )
                                SettingsSmallNavRow(
                                    title = text.agenda,
                                    subtitle = text.viewPlanning,
                                    onClick = {
                                        onClose()
                                        onNavigateToAgenda()
                                    }
                                )
                            }
                        }
                        SettingsDivider()
                        SettingsActionRow(Icons.Default.Info, text.tasbih, text.tasbihLater)
                        SettingsDivider()
                        SettingsActionRow(Icons.Default.Info, text.qibla, text.qiblaLater)
                        SettingsDivider()
                        SettingsActionRow(
                            icon = Icons.Default.PlayArrow,
                            title = text.media,
                            subtitle = if (selectedReciterName.isBlank()) text.defaultReciter else selectedReciterName,
                            onClick = { mediaPageOpen = true }
                        )
                        SettingsDivider()
                        SettingsActionRow(Icons.Default.Info, text.offline, text.downloadsLater)
                    }

                    SettingsGap()

                    SettingsCard {
                        SettingsActionRow(
                            icon = Icons.Default.Groups,
                            title = text.groups,
                            subtitle = text.groupsSubtitle,
                            onClick = { groupsPageOpen = true }
                        )
                        SettingsDivider()
                        SettingsActionRow(
                            icon = Icons.Default.AccountCircle,
                            title = text.account,
                            subtitle = text.accountSubtitle,
                            onClick = { accountPageOpen = true }
                        )
                    }

                    SettingsGap()

                    SettingsCard {
                        MenuItemExpandableRow(
                            icon = Icons.Default.Info,
                            title = text.appearance,
                            subtitle = if (themeMode == "dark") text.darkTheme else text.lightTheme,
                            expanded = false,
                            onClick = {}
                        )
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = SettingsMenuStyle.innerPadding, vertical = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            SettingsSwatch(Color.White, themeMode == "light") { onThemeModeChange("light") }
                            SettingsSwatch(Color(0xFF15172A), themeMode == "dark") { onThemeModeChange("dark") }
                            SettingsSwatch(DarkNavy, false) { onThemeModeChange("light") }
                        }
                        SettingsDivider()
                        MenuItemExpandableRow(
                            icon = Icons.Default.Info,
                            title = text.language,
                            subtitle = AppText.languageLabel(appLanguage, appLanguage),
                            expanded = false,
                            onClick = {}
                        )
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = SettingsMenuStyle.innerPadding, vertical = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf("nl" to "NL", "en" to "EN", "ar" to "عربي", "fr" to "FR").forEach { (language, label) ->
                                SettingsChoiceChip(
                                    label = label,
                                    selected = appLanguage == language,
                                    onClick = { onAppLanguageChange(language) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    SettingsGap()

                    SettingsCard {
                        MenuItemExpandableRow(
                            icon = Icons.Default.DateRange,
                            title = text.dailyGoal,
                            subtitle = "${goal.target} ${goalViewModel.unitLabel(goal.unit)} ${text.perDay}",
                            expanded = dailyGoalOpen,
                            onClick = { dailyGoalOpen = !dailyGoalOpen }
                        )
                        AnimatedVisibility(visible = dailyGoalOpen) {
                            DailyGoalEditor(
                                selectedUnit = selectedUnit,
                                targetInput = targetInput,
                                reminderHour = reminderHour,
                                reminderMinute = reminderMinute,
                                saved = saved,
                                unitLabel = { goalViewModel.unitLabel(it) },
                                onUnitChange = { selectedUnit = it; saved = false },
                                onTargetChange = {
                                    targetInput = it
                                    saved = false
                                },
                                onReminderHourChange = { reminderHour = it; saved = false },
                                onReminderMinuteChange = { reminderMinute = it; saved = false },
                                onSave = {
                                    val target = (targetInput.toIntOrNull() ?: 1)
                                        .coerceIn(1, dailyGoalMaxForUnit(selectedUnit))
                                    goalViewModel.saveGoal(selectedUnit, target, reminderHour, reminderMinute)
                                    targetInput = target.toString()
                                    saved = true
                                }
                            )
                        }
                    }

                    SettingsGap()
                    }
                }
            }
        }
    }
}

@Composable
private fun GroupsSettingsPage(onBack: () -> Unit) {
    val scope = rememberCoroutineScope()
    var groupName by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var goal by remember { mutableStateOf("week") }
    var unit by remember { mutableStateOf("page") }
    var createdGroupName by remember { mutableStateOf("") }
    var groupCode by remember { mutableStateOf("") }
    var joinCode by remember { mutableStateOf("") }
    var progressAmount by remember { mutableStateOf("1") }
    var progressUnit by remember { mutableStateOf("page") }
    var leaderboard by remember { mutableStateOf<List<ReadingGroupLeaderboardRow>>(emptyList()) }
    var busy by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("Maak een groep online. Je moet hiervoor ingelogd zijn.") }
    val activeGroupCode = groupCode.ifBlank { joinCode.trim().uppercase() }

    fun createOnlineGroup() {
        if (groupName.isBlank()) {
            message = "Geef je groep eerst een naam."
            return
        }
        val trimmedName = groupName.trim()
        val newGroupCode = buildGroupCode(trimmedName)
        busy = true
        scope.launch {
            val result = runCatching {
                SupabaseService.createReadingGroup(
                    name = trimmedName,
                    description = description.trim(),
                    goal = goal,
                    unit = unit,
                    code = newGroupCode
                )
            }
            busy = false
            result
                .onSuccess {
                    createdGroupName = trimmedName
                    groupCode = newGroupCode
                    message = "Groep opgeslagen. Deel de code met anderen."
                }
                .onFailure {
                    message = it.localizedMessage ?: "Groep opslaan is niet gelukt."
                }
        }
    }

    fun shareGroupProgress() {
        if (activeGroupCode.isBlank()) {
            message = "Maak eerst een groep of vul een groepcode in."
            return
        }
        val amount = progressAmount.toIntOrNull()
        if (amount == null || amount < 1) {
            message = "Vul een geldig aantal in."
            return
        }
        busy = true
        scope.launch {
            val result = runCatching {
                SupabaseService.recordGroupProgress(
                    code = activeGroupCode,
                    unit = progressUnit,
                    amount = amount
                )
            }
            busy = false
            result
                .onSuccess { message = "Voortgang gedeeld met groep $activeGroupCode." }
                .onFailure { message = it.localizedMessage ?: "Voortgang delen is niet gelukt." }
        }
    }

    fun loadLeaderboard() {
        if (activeGroupCode.isBlank()) {
            message = "Maak eerst een groep of vul een groepcode in."
            return
        }
        busy = true
        scope.launch {
            val result = runCatching { SupabaseService.loadGroupLeaderboard(activeGroupCode) }
            busy = false
            result
                .onSuccess {
                    leaderboard = it
                    message = if (it.isEmpty()) "Nog geen voortgang in groep $activeGroupCode." else "Ranglijst bijgewerkt."
                }
                .onFailure { message = it.localizedMessage ?: "Ranglijst laden is niet gelukt." }
        }
    }

    fun joinOnlineGroup() {
        if (joinCode.isBlank()) {
            message = "Vul eerst een groepcode in."
            return
        }
        val cleanCode = joinCode.trim().uppercase()
        busy = true
        scope.launch {
            val result = runCatching { SupabaseService.joinReadingGroup(cleanCode) }
            busy = false
            result
                .onSuccess {
                    groupCode = cleanCode
                    createdGroupName = "Deelnemer"
                    message = "Je bent toegevoegd aan groep $cleanCode."
                }
                .onFailure {
                    message = it.localizedMessage ?: "Deelnemen is niet gelukt."
                }
        }
    }

    SettingsCard {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(SettingsMenuStyle.rowHeight),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ChevronLeft, contentDescription = "Terug", tint = ChevronNavy)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(horizontalAlignment = Alignment.End) {
                    Text("Groepen", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    Text("Samen lezen", fontSize = 11.sp, color = MutedGold)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Icon(
                    Icons.Default.Groups,
                    contentDescription = null,
                    tint = DoneGreen,
                    modifier = Modifier.size(SettingsMenuStyle.iconSize)
                )
            }
        }
        SettingsDivider()

        Column(
            modifier = Modifier.padding(SettingsMenuStyle.innerPadding),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(AppShape.control))
                    .background(PeriodItemSurface)
                    .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                    .padding(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.Info, contentDescription = null, tint = DoneGreen, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(message, fontSize = 12.sp, color = MutedGold, modifier = Modifier.weight(1f))
            }

            SettingsTextField(
                label = "Groepsnaam",
                value = groupName,
                placeholder = "Ramadan Khatma",
                onValueChange = { groupName = it }
            )
            SettingsTextField(
                label = "Beschrijving",
                value = description,
                placeholder = "Samen lezen en elkaar motiveren",
                onValueChange = { description = it }
            )

            Text("Doel", fontSize = 11.sp, color = MutedGold)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                SettingsChoiceChip(
                    label = "Vandaag",
                    selected = goal == "day",
                    onClick = { goal = "day" },
                    modifier = Modifier.weight(1f)
                )
                SettingsChoiceChip(
                    label = "Week",
                    selected = goal == "week",
                    onClick = { goal = "week" },
                    modifier = Modifier.weight(1f)
                )
                SettingsChoiceChip(
                    label = "Khatma",
                    selected = goal == "khatma",
                    onClick = { goal = "khatma" },
                    modifier = Modifier.weight(1f)
                )
            }

            Text("Meet-eenheid", fontSize = 11.sp, color = MutedGold)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                SettingsChoiceChip(
                    label = "Ayah",
                    selected = unit == "ayah",
                    onClick = { unit = "ayah" },
                    modifier = Modifier.weight(1f)
                )
                SettingsChoiceChip(
                    label = "Pagina",
                    selected = unit == "page",
                    onClick = { unit = "page" },
                    modifier = Modifier.weight(1f)
                )
                SettingsChoiceChip(
                    label = "Hizb",
                    selected = unit == "hizb",
                    onClick = { unit = "hizb" },
                    modifier = Modifier.weight(1f)
                )
            }

            Button(
                onClick = { createOnlineGroup() },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth().height(42.dp),
                shape = RoundedCornerShape(AppShape.control),
                colors = ButtonDefaults.buttonColors(containerColor = Gold)
            ) {
                Text(if (busy) "Opslaan..." else "Groep maken", color = DarkNavy, fontWeight = FontWeight.Bold)
            }

            if (groupCode.isNotBlank()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(AppShape.control))
                        .background(DeepNavy)
                        .border(1.dp, Gold.copy(alpha = 0.35f), RoundedCornerShape(AppShape.control))
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(createdGroupName, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    Text(groupGoalLabel(goal), fontSize = 12.sp, color = MutedGold)
                    Text("Code: $groupCode", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Gold)
                    Text(
                        "Deel deze code. Joinen met code komt in de volgende stap.",
                        fontSize = 11.sp,
                        color = DimGold
                    )
                }
            }

            SettingsDivider()
            Text("Deelnemen", fontSize = 12.sp, color = MutedGold, fontWeight = FontWeight.Bold)
            SettingsTextField(
                label = "Groepcode",
                value = joinCode,
                placeholder = "RAM-1234",
                onValueChange = { joinCode = it.uppercase() }
            )
            OutlinedButton(
                onClick = { joinOnlineGroup() },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth().height(42.dp),
                shape = RoundedCornerShape(AppShape.control),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight)
            ) {
                Text(if (busy) "Bezig..." else "Deelnemen met code", fontWeight = FontWeight.Bold)
            }

            SettingsDivider()
            Text("Voortgang delen", fontSize = 12.sp, color = MutedGold, fontWeight = FontWeight.Bold)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                SettingsChoiceChip(
                    label = "Ayah",
                    selected = progressUnit == "ayah",
                    onClick = { progressUnit = "ayah" },
                    modifier = Modifier.weight(1f)
                )
                SettingsChoiceChip(
                    label = "Pagina",
                    selected = progressUnit == "page",
                    onClick = { progressUnit = "page" },
                    modifier = Modifier.weight(1f)
                )
                SettingsChoiceChip(
                    label = "Hizb",
                    selected = progressUnit == "hizb",
                    onClick = { progressUnit = "hizb" },
                    modifier = Modifier.weight(1f)
                )
            }
            SettingsTextField(
                label = "Aantal",
                value = progressAmount,
                placeholder = "1",
                onValueChange = { value ->
                    progressAmount = value.filter { it.isDigit() }.take(4)
                }
            )
            Button(
                onClick = { shareGroupProgress() },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth().height(42.dp),
                shape = RoundedCornerShape(AppShape.control),
                colors = ButtonDefaults.buttonColors(containerColor = Gold)
            ) {
                Text(if (busy) "Delen..." else "Voortgang delen", color = DarkNavy, fontWeight = FontWeight.Bold)
            }

            SettingsDivider()
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Ranglijst", fontSize = 12.sp, color = MutedGold, fontWeight = FontWeight.Bold)
                    Text(
                        if (activeGroupCode.isBlank()) "Geen groep geselecteerd" else "Groep $activeGroupCode",
                        fontSize = 10.sp,
                        color = DimGold
                    )
                }
                OutlinedButton(
                    onClick = { loadLeaderboard() },
                    enabled = !busy,
                    shape = RoundedCornerShape(AppShape.smallControl),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight)
                ) {
                    Text("Ververs", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
            if (leaderboard.isEmpty()) {
                Text("Nog geen ranglijst geladen.", fontSize = 11.sp, color = DimGold)
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    leaderboard.forEachIndexed { index, row ->
                        GroupLeaderboardRow(rank = index + 1, row = row)
                    }
                }
            }
        }
    }
}

@Composable
private fun GroupLeaderboardRow(rank: Int, row: ReadingGroupLeaderboardRow) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.control))
            .background(PeriodItemSurface)
            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Box(
            modifier = Modifier
                .size(30.dp)
                .clip(RoundedCornerShape(AppShape.smallControl))
                .background(if (rank == 1) StrongGoldSurface else DeepNavy),
            contentAlignment = Alignment.Center
        ) {
            Text("#$rank", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = GoldLight)
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(row.label, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = GoldLight)
            Text(row.details, fontSize = 10.sp, color = MutedGold)
        }
        Text("${row.totalPoints} pt", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Gold)
    }
}

@Composable
private fun AccountSettingsPage(onBack: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var accountMode by remember { mutableStateOf("login") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var message by remember {
        mutableStateOf(
            if (SupabaseConfig.isConfigured) {
                "Inloggen is optioneel. Je app blijft lokaal werken zonder account."
            } else {
                "Supabase is nog niet ingesteld. Vul straks je Supabase URL en anon key in."
            }
        )
    }
    var currentUserEmail by remember { mutableStateOf<String?>(null) }
    var profileName by remember { mutableStateOf("") }
    var profileNameInput by remember { mutableStateOf("") }
    var profileAvatarUrl by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        currentUserEmail = runCatching { SupabaseService.currentUserEmail() }.getOrNull()
    }

    LaunchedEffect(currentUserEmail) {
        if (currentUserEmail != null) {
            profileName = runCatching { SupabaseService.loadProfileName() }.getOrNull().orEmpty()
            profileAvatarUrl = runCatching { SupabaseService.loadProfileAvatarUrl() }.getOrNull()
            profileNameInput = profileName
        } else {
            profileName = ""
            profileNameInput = ""
            profileAvatarUrl = null
        }
    }

    val avatarPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            busy = true
            scope.launch {
                val result = runCatching {
                    val mimeType = context.contentResolver.getType(uri) ?: "image/jpeg"
                    val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                        ?: error("Foto kon niet gelezen worden.")
                    SupabaseService.uploadProfileAvatar(bytes, mimeType)
                }
                busy = false
                message = result.fold(
                    onSuccess = { uploadedUrl ->
                        profileAvatarUrl = uploadedUrl
                        "Profielfoto opgeslagen."
                    },
                    onFailure = { it.localizedMessage ?: "Profielfoto uploaden is niet gelukt." }
                )
            }
        }
    }

    fun requireSupabase(): Boolean {
        if (!SupabaseConfig.isConfigured) {
            message = "Maak eerst een Supabase-project aan en vul de URL + anon key in."
            return false
        }
        return true
    }

    fun validateEmailLogin(): Boolean {
        if (!requireSupabase()) return false
        if (email.isBlank() || password.length < 6) {
            message = "Vul een e-mail en wachtwoord van minimaal 6 tekens in."
            return false
        }
        return true
    }

    fun validateSignup(): Boolean {
        if (!validateEmailLogin()) return false
        if (password != confirmPassword) {
            message = "De twee wachtwoorden zijn niet hetzelfde."
            return false
        }
        return true
    }

    SettingsCard {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(SettingsMenuStyle.rowHeight),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ChevronLeft, contentDescription = "Terug", tint = ChevronNavy)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(horizontalAlignment = Alignment.End) {
                    Text("Account", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    Text("Niet verplicht", fontSize = 11.sp, color = MutedGold)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Icon(
                    Icons.Default.AccountCircle,
                    contentDescription = null,
                    tint = DoneGreen,
                    modifier = Modifier.size(SettingsMenuStyle.iconSize)
                )
            }
        }
        SettingsDivider()

        Column(modifier = Modifier.padding(SettingsMenuStyle.innerPadding)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(AppShape.control))
                    .background(PeriodItemSurface)
                    .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                    .padding(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.Info, contentDescription = null, tint = DoneGreen, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(message, fontSize = 12.sp, color = MutedGold, modifier = Modifier.weight(1f))
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (currentUserEmail != null) {
                AccountProfilePanel(
                    email = currentUserEmail.orEmpty(),
                    profileName = profileName,
                    profileNameInput = profileNameInput,
                    profileAvatarUrl = profileAvatarUrl,
                    onProfileNameChange = { profileNameInput = it.take(40) },
                    onPickAvatar = { avatarPicker.launch("image/*") },
                    busy = busy,
                    onSaveProfileName = {
                        busy = true
                        scope.launch {
                            val result = runCatching { SupabaseService.saveProfileName(profileNameInput) }
                            busy = false
                            message = result.fold(
                                onSuccess = {
                                    profileName = profileNameInput.trim()
                                    "Profielnaam opgeslagen."
                                },
                                onFailure = { it.localizedMessage ?: "Profielnaam opslaan is niet gelukt." }
                            )
                        }
                    },
                    onSignOut = {
                        busy = true
                        scope.launch {
                            val result = runCatching { SupabaseService.signOut() }
                            busy = false
                            currentUserEmail = null
                            message = result.fold(
                                onSuccess = { "Je bent uitgelogd. De app blijft lokaal werken." },
                                onFailure = { it.localizedMessage ?: "Uitloggen is niet gelukt." }
                            )
                        }
                    }
                )
                return@Column
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SettingsChoiceChip(
                    label = "Inloggen",
                    selected = accountMode == "login",
                    onClick = {
                        accountMode = "login"
                        message = "Log in met je bestaande account."
                    },
                    modifier = Modifier.weight(1f)
                )
                SettingsChoiceChip(
                    label = "Account maken",
                    selected = accountMode == "signup",
                    onClick = {
                        accountMode = "signup"
                        message = "Maak een account aan. Je ontvangt daarna een verificatie-mail."
                    },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Button(
                onClick = {
                    if (requireSupabase()) {
                        busy = true
                        scope.launch {
                            val result = runCatching { SupabaseService.signInWithGoogle() }
                            busy = false
                            message = result.fold(
                                onSuccess = { "Google-login is geopend via Supabase." },
                                onFailure = { it.localizedMessage ?: "Google-login is niet gelukt." }
                            )
                            currentUserEmail = runCatching { SupabaseService.currentUserEmail() }.getOrNull()
                        }
                    }
                },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth().height(42.dp),
                shape = RoundedCornerShape(AppShape.control),
                colors = ButtonDefaults.buttonColors(containerColor = Gold)
            ) {
                Icon(Icons.Default.AccountCircle, contentDescription = null, tint = DarkNavy, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Inloggen met Google", color = DarkNavy, fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(12.dp))
            Text("E-mail", fontSize = 11.sp, color = MutedGold, modifier = Modifier.padding(bottom = 6.dp))
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                singleLine = true,
                placeholder = { Text("naam@email.nl") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(AppShape.control),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Gold,
                    unfocusedBorderColor = BorderNavy,
                    focusedContainerColor = DeepNavy,
                    unfocusedContainerColor = DeepNavy,
                    cursorColor = Gold
                )
            )

            Spacer(modifier = Modifier.height(8.dp))
            Text("Wachtwoord", fontSize = 11.sp, color = MutedGold, modifier = Modifier.padding(bottom = 6.dp))
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                placeholder = { Text("Wachtwoord") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(AppShape.control),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Gold,
                    unfocusedBorderColor = BorderNavy,
                    focusedContainerColor = DeepNavy,
                    unfocusedContainerColor = DeepNavy,
                    cursorColor = Gold
                )
            )

            if (accountMode == "signup") {
                Spacer(modifier = Modifier.height(8.dp))
                Text("Wachtwoord herhalen", fontSize = 11.sp, color = MutedGold, modifier = Modifier.padding(bottom = 6.dp))
                OutlinedTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    placeholder = { Text("Herhaal wachtwoord") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(AppShape.control),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Gold,
                        unfocusedBorderColor = BorderNavy,
                        focusedContainerColor = DeepNavy,
                        unfocusedContainerColor = DeepNavy,
                        cursorColor = Gold
                    )
                )
            }

            Spacer(modifier = Modifier.height(10.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (accountMode == "login") {
                    Button(
                    onClick = {
                        if (validateEmailLogin()) {
                            busy = true
                            scope.launch {
                                val result = runCatching { SupabaseService.signIn(email.trim(), password) }
                                busy = false
                                message = result.fold(
                                    onSuccess = { "Je bent ingelogd." },
                                    onFailure = { it.localizedMessage ?: "Inloggen is niet gelukt." }
                                )
                                currentUserEmail = runCatching { SupabaseService.currentUserEmail() }.getOrNull()
                            }
                        }
                    },
                    enabled = !busy,
                    modifier = Modifier.weight(1f).height(38.dp),
                    shape = RoundedCornerShape(AppShape.control),
                    colors = ButtonDefaults.buttonColors(containerColor = Gold)
                ) {
                    Text("Inloggen", color = DarkNavy, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                } else {
                    Button(
                    onClick = {
                        if (validateSignup()) {
                            busy = true
                            scope.launch {
                                val result = runCatching { SupabaseService.signUp(email.trim(), password) }
                                busy = false
                                message = result.fold(
                                    onSuccess = { "Verificatie-mail verstuurd. Bevestig je e-mail en log daarna in." },
                                    onFailure = { it.localizedMessage ?: "Account aanmaken is niet gelukt." }
                                )
                                currentUserEmail = runCatching { SupabaseService.currentUserEmail() }.getOrNull()
                            }
                        }
                    },
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth().height(38.dp),
                    shape = RoundedCornerShape(AppShape.control),
                    colors = ButtonDefaults.buttonColors(containerColor = Gold)
                ) {
                    Text("Account maken", color = DarkNavy, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                }
            }

            currentUserEmail?.let { userEmail ->
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    "Ingelogd als $userEmail",
                    fontSize = 12.sp,
                    color = GoldLight,
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center
                )
                TextButton(
                    onClick = {
                        busy = true
                        scope.launch {
                            val result = runCatching { SupabaseService.signOut() }
                            busy = false
                            currentUserEmail = null
                            message = result.fold(
                                onSuccess = { "Je bent uitgelogd. De app blijft lokaal werken." },
                                onFailure = { it.localizedMessage ?: "Uitloggen is niet gelukt." }
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Uitloggen", color = GoldLight, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            TextButton(
                onClick = { message = "Je gebruikt de app zonder account. Alles blijft lokaal opgeslagen." },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Doorgaan zonder account", color = MutedGold, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun AccountProfilePanel(
    email: String,
    profileName: String,
    profileNameInput: String,
    profileAvatarUrl: String?,
    onProfileNameChange: (String) -> Unit,
    onPickAvatar: () -> Unit,
    busy: Boolean,
    onSaveProfileName: () -> Unit,
    onSignOut: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.control))
            .background(PeriodItemSurface)
            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
            .padding(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(CircleShape)
                .background(StrongGoldSurface)
                .border(1.dp, Gold.copy(alpha = 0.55f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            if (!profileAvatarUrl.isNullOrBlank()) {
                AsyncImage(
                    model = profileAvatarUrl,
                    contentDescription = "Profielfoto",
                    modifier = Modifier.fillMaxSize().clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
            } else {
                Text(
                    emailAvatarInitial(email),
                    fontSize = 22.sp,
                    color = GoldLight,
                    fontWeight = FontWeight.Bold
                )
            }
        }
        OutlinedButton(
            onClick = onPickAvatar,
            enabled = !busy,
            modifier = Modifier.height(34.dp),
            shape = RoundedCornerShape(AppShape.control),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight),
            border = BorderStroke(1.dp, BorderNavy)
        ) {
            Icon(Icons.Default.PhotoCamera, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text("Profielfoto kiezen", fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
        Text(profileName.ifBlank { "Je bent ingelogd" }, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = GoldLight)
        Text(email, fontSize = 12.sp, color = MutedGold, textAlign = TextAlign.Center)
        Text(
            "Groepen en online functies zijn actief.",
            fontSize = 11.sp,
            color = DimGold,
            textAlign = TextAlign.Center
        )
        OutlinedTextField(
            value = profileNameInput,
            onValueChange = onProfileNameChange,
            singleLine = true,
            placeholder = { Text("Profielnaam") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(AppShape.control),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Gold,
                unfocusedBorderColor = BorderNavy,
                focusedContainerColor = DeepNavy,
                unfocusedContainerColor = DeepNavy,
                cursorColor = Gold
            )
        )
        Button(
            onClick = onSaveProfileName,
            enabled = !busy,
            modifier = Modifier.fillMaxWidth().height(38.dp),
            shape = RoundedCornerShape(AppShape.control),
            colors = ButtonDefaults.buttonColors(containerColor = Gold)
        ) {
            Text(if (busy) "Opslaan..." else "Profielnaam opslaan", color = DarkNavy, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
        TextButton(
            onClick = onSignOut,
            enabled = !busy,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (busy) "Uitloggen..." else "Uitloggen", color = GoldLight, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun MediaSettingsPage(
    reciterOptions: List<SurahAudioOption>,
    selectedReciterName: String,
    selectedFilter: String,
    onFilterChange: (String) -> Unit,
    onSelectedReciterNameChange: (String) -> Unit,
    onBack: () -> Unit
) {
    val filters = remember(reciterOptions) {
        listOf("Alles") + reciterOptions
            .map { rewayaFilterLabel(it.rewayaName) }
            .distinct()
            .sorted()
    }
    val filteredReciters = remember(reciterOptions, selectedFilter) {
        if (selectedFilter == "Alles") {
            reciterOptions
        } else {
            reciterOptions.filter { rewayaFilterLabel(it.rewayaName) == selectedFilter }
        }
    }

    SettingsCard {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(SettingsMenuStyle.rowHeight),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ChevronLeft, contentDescription = "Terug", tint = ChevronNavy)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(horizontalAlignment = Alignment.End) {
                    Text("Media", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    Text("Reciteurs en riwayah", fontSize = 11.sp, color = MutedGold)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Icon(
                    Icons.Default.PlayArrow,
                    contentDescription = null,
                    tint = DoneGreen,
                    modifier = Modifier.size(SettingsMenuStyle.iconSize)
                )
            }
        }
        SettingsDivider()

        Column(modifier = Modifier.padding(SettingsMenuStyle.innerPadding)) {
            Text("Filter", fontSize = 12.sp, color = MutedGold, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            filters.chunked(3).forEach { rowFilters ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    rowFilters.forEach { filter ->
                        SettingsChoiceChip(
                            label = filter,
                            selected = selectedFilter == filter,
                            onClick = { onFilterChange(filter) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                    repeat(3 - rowFilters.size) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
            }
        }

        SettingsDivider()

        if (filteredReciters.isEmpty()) {
            Text(
                "Geen reciteurs gevonden.",
                fontSize = 12.sp,
                color = MutedGold,
                modifier = Modifier.padding(SettingsMenuStyle.innerPadding)
            )
        } else {
            filteredReciters.forEachIndexed { index, option ->
                SettingsReciterRow(
                    option = option,
                    selected = selectedReciterName == option.reciterName ||
                        (selectedReciterName.isBlank() && index == 0 && selectedFilter == "Alles"),
                    onClick = { onSelectedReciterNameChange(option.reciterName) }
                )
            }
        }
    }
}

@Composable
private fun SettingsHeader(onClose: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(SettingsMenuStyle.rowHeight),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onClose) {
            Icon(Icons.Default.ChevronLeft, contentDescription = "Sluiten", tint = ChevronNavy)
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Instellingen", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = GoldLight)
            Spacer(modifier = Modifier.width(12.dp))
            Icon(
                Icons.Default.Settings,
                contentDescription = null,
                tint = DoneGreen,
                modifier = Modifier.size(SettingsMenuStyle.iconSize)
            )
        }
    }
}

@Composable
private fun SettingsCard(content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(SettingsMenuStyle.cardRadius))
            .background(PeriodItemSurface)
            .border(1.dp, BorderNavy.copy(alpha = 0.55f), RoundedCornerShape(SettingsMenuStyle.cardRadius)),
        content = content
    )
}

@Composable
private fun SettingsGap() {
    Spacer(modifier = Modifier.height(SettingsMenuStyle.sectionGap))
}

@Composable
private fun SettingsDivider() {
    HorizontalDivider(color = BorderNavy.copy(alpha = 0.35f))
}

@Composable
private fun SettingsTextField(
    label: String,
    value: String,
    placeholder: String,
    onValueChange: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, fontSize = 11.sp, color = MutedGold)
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            singleLine = true,
            placeholder = { Text(placeholder) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(AppShape.control),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Gold,
                unfocusedBorderColor = BorderNavy,
                focusedContainerColor = DeepNavy,
                unfocusedContainerColor = DeepNavy,
                cursorColor = Gold
            )
        )
    }
}

@Composable
private fun SettingsActionRow(
    icon: ImageVector,
    title: String,
    subtitle: String? = null,
    onClick: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = SettingsMenuStyle.rowHeight)
            .clickable(enabled = onClick != null) { onClick?.invoke() }
            .padding(horizontal = SettingsMenuStyle.innerPadding, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = DoneGreen, modifier = Modifier.size(SettingsMenuStyle.iconSize))
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
            Text(
                title,
                fontSize = 18.sp,
                color = GoldLight,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.End
            )
            if (subtitle != null) {
                Text(subtitle, fontSize = 11.sp, color = MutedGold, textAlign = TextAlign.End)
            }
        }
        Spacer(modifier = Modifier.width(10.dp))
        Icon(Icons.Default.ChevronLeft, contentDescription = null, tint = ChevronNavy, modifier = Modifier.size(18.dp))
    }
}

@Composable
private fun SettingsSmallNavRow(
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(start = 52.dp, end = SettingsMenuStyle.innerPadding, top = 8.dp, bottom = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
            Text(title, fontSize = 14.sp, color = GoldLight, fontWeight = FontWeight.Bold, textAlign = TextAlign.End)
            Text(subtitle, fontSize = 10.sp, color = MutedGold, textAlign = TextAlign.End)
        }
        Spacer(modifier = Modifier.width(10.dp))
        Icon(Icons.Default.ChevronLeft, contentDescription = null, tint = ChevronNavy, modifier = Modifier.size(16.dp))
    }
}

@Composable
private fun SettingsBookmarkRow(
    bookmark: ReaderBookmarkSummary,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(start = 52.dp, end = SettingsMenuStyle.innerPadding, top = 7.dp, bottom = 7.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
            Text(
                bookmark.title,
                fontSize = 13.sp,
                color = GoldLight,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.End
            )
            Text(bookmark.subtitle, fontSize = 10.sp, color = MutedGold, textAlign = TextAlign.End)
        }
        Spacer(modifier = Modifier.width(10.dp))
        Icon(Icons.Default.Bookmark, contentDescription = null, tint = DoneGreen, modifier = Modifier.size(16.dp))
    }
}

@Composable
private fun SettingsReciterRow(
    option: SurahAudioOption,
    selected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(start = 52.dp, end = SettingsMenuStyle.innerPadding, top = 7.dp, bottom = 7.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
            Text(
                option.reciterName,
                fontSize = 13.sp,
                color = if (selected) DoneGreen else GoldLight,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                textAlign = TextAlign.End
            )
            Text(option.rewayaName, fontSize = 10.sp, color = MutedGold, textAlign = TextAlign.End)
        }
        Spacer(modifier = Modifier.width(10.dp))
        Icon(
            if (selected) Icons.Default.Check else Icons.Default.PlayArrow,
            contentDescription = null,
            tint = if (selected) DoneGreen else ChevronNavy,
            modifier = Modifier.size(16.dp)
        )
    }
}

@Composable
private fun SettingsChoiceChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .height(SettingsMenuStyle.choiceHeight)
            .clip(RoundedCornerShape(AppShape.control))
            .background(if (selected) TodayDoneSurface else DeepNavy)
            .border(
                1.5.dp,
                if (selected) DoneGreen else BorderNavy,
                RoundedCornerShape(AppShape.control)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
            if (selected) {
                Icon(Icons.Default.Check, contentDescription = null, tint = DoneGreen, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
            }
            Text(
                label,
                fontSize = 12.sp,
                color = if (selected) DoneGreen else GoldLight,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun SettingsSwatch(color: Color, selected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(42.dp)
            .clip(CircleShape)
            .background(color)
            .border(2.dp, if (selected) DoneGreen else BorderNavy, CircleShape)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        if (selected) {
            Icon(Icons.Default.Check, contentDescription = null, tint = DoneGreen, modifier = Modifier.size(22.dp))
        }
    }
}

@Composable
fun MenuSwitchRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!checked) }
            .padding(horizontal = SettingsMenuStyle.innerPadding, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = DoneGreen, modifier = Modifier.size(SettingsMenuStyle.iconSize))
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
            Text(title, fontSize = 16.sp, color = GoldLight, fontWeight = FontWeight.Bold, textAlign = TextAlign.End)
            Text(subtitle, fontSize = 11.sp, color = MutedGold, textAlign = TextAlign.End)
        }
        Spacer(modifier = Modifier.width(10.dp))
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = DoneGreen,
                checkedTrackColor = TodayDoneSurface,
                uncheckedThumbColor = DimGold,
                uncheckedTrackColor = DeepNavy,
                uncheckedBorderColor = BorderNavy
            )
        )
    }
}

@Composable
fun MenuItemExpandableRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    expanded: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = SettingsMenuStyle.innerPadding, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = DoneGreen, modifier = Modifier.size(SettingsMenuStyle.iconSize))
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
            Text(title, fontSize = 16.sp, color = GoldLight, fontWeight = FontWeight.Bold, textAlign = TextAlign.End)
            Text(subtitle, fontSize = 11.sp, color = MutedGold, textAlign = TextAlign.End)
        }
        Spacer(modifier = Modifier.width(10.dp))
        Icon(
            imageVector = if (expanded) Icons.Default.KeyboardArrowUp else Icons.Default.ChevronLeft,
            contentDescription = null,
            tint = ChevronNavy,
            modifier = Modifier.size(18.dp)
        )
    }
}

@Composable
fun HifzRangeEditor(
    selectedType: String,
    from: String,
    to: String,
    score: String,
    saved: Boolean,
    onTypeChange: (String) -> Unit,
    onFromChange: (String) -> Unit,
    onToChange: (String) -> Unit,
    onScoreChange: (String) -> Unit,
    onSave: () -> Unit
) {
    val max = hifzRangeMax(selectedType)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = SettingsMenuStyle.innerPadding, vertical = 4.dp)
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            listOf("surah" to "Soera", "hizb" to "Hizb", "juz" to "Juz").forEach { (type, label) ->
                SettingsChoiceChip(
                    label = label,
                    selected = selectedType == type,
                    onClick = { onTypeChange(type) },
                    modifier = Modifier.weight(1f)
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            HifzRangeField(Modifier.weight(1f), "Van", from, max = max, onValueChange = onFromChange)
            HifzRangeField(Modifier.weight(1f), "Tot", to, max = max, onValueChange = onToChange)
            HifzRangeField(Modifier.weight(1f), "Score", score, min = 0, max = 100, onValueChange = onScoreChange)
        }

        Spacer(modifier = Modifier.height(8.dp))

        Button(
            onClick = onSave,
            modifier = Modifier.fillMaxWidth().height(38.dp),
            shape = RoundedCornerShape(AppShape.control),
            colors = ButtonDefaults.buttonColors(containerColor = if (saved) DoneGreen else Gold)
        ) {
            Text(
                if (saved) "Opgeslagen" else "Score toepassen",
                fontSize = 12.sp,
                color = DarkNavy,
                fontWeight = FontWeight.Bold
            )
        }

        Text("Bereik: 1-$max", fontSize = 10.sp, color = MutedGold, modifier = Modifier.padding(top = 4.dp))
        Spacer(modifier = Modifier.height(10.dp))
    }
}

@Composable
fun HifzRangeField(
    modifier: Modifier,
    label: String,
    value: String,
    min: Int = 1,
    max: Int,
    onValueChange: (String) -> Unit
) {
    val current = value.toIntOrNull()?.coerceIn(min, max) ?: min

    Column(modifier = modifier) {
        Text(label, fontSize = 10.sp, color = MutedGold)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(AppShape.smallControl))
                .background(DeepNavy)
                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.smallControl)),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clickable { onValueChange((current - 1).coerceAtLeast(min).toString()) },
                contentAlignment = Alignment.Center
            ) {
                Text("-", fontSize = 12.sp, color = GoldLight)
            }
            Text(
                current.toString(),
                fontSize = 12.sp,
                color = GoldLight,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f),
                textAlign = TextAlign.Center
            )
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clickable { onValueChange((current + 1).coerceAtMost(max).toString()) },
                contentAlignment = Alignment.Center
            ) {
                Text("+", fontSize = 12.sp, color = GoldLight)
            }
        }
    }
}

@Composable
private fun DailyGoalEditor(
    selectedUnit: String,
    targetInput: String,
    reminderHour: Int,
    reminderMinute: Int,
    saved: Boolean,
    unitLabel: (String) -> String,
    onUnitChange: (String) -> Unit,
    onTargetChange: (String) -> Unit,
    onReminderHourChange: (Int) -> Unit,
    onReminderMinuteChange: (Int) -> Unit,
    onSave: () -> Unit
) {
    val targetMax = dailyGoalMaxForUnit(selectedUnit)

    Column(modifier = Modifier.padding(horizontal = SettingsMenuStyle.innerPadding)) {
        Text("Eenheid", fontSize = 11.sp, color = MutedGold, modifier = Modifier.padding(bottom = 6.dp, top = 2.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            listOf("rub" to "Rub", "hizb" to "Hizb", "juz" to "Juz", "pages" to "Pag.", "ayahs" to "Ayahs").forEach { (unit, label) ->
                SettingsChoiceChip(
                    label = label,
                    selected = selectedUnit == unit,
                    onClick = {
                        onUnitChange(unit)
                        val max = dailyGoalMaxForUnit(unit)
                        val safeTarget = (targetInput.toIntOrNull() ?: 1).coerceIn(1, max)
                        onTargetChange(safeTarget.toString())
                    },
                    modifier = Modifier.weight(1f)
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))
        Text("Doel per dag", fontSize = 11.sp, color = MutedGold, modifier = Modifier.padding(bottom = 6.dp))
        EditableStepperRow(
            value = targetInput,
            suffix = unitLabel(selectedUnit),
            min = 1,
            max = targetMax,
            onValueChange = onTargetChange,
            onMinus = {
                val value = targetInput.toIntOrNull() ?: 1
                onTargetChange((value - 1).coerceAtLeast(1).toString())
            },
            onPlus = {
                val value = targetInput.toIntOrNull() ?: 1
                onTargetChange((value + 1).coerceAtMost(targetMax).toString())
            }
        )
        Text("Maximaal: $targetMax ${unitLabel(selectedUnit)}", fontSize = 10.sp, color = DimGold, modifier = Modifier.padding(top = 4.dp))

        Spacer(modifier = Modifier.height(8.dp))
        Text("Herinnering", fontSize = 11.sp, color = MutedGold, modifier = Modifier.padding(bottom = 6.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            StepperRow(
                text = reminderHour.toString().padStart(2, '0'),
                modifier = Modifier.weight(1f),
                onMinus = { if (reminderHour > 0) onReminderHourChange(reminderHour - 1) },
                onPlus = { if (reminderHour < 23) onReminderHourChange(reminderHour + 1) }
            )
            Text(":", fontSize = 18.sp, color = Gold, fontWeight = FontWeight.Bold)
            StepperRow(
                text = reminderMinute.toString().padStart(2, '0'),
                modifier = Modifier.weight(1f),
                onMinus = { onReminderMinuteChange((reminderMinute - 5).coerceAtLeast(0)) },
                onPlus = { onReminderMinuteChange((reminderMinute + 5).coerceAtMost(55)) }
            )
        }

        Spacer(modifier = Modifier.height(10.dp))
        Button(
            onClick = onSave,
            modifier = Modifier.fillMaxWidth().height(38.dp),
            shape = RoundedCornerShape(AppShape.control),
            colors = ButtonDefaults.buttonColors(containerColor = if (saved) DoneGreen else Gold)
        ) {
            Text(if (saved) "Opgeslagen" else "Opslaan", fontSize = 12.sp, color = DarkNavy, fontWeight = FontWeight.Bold)
        }
        Spacer(modifier = Modifier.height(14.dp))
    }
}

@Composable
private fun ReadingJourneyEditor(
    enabled: Boolean,
    days: String,
    autoGoal: Boolean,
    saved: Boolean,
    onEnabledChange: (Boolean) -> Unit,
    onDaysChange: (String) -> Unit,
    onAutoGoalChange: (Boolean) -> Unit,
    onSave: () -> Unit
) {
    val safeDays = (days.toIntOrNull() ?: 30).coerceIn(1, 240)
    val derivedGoal = deriveDailyGoalFromJourney(safeDays)

    Column(modifier = Modifier.padding(horizontal = SettingsMenuStyle.innerPadding, vertical = 4.dp)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(AppShape.control))
                .background(DeepNavy)
                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                .clickable { onEnabledChange(!enabled) }
                .padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
                Text("Hele Quran", fontSize = 13.sp, color = GoldLight, fontWeight = FontWeight.Bold)
                Text(
                    if (enabled) "Leesreis actief" else "Leesreis uit",
                    fontSize = 10.sp,
                    color = MutedGold,
                    textAlign = TextAlign.End
                )
            }
            Spacer(modifier = Modifier.width(10.dp))
            Switch(
                checked = enabled,
                onCheckedChange = onEnabledChange,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = DoneGreen,
                    checkedTrackColor = TodayDoneSurface,
                    uncheckedThumbColor = DimGold,
                    uncheckedTrackColor = DeepNavy,
                    uncheckedBorderColor = BorderNavy
                )
            )
        }

        Spacer(modifier = Modifier.height(10.dp))
        Text("Aantal dagen", fontSize = 11.sp, color = MutedGold, modifier = Modifier.padding(bottom = 6.dp))
        EditableStepperRow(
            value = days,
            suffix = "dagen",
            min = 1,
            max = 240,
            onValueChange = onDaysChange,
            onMinus = {
                val value = days.toIntOrNull() ?: 30
                onDaysChange((value - 1).coerceAtLeast(1).toString())
            },
            onPlus = {
                val value = days.toIntOrNull() ?: 30
                onDaysChange((value + 1).coerceAtMost(240).toString())
            }
        )

        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(AppShape.control))
                .background(PeriodItemSurface)
                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                .clickable { onAutoGoalChange(!autoGoal) }
                .padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
                Text("Dagelijkse doel automatisch koppelen", fontSize = 12.sp, color = GoldLight, fontWeight = FontWeight.Bold)
                Text(
                    "Wordt: ${derivedGoal.second} ${dailyGoalUnitLabel(derivedGoal.first)} per dag",
                    fontSize = 10.sp,
                    color = MutedGold,
                    textAlign = TextAlign.End
                )
            }
            Spacer(modifier = Modifier.width(10.dp))
            Switch(
                checked = autoGoal,
                onCheckedChange = onAutoGoalChange,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = DoneGreen,
                    checkedTrackColor = TodayDoneSurface,
                    uncheckedThumbColor = DimGold,
                    uncheckedTrackColor = DeepNavy,
                    uncheckedBorderColor = BorderNavy
                )
            )
        }

        Spacer(modifier = Modifier.height(10.dp))
        Button(
            onClick = onSave,
            modifier = Modifier.fillMaxWidth().height(38.dp),
            shape = RoundedCornerShape(AppShape.control),
            colors = ButtonDefaults.buttonColors(containerColor = if (saved) DoneGreen else Gold)
        ) {
            Text(
                if (saved) "Leesreis opgeslagen" else "Leesreis opslaan",
                fontSize = 12.sp,
                color = DarkNavy,
                fontWeight = FontWeight.Bold
            )
        }
        Spacer(modifier = Modifier.height(10.dp))
    }
}

@Composable
private fun StepperRow(
    text: String,
    modifier: Modifier = Modifier,
    onMinus: () -> Unit,
    onPlus: () -> Unit
) {
    Row(modifier = modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .clip(RoundedCornerShape(AppShape.control))
                .background(DeepNavy)
                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                .clickable(onClick = onMinus),
            contentAlignment = Alignment.Center
        ) {
            Text("-", fontSize = 16.sp, color = GoldLight)
        }
        Box(
            modifier = Modifier
                .weight(1f)
                .clip(RoundedCornerShape(AppShape.control))
                .background(DeepNavy)
                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                .padding(vertical = 7.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(text, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = GoldLight, textAlign = TextAlign.Center)
        }
        Box(
            modifier = Modifier
                .size(34.dp)
                .clip(RoundedCornerShape(AppShape.control))
                .background(DeepNavy)
                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                .clickable(onClick = onPlus),
            contentAlignment = Alignment.Center
        ) {
            Text("+", fontSize = 16.sp, color = GoldLight)
        }
    }
}

@Composable
private fun EditableStepperRow(
    value: String,
    suffix: String,
    min: Int,
    max: Int,
    onValueChange: (String) -> Unit,
    onMinus: () -> Unit,
    onPlus: () -> Unit
) {
    var input by remember(value, max) {
        val safeValue = (value.toIntOrNull() ?: min).coerceIn(min, max).toString()
        mutableStateOf(safeValue)
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .clip(RoundedCornerShape(AppShape.control))
                .background(DeepNavy)
                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                .clickable(onClick = onMinus),
            contentAlignment = Alignment.Center
        ) {
            Text("-", fontSize = 16.sp, color = GoldLight)
        }

        OutlinedTextField(
            value = input,
            onValueChange = { raw ->
                val digits = raw.filter { it.isDigit() }.take(max.toString().length)
                input = digits
                digits.toIntOrNull()?.let { number ->
                    onValueChange(number.coerceIn(min, max).toString())
                }
            },
            singleLine = true,
            suffix = {
                Text(suffix, fontSize = 11.sp, color = MutedGold)
            },
            textStyle = LocalTextStyle.current.copy(
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = GoldLight,
                textAlign = TextAlign.Center
            ),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier
                .weight(1f)
                .height(52.dp),
            shape = RoundedCornerShape(AppShape.control),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Gold,
                unfocusedBorderColor = BorderNavy,
                focusedContainerColor = DeepNavy,
                unfocusedContainerColor = DeepNavy,
                cursorColor = Gold
            )
        )

        Box(
            modifier = Modifier
                .size(34.dp)
                .clip(RoundedCornerShape(AppShape.control))
                .background(DeepNavy)
                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                .clickable(onClick = onPlus),
            contentAlignment = Alignment.Center
        ) {
            Text("+", fontSize = 16.sp, color = GoldLight)
        }
    }
}

fun dailyGoalMaxForUnit(unit: String): Int = when (unit) {
    "juz" -> 30
    "hizb" -> 60
    "rub" -> 240
    "pages" -> 604
    "ayahs" -> 6236
    else -> 999
}

fun dailyGoalUnitLabel(unit: String): String = when (unit) {
    "juz" -> "juz"
    "hizb" -> "hizb"
    "rub" -> "rub"
    "pages" -> "pagina's"
    "ayahs" -> "ayahs"
    else -> unit
}

fun todayDateKey(): String =
    SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

fun hifzRangeMax(type: String): Int = when (type) {
    "juz" -> 30
    "hizb" -> 60
    else -> 114
}

fun appLanguageLabel(language: String): String = when (language) {
    "ar" -> "Arabisch geselecteerd"
    "en" -> "Engels geselecteerd"
    "fr" -> "Frans geselecteerd"
    else -> "Nederlands geselecteerd"
}

fun rewayaFilterLabel(rewayaName: String): String {
    val normalized = rewayaName.lowercase()
    return when {
        "hafs" in normalized -> "Hafs"
        "warsh" in normalized -> "Warsh"
        "qalun" in normalized || "they said" in normalized -> "Qalun"
        "shu" in normalized || "shuba" in normalized -> "Shu'bah"
        "duri" in normalized -> "Al-Duri"
        "bazi" in normalized -> "Al-Bazi"
        "qunbil" in normalized -> "Qunbil"
        else -> rewayaName.substringBefore(" on ").substringBefore(" about ").take(16)
    }
}

private fun buildGroupCode(groupName: String): String {
    val letters = groupName
        .filter { it.isLetterOrDigit() }
        .take(3)
        .uppercase()
        .padEnd(3, 'Q')
    val suffix = kotlin.math.abs((groupName + System.currentTimeMillis()).hashCode())
        .toString()
        .takeLast(4)
        .padStart(4, '0')
    return "$letters-$suffix"
}

private fun groupGoalLabel(goal: String): String = when (goal) {
    "day" -> "Doel: meeste gelezen vandaag"
    "week" -> "Doel: meeste gelezen deze week"
    "khatma" -> "Doel: samen een khatma afronden"
    else -> "Doel: samen lezen"
}

private fun emailAvatarInitial(email: String): String =
    email.trim().firstOrNull()?.uppercaseChar()?.toString() ?: "?"

data class ReaderBookmarkSummary(
    val title: String,
    val subtitle: String,
    val surahId: Int,
    val ayahNumber: Int? = null,
    val warshPage: Int? = null
)

fun loadAllReaderBookmarkSummaries(context: Context): List<ReaderBookmarkSummary> {
    val prefs = context.getSharedPreferences("reader_bookmarks", Context.MODE_PRIVATE)
    return prefs.all.flatMap { (key, value) ->
        val values = (value as? Set<*>)?.mapNotNull { it.toString().toIntOrNull() }.orEmpty()
        when {
            key.startsWith("ayah_bookmarks_") -> {
                val surahId = key.removePrefix("ayah_bookmarks_").toIntOrNull()
                values.sorted().mapNotNull { ayah ->
                    surahId?.let {
                        ReaderBookmarkSummary(
                            title = "Soera $it, ayah $ayah",
                            subtitle = "Ayah-bladwijzer",
                            surahId = it,
                            ayahNumber = ayah
                        )
                    }
                }
            }
            key.startsWith("warsh_page_bookmarks_") -> {
                val surahId = key.removePrefix("warsh_page_bookmarks_").toIntOrNull()
                values.sorted().mapNotNull { page ->
                    surahId?.let {
                        ReaderBookmarkSummary(
                            title = "Soera $it, pagina $page",
                            subtitle = "Warsh mushaf-bladwijzer",
                            surahId = it,
                            warshPage = page
                        )
                    }
                }
            }
            else -> emptyList()
        }
    }.sortedWith(compareBy<ReaderBookmarkSummary> { it.subtitle }.thenBy { it.title })
}
