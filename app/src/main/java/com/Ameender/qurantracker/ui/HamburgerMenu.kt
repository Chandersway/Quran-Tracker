package com.Ameender.qurantracker.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Help
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.filled.Reply
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.window.DialogWindowProvider
import androidx.core.view.WindowCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.Ameender.qurantracker.data.SupabaseConfig
import com.Ameender.qurantracker.data.SupabaseService
import com.Ameender.qurantracker.data.GroupMemberPermissions
import com.Ameender.qurantracker.data.AuthenticationState
import com.Ameender.qurantracker.data.ProtectedAuthAccess
import com.Ameender.qurantracker.data.protectedAccess
import com.Ameender.qurantracker.data.ReadingGroupFeedItem
import com.Ameender.qurantracker.data.ReadingGroupCommentItem
import com.Ameender.qurantracker.data.ReadingGroupDetails
import com.Ameender.qurantracker.data.ReadingGroupLeaderboardRow
import com.Ameender.qurantracker.data.ReadingGroupMemberRow
import com.Ameender.qurantracker.data.ReadingGroupInvitationRow
import com.Ameender.qurantracker.data.ReadingGroupJoinRequestRow
import com.Ameender.qurantracker.data.ReadingGroupMediaItem
import com.Ameender.qurantracker.data.ReadingGroupTaskItem
import com.Ameender.qurantracker.data.ReadingGroupEventItem
import com.Ameender.qurantracker.data.ReadingGroupProfile
import com.Ameender.qurantracker.data.ReadingGroupRoleRow
import com.Ameender.qurantracker.data.ProfileAvatarService
import com.Ameender.qurantracker.data.ReadingMetrics
import com.Ameender.qurantracker.data.UserAccount
import com.Ameender.qurantracker.data.getHizbInfo
import com.Ameender.qurantracker.viewmodel.GoalViewModel
import com.Ameender.qurantracker.viewmodel.PlanningViewModel
import com.Ameender.qurantracker.viewmodel.QuranViewModel
import com.Ameender.qurantracker.viewmodel.deriveDailyGoalFromJourney
import coil.compose.AsyncImage
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout

private const val GROUP_TYPE_FREE_READING = "free_reading"
private const val GROUP_TYPE_COMPLETE_TOGETHER = "complete_together"
private const val GROUP_TYPE_DAILY_TILAWAH = "daily_tilawah"
private const val GROUP_TYPE_MEMORIZATION = "memorization"
private const val GROUP_TYPE_MURAJAAH = "murajaah"
private const val GROUP_TYPE_TAFSIR_STUDY = "tafsir_study"
private const val GROUP_TYPE_CUSTOM = "custom"

private const val PROGRESS_UNIT_PAGE = "page"
private const val PROGRESS_UNIT_AYAH = "ayah"
private const val PROGRESS_UNIT_HIZB = "hizb"
private const val PROGRESS_UNIT_JUZ = "juz"
private const val PROGRESS_UNIT_SURAH = "surah"
private const val PROGRESS_UNIT_LESSON = "lesson"
private const val PROGRESS_UNIT_CUSTOM = "custom"

private const val GOAL_PERIOD_NONE = "none"
private const val GOAL_PERIOD_DAILY = "daily"
private const val GOAL_PERIOD_WEEKLY = "weekly"
private const val GOAL_PERIOD_MONTHLY = "monthly"
private const val GOAL_PERIOD_TOTAL = "total"

private const val GROUP_PRIVACY_CODE_ONLY = "code_only"
private const val GROUP_PRIVACY_INVITE_ONLY = "invite_only"
private const val GROUP_PRIVACY_PUBLIC = "public"
private const val GROUP_MEDIA_MAX_BYTES = 10 * 1024 * 1024
private val GROUP_MEDIA_MIME_TYPES = setOf(
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif"
)

private data class SelectorOption(
    val value: String,
    val label: (AppStrings) -> String,
    val icon: ImageVector
)


private data class PendingGroupMediaUpload(
    val bytes: ByteArray,
    val mimeType: String,
    val fileName: String,
    val previewUri: String
)

private data class MembershipAdminSnapshot(
    val members: List<ReadingGroupMemberRow>,
    val roles: List<ReadingGroupRoleRow>,
    val invitations: List<ReadingGroupInvitationRow>,
    val requests: List<ReadingGroupJoinRequestRow>
)

private data class PermissionToggleOption(
    val label: (AppStrings) -> String,
    val isChecked: (GroupMemberPermissions) -> Boolean,
    val update: (GroupMemberPermissions, Boolean) -> GroupMemberPermissions
)

private val GroupTypeOptions = listOf(
    SelectorOption(GROUP_TYPE_FREE_READING, { it.groupType.freeReading }, Icons.AutoMirrored.Filled.MenuBook),
    SelectorOption(GROUP_TYPE_COMPLETE_TOGETHER, { it.groupType.completeTogether }, Icons.Default.Groups),
    SelectorOption(GROUP_TYPE_DAILY_TILAWAH, { it.groupType.dailyTilawah }, Icons.Default.DateRange),
    SelectorOption(GROUP_TYPE_MEMORIZATION, { it.groupType.memorization }, Icons.Default.AutoAwesome),
    SelectorOption(GROUP_TYPE_MURAJAAH, { it.groupType.murajaah }, Icons.Default.Refresh),
    SelectorOption(GROUP_TYPE_TAFSIR_STUDY, { it.groupType.tafsirStudy }, Icons.AutoMirrored.Filled.MenuBook),
    SelectorOption(GROUP_TYPE_CUSTOM, { it.groupType.custom }, Icons.Default.Edit)
)

private val ProgressUnitOptions = listOf(
    SelectorOption(PROGRESS_UNIT_PAGE, { it.groupUnitOption.page }, Icons.AutoMirrored.Filled.MenuBook),
    SelectorOption(PROGRESS_UNIT_AYAH, { it.groupUnitOption.ayah }, Icons.Default.Bookmark),
    SelectorOption(PROGRESS_UNIT_HIZB, { it.groupUnitOption.hizb }, Icons.Default.AutoStories),
    SelectorOption(PROGRESS_UNIT_JUZ, { it.groupUnitOption.juz }, Icons.Default.Book),
    SelectorOption(PROGRESS_UNIT_SURAH, { it.groupUnitOption.surah }, Icons.Default.DateRange),
    SelectorOption(PROGRESS_UNIT_LESSON, { it.groupUnitOption.lesson }, Icons.Default.AutoAwesome),
    SelectorOption(PROGRESS_UNIT_CUSTOM, { it.groupUnitOption.custom }, Icons.Default.Edit)
)

private val GoalPeriodOptions = listOf(
    SelectorOption(GOAL_PERIOD_NONE, { it.groupGoalText.noFixedGoal }, Icons.Default.Block),
    SelectorOption(GOAL_PERIOD_DAILY, { it.groupGoalText.daily }, Icons.Default.DateRange),
    SelectorOption(GOAL_PERIOD_WEEKLY, { it.groupGoalText.weekly }, Icons.Default.ViewWeek),
    SelectorOption(GOAL_PERIOD_MONTHLY, { it.groupGoalText.monthly }, Icons.Default.CalendarMonth),
    SelectorOption(GOAL_PERIOD_TOTAL, { it.groupGoalText.total }, Icons.Default.Flag)
)

private val GroupPrivacyOptions = listOf(
    SelectorOption(GROUP_PRIVACY_CODE_ONLY, { it.groupPrivacyOption.codeOnly }, Icons.Default.Key),
    SelectorOption(GROUP_PRIVACY_INVITE_ONLY, { it.groupPrivacyOption.inviteOnly }, Icons.Default.Lock),
    SelectorOption(GROUP_PRIVACY_PUBLIC, { it.groupPrivacyOption.public }, Icons.Default.Public)
)

private val MemberPermissionOptions = listOf(
    PermissionToggleOption(
        label = { it.groupPermissions.canPostMessages },
        isChecked = { it.canPostMessages },
        update = { permissions, enabled -> permissions.copy(canPostMessages = enabled) }
    ),
    PermissionToggleOption(
        label = { it.groupPermissions.canShareProgress },
        isChecked = { it.canShareProgress },
        update = { permissions, enabled -> permissions.copy(canShareProgress = enabled) }
    ),
    PermissionToggleOption(
        label = { it.groupPermissions.canComment },
        isChecked = { it.canComment },
        update = { permissions, enabled -> permissions.copy(canComment = enabled) }
    ),
    PermissionToggleOption(
        label = { it.groupPermissions.canInviteMembers },
        isChecked = { it.canInviteMembers },
        update = { permissions, enabled -> permissions.copy(canInviteMembers = enabled) }
    )
)

@Composable
@OptIn(ExperimentalLayoutApi::class)
fun HamburgerMenu(
    onReplayIntro: () -> Unit = {},
    isOpen: Boolean,
    onClose: () -> Unit,
    onNavigateToAgenda: () -> Unit,
    onNavigateToSurahs: () -> Unit,
    onNavigateToJuzz: () -> Unit,
    onNavigateToHizb: () -> Unit,
    onNavigateToTafsir: () -> Unit,
    onNavigateToMutashabihat: () -> Unit,
    onNavigateToTranslation: () -> Unit,
    onNavigateToBookReader: () -> Unit,
    onNavigateToNotes: () -> Unit,
    onNavigateToFocus: () -> Unit,
    onNavigateToGroups: () -> Unit,
    onNavigateToReadingPlan: () -> Unit,
    onNavigateToNotifications: () -> Unit,
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
    onSelectedReciterNameChange: (String) -> Unit = {},
    onSelectedReciterNameStartNow: (String) -> Unit = {},
    audioPlayer: GlobalAudioPlayer
) {
    val context = LocalContext.current
    val goal by goalViewModel.dailyGoal.collectAsState()
    val readingJourney by goalViewModel.readingJourney.collectAsState()
    val bookmarkSummaries = remember(isOpen) { loadAllReaderBookmarkSummaries(context) }
    val reciterOptions = remember {
        loadSurahAudioOptions(context, 1).distinctBy { "${it.reciterName}|${it.rewayaName}" }
    }
    val text = AppText.strings(appLanguage)
    val focusText = focusStrings(appLanguage)
    val translationMenuText = remember(appLanguage) { translationMenuStrings(appLanguage) }
    val bookMenuText = remember(appLanguage) { bookMenuStrings(appLanguage) }

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
    var irabOpen by rememberSaveable { mutableStateOf(false) }
    var asbabOpen by rememberSaveable { mutableStateOf(false) }
    if (asbabOpen && isOpen) IrabScreen(text = text, asbab = true, onClose = { asbabOpen = false })
    if (irabOpen && isOpen) IrabScreen(text = text, onClose = { irabOpen = false })
    var mushafPageOpen by remember { mutableStateOf(false) }
    var accountPageOpen by remember { mutableStateOf(false) }
    var mediaFilter by remember(text.mediaAllFilter) { mutableStateOf(text.mediaAllFilter) }
    var hifzRangeOpen by remember { mutableStateOf(false) }
    var hifzRangeType by remember { mutableStateOf("surah") }
    var hifzRangeFrom by remember { mutableStateOf("1") }
    var hifzRangeTo by remember { mutableStateOf("1") }
    var hifzRangeScore by remember { mutableStateOf("50") }
    var hifzRangeSaved by remember { mutableStateOf(false) }
    var accountSummary by remember { mutableStateOf<UserAccount?>(null) }

    LaunchedEffect(isOpen, accountPageOpen) {
        if (isOpen) {
            val loadedAccount = runCatching { SupabaseService.currentUserAccount() }.getOrNull()
            accountSummary = ProfileAvatarService.withCachedAvatar(context, loadedAccount)
        }
    }

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
                            text = text,
                            appLanguage = appLanguage,
                            reciterOptions = reciterOptions,
                            selectedReciterName = selectedReciterName,
                            selectedFilter = mediaFilter,
                            allFilterLabel = text.mediaAllFilter,
                            playbackSpeed = audioPlayer.playbackSpeed,
                            onFilterChange = { mediaFilter = it },
                            onPlaybackSpeedChange = audioPlayer::updatePlaybackSpeed,
                            onSelectedReciterNameChange = onSelectedReciterNameChange,
                            onSelectedReciterNameStartNow = onSelectedReciterNameStartNow,
                            onBack = { mediaPageOpen = false }
                        )
                    } else if (mushafPageOpen) {
                        MushafSettingsPage(
                            selectedMushafId = mushafMode,
                            onSelectedMushafChange = onMushafModeChange,
                            onBack = { mushafPageOpen = false }
                        )
                    } else if (accountPageOpen) {
                        AccountSettingsPage(
                            text = text,
                            onBack = { accountPageOpen = false }
                        )
                    } else {
                    SettingsCard {
                        SettingsHeader(text = text, onClose = onClose)
                        HorizontalDivider(color = BorderNavy.copy(alpha = 0.55f))
                        AccountMenuRow(
                            account = accountSummary,
                            fallbackTitle = accountStrings(text).login,
                            fallbackSubtitle = accountStrings(text).createAccount,
                            strings = accountStrings(text),
                            onClick = { accountPageOpen = true }
                        )
                    }
                    SettingsGap()
                    SettingsCard {
                        SettingsActionRow(
                            icon = Icons.Default.DateRange,
                            title = readingPlanText(appLanguage, "Mijn leesplan"),
                            subtitle = readingPlanText(appLanguage, "Doel, planning en voortgang"),
                            onClick = { onClose(); onNavigateToReadingPlan() }
                        )
                        SettingsActionRow(
                            icon = Icons.Default.Notifications,
                            title = com.Ameender.qurantracker.notifications.notificationText(appLanguage, "title"),
                            subtitle = "",
                            onClick = { onClose(); onNavigateToNotifications() }
                        )
                        SettingsActionRow(
                            icon = Icons.Default.Info,
                            title = text.t("onboarding.replay"),
                            subtitle = "",
                            onClick = { onClose(); onReplayIntro() }
                        )
                    }
                    SettingsGap()
                    SettingsCard {
                        SettingsActionRow(
                            icon = Icons.AutoMirrored.Filled.MenuBook,
                            title = text.mushaf,
                            subtitle = mushafDisplayName(mushafMode),
                            onClick = { mushafPageOpen = true }
                        )
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
                            GoalHubPanel(viewModel = goalViewModel, language = appLanguage, dense = true)
                        }
                    }

                    SettingsGap()

                    SettingsCard {
                        MenuItemExpandableRow(
                            icon = Icons.AutoMirrored.Filled.List,
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
                                text = text,
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
                            }
                        }
                        SettingsDivider()
                        SettingsActionRow(
                            icon = Icons.Default.CalendarMonth,
                            title = text.agenda,
                            subtitle = text.viewPlanning,
                            onClick = {
                                onClose()
                                onNavigateToAgenda()
                            }
                        )
                        SettingsDivider()
                        SettingsActionRow(
                            icon = Icons.AutoMirrored.Filled.MenuBook,
                            title = text.t("navigation.tafsir"),
                            subtitle = text.t("menu.tafsir.subtitle"),
                            onClick = {
                                onClose()
                                onNavigateToTafsir()
                            }
                        )
                        SettingsDivider()
                        SettingsActionRow(
                            icon = Icons.Default.CompareArrows,
                            title = text.t("irab.title"),
                            subtitle = text.t("irab.menuSubtitle"),
                            onClick = { irabOpen = true }
                        )
                        SettingsDivider()
                        SettingsActionRow(
                            icon = Icons.Default.CompareArrows,
                            title = text.t("asbab.title"),
                            subtitle = text.t("asbab.menuSubtitle"),
                            onClick = { asbabOpen = true }
                        )
                        SettingsDivider()
                        SettingsActionRow(
                            icon = Icons.Default.CompareArrows,
                            title = text.t("navigation.mutashabihat"),
                            subtitle = text.t("menu.mutashabihat.subtitle"),
                            onClick = {
                                onClose()
                                onNavigateToMutashabihat()
                            }
                        )
                        SettingsDivider()
                        SettingsActionRow(
                            icon = Icons.Default.EditNote,
                            title = text.t("navigation.notes"),
                            subtitle = text.t("menu.notes.subtitle"),
                            onClick = {
                                onClose()
                                onNavigateToNotes()
                            }
                        )
                        SettingsDivider()
                        SettingsActionRow(
                            icon = Icons.Default.Timer,
                            title = focusText.menuTitle,
                            subtitle = focusText.menuSubtitle,
                            onClick = {
                                onClose()
                                onNavigateToFocus()
                            }
                        )
                        SettingsDivider()
                        SettingsActionRow(
                            icon = Icons.Default.Translate,
                            title = translationMenuText.first,
                            subtitle = translationMenuText.second,
                            onClick = {
                                onClose()
                                onNavigateToTranslation()
                            }
                        )
                        SettingsDivider()
                        SettingsActionRow(
                            icon = Icons.AutoMirrored.Filled.MenuBook,
                            title = bookMenuText.title,
                            subtitle = bookMenuText.subtitle,
                            onClick = {
                                onClose()
                                onNavigateToBookReader()
                            }
                        )
                        SettingsDivider()
                        SettingsActionRow(
                            icon = Icons.Default.PlayArrow,
                            title = text.media,
                            subtitle = if (selectedReciterName.isBlank()) text.defaultReciter else selectedReciterName,
                            onClick = { mediaPageOpen = true }
                        )
                    }

                    SettingsGap()

                    SettingsCard {
                        MenuItemExpandableRow(
                            icon = Icons.Default.Info,
                            title = text.appearance,
                            subtitle = themeModeLabel(themeMode, text),
                            expanded = false,
                            onClick = {}
                        )
                        FlowRow(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = SettingsMenuStyle.innerPadding, vertical = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            SettingsSwatch(AppThemeSwatchColor.light, themeMode == "light") { onThemeModeChange("light") }
                            SettingsSwatch(AppThemeSwatchColor.dark, themeMode == "dark") { onThemeModeChange("dark") }
                            SettingsSwatch(AppThemeSwatchColor.pink, themeMode == "pink") { onThemeModeChange("pink") }
                            SettingsSwatch(AppThemeSwatchColor.mint, themeMode == "mint") { onThemeModeChange("mint") }
                            SettingsSwatch(AppThemeSwatchColor.lavender, themeMode == "lavender") { onThemeModeChange("lavender") }
                            SettingsSwatch(AppThemeSwatchColor.ember, themeMode == "ember") { onThemeModeChange("ember") }
                            SettingsSwatch(AppThemeSwatchColor.inferno, themeMode == "inferno") { onThemeModeChange("inferno") }
                            SettingsSwatch(AppThemeSwatchColor.ocean, themeMode == "ocean") { onThemeModeChange("ocean") }
                            SettingsSwatch(AppThemeSwatchColor.sand, themeMode == "sand") { onThemeModeChange("sand") }
                            SettingsSwatch(AppThemeSwatchColor.matteForest, themeMode == "matte_forest") { onThemeModeChange("matte_forest") }
                            SettingsSwatch(AppThemeSwatchColor.matteCharcoal, themeMode == "matte_charcoal") { onThemeModeChange("matte_charcoal") }
                            SettingsSwatch(AppThemeSwatchColor.matteManuscript, themeMode == "matte_manuscript") { onThemeModeChange("matte_manuscript") }
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
                            listOf("nl" to "NL", "en" to "EN", "ar" to "عربي").forEach { (language, label) ->
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

                    }
                }
            }
        }
    }
}

@Composable
fun GroupsSettingsPage(
    text: AppStrings,
    notificationId: String? = null,
    invitedGroupCode: String? = null,
    invitedGroupToken: String? = null,
    onInviteConsumed: () -> Unit = {},
    onDetailModeChanged: (Boolean) -> Unit = {},
    onBack: () -> Unit
) {
    val authenticationState by SupabaseService.authenticationState.collectAsState()
    when (authenticationState.protectedAccess()) {
        ProtectedAuthAccess.Loading -> GroupsOverviewLoading(text)
        ProtectedAuthAccess.LoginRequired -> {
            Column(
                Modifier
                    .fillMaxSize()
                    .background(DarkNavy)
                    .verticalScroll(rememberScrollState())
                    .padding(12.dp)
            ) {
                AccountSettingsPage(
                    text = text,
                    onBack = onBack,
                    authenticationRequired = true
                )
            }
        }
        ProtectedAuthAccess.Content -> AuthenticatedGroupsSettingsPage(
            text = text,
            notificationId = notificationId,
            authenticatedUserId = (authenticationState as AuthenticationState.Authenticated).userId,
            invitedGroupCode = invitedGroupCode,
            invitedGroupToken = invitedGroupToken,
            onInviteConsumed = onInviteConsumed,
            onDetailModeChanged = onDetailModeChanged,
            onBack = onBack
        )
    }
}

@Composable
private fun AuthenticatedGroupsSettingsPage(
    text: AppStrings,
    authenticatedUserId: String,
    notificationId: String? = null,
    invitedGroupCode: String? = null,
    invitedGroupToken: String? = null,
    onInviteConsumed: () -> Unit = {},
    onDetailModeChanged: (Boolean) -> Unit = {},
    onBack: () -> Unit
) {
    var accountRequired by remember { mutableStateOf(false) }
    var loginOpen by remember { mutableStateOf(false) }
    var joinCode by androidx.compose.runtime.saveable.rememberSaveable { mutableStateOf("") }
    if (accountRequired) {
        AlertDialog(
            onDismissRequest = { accountRequired = false },
            title = { Text(text.t("groups.accountRequired.title")) },
            text = { Text(text.t("groups.accountRequired.body")) },
            confirmButton = { TextButton(onClick = { accountRequired = false; loginOpen = true }) {
                Text(text.t("groups.accountRequired.action"))
            } },
            dismissButton = { TextButton(onClick = { accountRequired = false }) { Text(text.cancel) } }
        )
    }
    if (loginOpen) {
        Column(Modifier.fillMaxSize().background(DarkNavy).verticalScroll(rememberScrollState()).padding(12.dp)) {
            AccountSettingsPage(text = text, onBack = { loginOpen = false })
        }
        return
    }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val groupFormPrefs = remember { context.getSharedPreferences("group_goal_settings", Context.MODE_PRIVATE) }
    var groupName by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var goal by remember { mutableStateOf(GROUP_TYPE_FREE_READING) }
    var unit by remember { mutableStateOf("page") }
    var createdGroupName by remember { mutableStateOf("") }
    var groupCode by remember { mutableStateOf("") }
    var groupScreen by remember { mutableStateOf("overview") }
    var groupPage by remember { mutableStateOf("feed") }
    var progressAmount by remember { mutableStateOf("1") }
    var progressUnit by remember { mutableStateOf("page") }
    var progressNumber by remember { mutableStateOf("1") }
    var goalPeriod by remember { mutableStateOf(GOAL_PERIOD_NONE) }
    var goalTarget by remember { mutableStateOf<Int?>(null) }
    var privacy by remember { mutableStateOf(GROUP_PRIVACY_CODE_ONLY) }
    var permissions by remember { mutableStateOf(GroupMemberPermissions()) }
    var chatMessage by remember { mutableStateOf("") }
    var replyDrafts by remember { mutableStateOf<Map<Long, String>>(emptyMap()) }
    var openReplyPostId by remember { mutableStateOf<Long?>(null) }
    var feedItems by remember { mutableStateOf<List<ReadingGroupFeedItem>>(emptyList()) }
    var leaderboard by remember { mutableStateOf<List<ReadingGroupLeaderboardRow>>(emptyList()) }
    var members by remember { mutableStateOf<List<ReadingGroupMemberRow>>(emptyList()) }
    var groupRoles by remember { mutableStateOf<List<ReadingGroupRoleRow>>(emptyList()) }
    var invitations by remember { mutableStateOf<List<ReadingGroupInvitationRow>>(emptyList()) }
    var joinRequests by remember { mutableStateOf<List<ReadingGroupJoinRequestRow>>(emptyList()) }
    var groupMedia by remember { mutableStateOf<List<ReadingGroupMediaItem>>(emptyList()) }
    var mediaLoading by remember { mutableStateOf(false) }
    var pendingMediaUpload by remember { mutableStateOf<PendingGroupMediaUpload?>(null) }
    var mediaCaption by remember { mutableStateOf("") }
    var selectedMedia by remember { mutableStateOf<ReadingGroupMediaItem?>(null) }
    var deletingMedia by remember { mutableStateOf<ReadingGroupMediaItem?>(null) }
    var groupTasks by remember { mutableStateOf<List<ReadingGroupTaskItem>>(emptyList()) }
    var tasksLoading by remember { mutableStateOf(false) }
    var showCreateTaskDialog by remember { mutableStateOf(false) }
    var taskTitle by remember { mutableStateOf("") }
    var taskDescription by remember { mutableStateOf("") }
    var taskType by remember { mutableStateOf("reading") }
    var taskTarget by remember { mutableStateOf("7") }
    var taskUnit by remember { mutableStateOf("page") }
    var taskDurationDays by remember { mutableStateOf<Int?>(7) }
    var taskPoints by remember { mutableStateOf("50") }
    var progressTask by remember { mutableStateOf<ReadingGroupTaskItem?>(null) }
    var taskProgressDraft by remember { mutableStateOf("") }
    var taskStatusChange by remember { mutableStateOf<Pair<ReadingGroupTaskItem, String>?>(null) }
    var groupEvents by remember { mutableStateOf<List<ReadingGroupEventItem>>(emptyList()) }
    var eventsLoading by remember { mutableStateOf(false) }
    var showCreateEventDialog by remember { mutableStateOf(false) }
    var eventTitle by remember { mutableStateOf("") }
    var eventDescription by remember { mutableStateOf("") }
    var eventDate by remember { mutableStateOf(defaultGroupEventDate()) }
    var eventTime by remember { mutableStateOf("19:00") }
    var eventDurationMinutes by remember { mutableIntStateOf(60) }
    var eventLocation by remember { mutableStateOf("") }
    var eventStatusChange by remember { mutableStateOf<Pair<ReadingGroupEventItem, String>?>(null) }
    var myGroupProfile by remember { mutableStateOf<ReadingGroupProfile?>(null) }
    var showGroupProfileDialog by remember { mutableStateOf(false) }
    var groupProfileName by remember { mutableStateOf("") }
    var pendingGroupProfileAvatar by remember { mutableStateOf<PendingGroupMediaUpload?>(null) }
    var resetGroupProfileAvatar by remember { mutableStateOf(false) }
    var groupProfileLoading by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var checkedExistingGroup by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("") }
    fun friendlyGroupError(error: Throwable, fallback: String): String =
        localizedGroupError(error, text, fallback)
    var isGroupOwner by remember { mutableStateOf(false) }
    var activeGroupDetails by remember { mutableStateOf<ReadingGroupDetails?>(null) }
    var availableGroups by remember { mutableStateOf<List<ReadingGroupDetails>>(emptyList()) }
    var editingPost by remember { mutableStateOf<ReadingGroupFeedItem?>(null) }
    var editPostDraft by remember { mutableStateOf("") }
    var deletingPost by remember { mutableStateOf<ReadingGroupFeedItem?>(null) }
    var reportingPost by remember { mutableStateOf<ReadingGroupFeedItem?>(null) }
    var reportReason by remember { mutableStateOf("spam") }
    var reportDetails by remember { mutableStateOf("") }
    var deletingComment by remember { mutableStateOf<Pair<ReadingGroupFeedItem, ReadingGroupCommentItem>?>(null) }
    var commentDeleteError by remember { mutableStateOf("") }
    var managingMember by remember { mutableStateOf<ReadingGroupMemberRow?>(null) }
    var selectedMemberRole by remember { mutableStateOf("member") }
    var removingMember by remember { mutableStateOf<ReadingGroupMemberRow?>(null) }
    var blockRemovedMember by remember { mutableStateOf(false) }
    var showInvitationDialog by remember { mutableStateOf(false) }
    var invitationEmail by remember { mutableStateOf("") }
    var invitationExpiresDays by remember { mutableIntStateOf(7) }
    var createdInvitation by remember { mutableStateOf<ReadingGroupInvitationRow?>(null) }
    var showJoinRequestDialog by remember { mutableStateOf(false) }
    var showIncomingInvitation by rememberSaveable { mutableStateOf(false) }
    var joinRequestCode by remember { mutableStateOf("") }
    var joinRequestMessage by remember { mutableStateOf("") }
    val activeGroupCode = groupCode.trim().uppercase()

    val groupMediaPicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) {
            mediaLoading = true
            scope.launch {
                val result = runCatching {
                    withContext(Dispatchers.IO) {
                        val mimeType = context.contentResolver.getType(uri)?.lowercase() ?: "image/jpeg"
                        if (mimeType !in GROUP_MEDIA_MIME_TYPES) {
                            error(text.t("groups.media.typeError"))
                        }
                        val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                            ?: error(text.t("groups.media.readError"))
                        if (bytes.isEmpty() || bytes.size > GROUP_MEDIA_MAX_BYTES) {
                            error(text.t("groups.media.sizeError"))
                        }
                        PendingGroupMediaUpload(
                            bytes = bytes,
                            mimeType = mimeType,
                            fileName = contentUriDisplayName(context, uri),
                            previewUri = uri.toString()
                        )
                    }
                }
                mediaLoading = false
                result.onSuccess {
                    pendingMediaUpload = it
                    mediaCaption = chatMessage
                }.onFailure {
                    message = it.localizedMessage ?: text.t("groups.media.readError")
                }
            }
        }
    }

    val groupProfilePicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) {
            groupProfileLoading = true
            scope.launch {
                val result = runCatching {
                    withContext(Dispatchers.IO) {
                        val mimeType = context.contentResolver.getType(uri)?.lowercase() ?: "image/jpeg"
                        if (mimeType !in setOf("image/jpeg", "image/png", "image/webp")) {
                            error(text.t("groups.profile.typeError"))
                        }
                        val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                            ?: error(text.t("groups.profile.readError"))
                        if (bytes.isEmpty() || bytes.size > 5 * 1024 * 1024) {
                            error(text.t("groups.profile.sizeError"))
                        }
                        PendingGroupMediaUpload(bytes, mimeType, contentUriDisplayName(context, uri), uri.toString())
                    }
                }
                result.onSuccess {
                    pendingGroupProfileAvatar = it
                    resetGroupProfileAvatar = false
                }.onFailure {
                    message = it.localizedMessage ?: text.t("groups.profile.readError")
                }
                groupProfileLoading = false
            }
        }
    }

    LaunchedEffect(groupScreen) {
        onDetailModeChanged(groupScreen == "home" || groupScreen == "settings")
    }
    DisposableEffect(Unit) {
        onDispose { onDetailModeChanged(false) }
    }

    fun invitationLanguage(): String = context.getSharedPreferences("settings", Context.MODE_PRIVATE)
        .getString("app_language", "nl").orEmpty().takeIf { it in setOf("nl", "en", "ar") } ?: "nl"
    fun groupInviteLink(code: String): String = "https://qurantracker-8f775.web.app/group/${code.trim().uppercase()}?lang=${invitationLanguage()}"
    fun groupAppInviteLink(code: String): String = "qurantracker://group/${code.trim().uppercase()}"

    fun loadStoredGoalConfig(code: String) {
        val key = code.trim().uppercase()
        if (key.isBlank()) return
        val storedPeriod = normalizeGoalPeriod(groupFormPrefs.getString("${key}_period", GOAL_PERIOD_NONE).orEmpty())
        goalPeriod = storedPeriod
        goalTarget = if (storedPeriod == GOAL_PERIOD_NONE) {
            null
        } else {
            groupFormPrefs.getInt("${key}_target", 1).coerceAtLeast(1)
        }
    }

    fun loadStoredPrivacy(code: String) {
        val key = code.trim().uppercase()
        if (key.isBlank()) return
        privacy = normalizeGroupPrivacy(groupFormPrefs.getString("${key}_privacy", GROUP_PRIVACY_CODE_ONLY).orEmpty())
    }

    fun saveStoredGoalConfig(code: String) {
        val key = code.trim().uppercase()
        if (key.isBlank()) return
        groupFormPrefs.edit()
            .putString("${key}_period", normalizeGoalPeriod(goalPeriod))
            .apply {
                val target = goalTarget
                if (target == null || normalizeGoalPeriod(goalPeriod) == GOAL_PERIOD_NONE) {
                    remove("${key}_target")
                } else {
                    putInt("${key}_target", target.coerceAtLeast(1))
                }
            }
            .apply()
    }

    fun saveStoredPrivacy(code: String) {
        val key = code.trim().uppercase()
        if (key.isBlank()) return
        groupFormPrefs.edit()
            .putString("${key}_privacy", normalizeGroupPrivacy(privacy))
            .apply()
    }

    fun validateGroupForm(): String? {
        if (groupName.isBlank()) return text.groupForm.groupNameRequired
        if (goalPeriod == GOAL_PERIOD_NONE) return null
        val target = goalTarget ?: return text.groupGoalText.valueRequired
        return if (target > 0) null else text.groupGoalText.valueMustBePositive
    }

    fun applyGroupDetails(details: ReadingGroupDetails) {
        activeGroupDetails = details
        groupCode = details.code
        createdGroupName = details.name
        groupName = details.name
        description = details.description
        goal = normalizeGroupType(details.goal)
        unit = normalizeProgressUnit(details.unit)
        progressUnit = normalizeProgressUnit(details.unit)
        goalPeriod = normalizeGoalPeriod(details.goalPeriod)
        goalTarget = details.goalTarget
        privacy = normalizeGroupPrivacy(details.privacy)
        permissions = details.memberPermissions
        isGroupOwner = details.isOwner
    }

    suspend fun openGroup(
        summary: ReadingGroupDetails,
        successMessage: String? = null,
        destination: String = "home"
    ) {
        // List responses are summaries; never edit permissions from cached/default values.
        val details = SupabaseService.loadReadingGroup(summary.code)
        val targetCode = details.code.trim().uppercase()
        availableGroups = (availableGroups.filterNot { it.code.equals(targetCode, ignoreCase = true) } + details)
            .sortedWith(
                compareByDescending<ReadingGroupDetails> { it.createdAt }
                    .thenBy { it.name.lowercase() }
            )
        applyGroupDetails(details)
        groupScreen = destination
        groupPage = "feed"
        joinCode = ""
        replyDrafts = emptyMap()
        openReplyPostId = null
        editingPost = null
        deletingPost = null
        reportingPost = null
        deletingComment = null
        managingMember = null
        removingMember = null
        createdInvitation = null
        pendingMediaUpload = null
        selectedMedia = null
        deletingMedia = null
        showCreateTaskDialog = false
        progressTask = null
        taskStatusChange = null
        showCreateEventDialog = false
        eventStatusChange = null
        showGroupProfileDialog = false
        pendingGroupProfileAvatar = null
        leaderboard = runCatching { SupabaseService.loadGroupLeaderboard(targetCode) }.getOrDefault(emptyList())
        feedItems = runCatching { SupabaseService.loadGroupFeed(targetCode) }.getOrDefault(emptyList())
        members = runCatching { SupabaseService.loadGroupMembers(targetCode) }.getOrDefault(emptyList())
        mediaLoading = true
        groupMedia = runCatching { SupabaseService.loadGroupMedia(targetCode) }.getOrDefault(emptyList())
        mediaLoading = false
        tasksLoading = true
        groupTasks = runCatching { SupabaseService.loadGroupTasks(targetCode) }.getOrDefault(emptyList())
        tasksLoading = false
        eventsLoading = true
        groupEvents = runCatching { SupabaseService.loadGroupEvents(targetCode) }.getOrDefault(emptyList())
        eventsLoading = false
        myGroupProfile = runCatching { SupabaseService.loadMyGroupProfile(targetCode) }.getOrNull()
        if (canManageGroupMembership(details.currentRole)) {
            groupRoles = runCatching { SupabaseService.loadGroupRoles(targetCode) }.getOrDefault(emptyList())
            invitations = runCatching { SupabaseService.loadGroupInvitations(targetCode) }.getOrDefault(emptyList())
            joinRequests = runCatching { SupabaseService.loadGroupJoinRequests(targetCode) }.getOrDefault(emptyList())
        } else {
            groupRoles = emptyList()
            invitations = emptyList()
            joinRequests = emptyList()
        }
        checkedExistingGroup = true
        if (successMessage != null) message = successMessage
    }

    fun startCreatingGroup() {
        if (busy) return
        busy = true
        scope.launch {
        try {
        if (!SupabaseService.isAuthenticated()) {
            accountRequired = true
            return@launch
        }
        groupName = ""
        description = ""
        goal = GROUP_TYPE_FREE_READING
        unit = PROGRESS_UNIT_PAGE
        goalPeriod = GOAL_PERIOD_NONE
        goalTarget = null
        privacy = GROUP_PRIVACY_CODE_ONLY
        permissions = GroupMemberPermissions()
        message = ""
        groupScreen = "create"
        } catch (error: Exception) {
            message = friendlyGroupError(error, text.groupCreateText.error)
        } finally {
            busy = false
        }
        }
    }

    fun cancelCreatingGroup() {
        activeGroupDetails?.let(::applyGroupDetails)
        message = ""
        groupScreen = "overview"
    }

    fun openGroup(groupId: String) {
        val cleanCode = groupId.trim().uppercase()
        if (!isValidGroupCode(cleanCode)) {
            message = text.groupOpen.error
            return
        }
        busy = true
        scope.launch {
            try {
                openGroup(SupabaseService.loadReadingGroup(cleanCode))
            } catch (error: Exception) {
                message = friendlyGroupError(error, text.groupOpen.error)
            } finally {
                busy = false
            }
        }
    }

    fun loadGroupMembers(showStatus: Boolean = false) {
        if (activeGroupCode.isBlank()) return
        scope.launch {
            runCatching { SupabaseService.loadGroupMembers(activeGroupCode) }
                .onSuccess {
                    members = it
                    if (showStatus) message = text.t("groups.members.refreshed")
                }
                .onFailure {
                    if (showStatus) message = friendlyGroupError(it, text.t("groups.members.loadError"))
                }
        }
    }

    fun loadGroupMedia(showStatus: Boolean = false) {
        if (activeGroupCode.isBlank()) return
        mediaLoading = true
        scope.launch {
            runCatching { SupabaseService.loadGroupMedia(activeGroupCode) }
                .onSuccess {
                    groupMedia = it
                    if (showStatus) message = text.t("groups.media.refreshed")
                }
                .onFailure {
                    if (showStatus) {
                        message = friendlyGroupError(it, text.t("groups.media.loadError"))
                    }
                }
            mediaLoading = false
        }
    }

    fun loadGroupTasks(showStatus: Boolean = false) {
        if (activeGroupCode.isBlank()) return
        tasksLoading = true
        scope.launch {
            runCatching { SupabaseService.loadGroupTasks(activeGroupCode) }
                .onSuccess {
                    groupTasks = it
                    if (showStatus) message = text.t("groups.tasks.refreshed")
                }
                .onFailure {
                    if (showStatus) message = friendlyGroupError(it, text.t("groups.tasks.loadError"))
                }
            tasksLoading = false
        }
    }

    fun loadGroupEvents(showStatus: Boolean = false) {
        if (activeGroupCode.isBlank()) return
        eventsLoading = true
        scope.launch {
            runCatching { SupabaseService.loadGroupEvents(activeGroupCode) }
                .onSuccess {
                    groupEvents = it
                    if (showStatus) message = text.t("groups.events.refreshed")
                }
                .onFailure {
                    if (showStatus) message = friendlyGroupError(it, text.t("groups.events.loadError"))
                }
            eventsLoading = false
        }
    }

    fun openMyGroupProfile() {
        val profile = myGroupProfile ?: members.firstOrNull { it.isCurrentUser }?.let {
            ReadingGroupProfile(it.userId, it.displayName, it.avatarUrl)
        }
        groupProfileName = profile?.customDisplayName ?: profile?.displayName.orEmpty()
        pendingGroupProfileAvatar = null
        resetGroupProfileAvatar = false
        showGroupProfileDialog = true
    }

    fun saveMyGroupProfile() {
        if (groupProfileName.isNotBlank() && groupProfileName.trim().length !in 2..40) {
            message = text.t("groups.profile.nameError")
            return
        }
        groupProfileLoading = true
        scope.launch {
            runCatching {
                val uploadedAvatar = pendingGroupProfileAvatar?.let {
                    SupabaseService.uploadGroupProfileAvatar(activeGroupCode, it.bytes, it.mimeType)
                }
                SupabaseService.updateMyGroupProfile(
                    code = activeGroupCode,
                    displayName = groupProfileName.trim().takeIf(String::isNotBlank),
                    avatarUrl = when {
                        resetGroupProfileAvatar -> null
                        uploadedAvatar != null -> uploadedAvatar
                        else -> myGroupProfile?.customAvatarUrl
                    }
                )
            }.onSuccess { profile ->
                myGroupProfile = profile
                showGroupProfileDialog = false
                pendingGroupProfileAvatar = null
                message = text.t("groups.profile.saved")
                members = runCatching { SupabaseService.loadGroupMembers(activeGroupCode) }.getOrDefault(members)
                feedItems = runCatching { SupabaseService.loadGroupFeed(activeGroupCode) }.getOrDefault(feedItems)
                leaderboard = runCatching { SupabaseService.loadGroupLeaderboard(activeGroupCode) }.getOrDefault(leaderboard)
            }.onFailure {
                message = friendlyGroupError(it, text.t("groups.profile.saveError"))
            }
            groupProfileLoading = false
        }
    }

    fun uploadPendingGroupMedia() {
        val pending = pendingMediaUpload ?: return
        if (activeGroupCode.isBlank()) return
        mediaLoading = true
        scope.launch {
            runCatching {
                SupabaseService.uploadGroupMedia(
                    code = activeGroupCode,
                    bytes = pending.bytes,
                    mimeType = pending.mimeType,
                    fileName = pending.fileName,
                    caption = mediaCaption
                )
            }.onSuccess { uploaded ->
                groupMedia = (listOf(uploaded) + groupMedia).distinctBy { it.id }
                pendingMediaUpload = null
                mediaCaption = ""
                chatMessage = ""
                message = text.t("groups.media.uploaded")
                feedItems = runCatching { SupabaseService.loadGroupFeed(activeGroupCode) }
                    .getOrDefault(feedItems)
            }.onFailure {
                message = friendlyGroupError(it, text.t("groups.media.uploadError"))
            }
            mediaLoading = false
        }
    }

    fun createGroupTask() {
        val target = taskTarget.toIntOrNull()
        val points = taskPoints.toIntOrNull()
        if (taskTitle.trim().length < 3) {
            message = text.t("groups.tasks.titleError")
            return
        }
        if (target == null || target !in 1..10_000) {
            message = text.t("groups.tasks.targetError")
            return
        }
        if (points == null || points !in 0..1_000) {
            message = text.t("groups.tasks.pointsError")
            return
        }
        tasksLoading = true
        scope.launch {
            runCatching {
                SupabaseService.createGroupTask(
                    code = activeGroupCode,
                    title = taskTitle,
                    description = taskDescription,
                    taskType = taskType,
                    targetValue = target,
                    targetUnit = taskUnit,
                    durationDays = taskDurationDays,
                    pointsReward = points
                )
            }.onSuccess {
                showCreateTaskDialog = false
                taskTitle = ""
                taskDescription = ""
                taskTarget = "7"
                taskPoints = "50"
                message = text.t("groups.tasks.created")
                groupTasks = runCatching { SupabaseService.loadGroupTasks(activeGroupCode) }
                    .getOrDefault(groupTasks)
            }.onFailure {
                message = friendlyGroupError(it, text.t("groups.tasks.createError"))
            }
            tasksLoading = false
        }
    }

    fun updateTaskProgress() {
        val task = progressTask ?: return
        val progress = taskProgressDraft.toIntOrNull()
        if (progress == null || progress !in 0..task.targetValue) {
            message = text.t("groups.tasks.progressError", task.targetValue)
            return
        }
        tasksLoading = true
        scope.launch {
            runCatching { SupabaseService.updateGroupTaskProgress(activeGroupCode, task.id, progress) }
                .onSuccess { awardedPoints ->
                    progressTask = null
                    message = when {
                        awardedPoints > 0 -> text.t("groups.tasks.pointsAwarded", awardedPoints)
                        progress == task.targetValue -> text.t("groups.tasks.completed")
                        else -> text.t("groups.tasks.progressSaved")
                    }
                    groupTasks = runCatching { SupabaseService.loadGroupTasks(activeGroupCode) }
                        .getOrDefault(groupTasks)
                    leaderboard = runCatching { SupabaseService.loadGroupLeaderboard(activeGroupCode) }
                        .getOrDefault(leaderboard)
                }
                .onFailure { message = friendlyGroupError(it, text.t("groups.tasks.progressSaveError")) }
            tasksLoading = false
        }
    }

    fun applyTaskStatusChange() {
        val (task, status) = taskStatusChange ?: return
        tasksLoading = true
        scope.launch {
            runCatching { SupabaseService.updateGroupTaskStatus(activeGroupCode, task.id, status) }
                .onSuccess {
                    taskStatusChange = null
                    message = text.t(
                        when (status) {
                            "completed" -> "groups.tasks.managerCompleted"
                            "cancelled" -> "groups.tasks.cancelled"
                            "deleted" -> "groups.tasks.deleted"
                            else -> "groups.tasks.activated"
                        }
                    )
                    groupTasks = runCatching { SupabaseService.loadGroupTasks(activeGroupCode) }
                        .getOrDefault(groupTasks)
                }
                .onFailure { message = friendlyGroupError(it, text.t("groups.tasks.statusError")) }
            tasksLoading = false
        }
    }

    fun createGroupEvent() {
        if (eventTitle.trim().length < 3) {
            message = text.t("groups.events.titleError")
            return
        }
        val window = parseGroupEventWindow(eventDate, eventTime, eventDurationMinutes)
        if (window == null) {
            message = text.t("groups.events.dateError")
            return
        }
        eventsLoading = true
        scope.launch {
            runCatching {
                SupabaseService.createGroupEvent(
                    code = activeGroupCode,
                    title = eventTitle,
                    description = eventDescription,
                    startsAt = window.first,
                    endsAt = window.second,
                    timezone = TimeZone.getDefault().id,
                    location = eventLocation
                )
            }.onSuccess {
                showCreateEventDialog = false
                message = text.t("groups.events.created")
                groupEvents = runCatching { SupabaseService.loadGroupEvents(activeGroupCode) }
                    .getOrDefault(groupEvents)
            }.onFailure {
                message = friendlyGroupError(it, text.t("groups.events.createError"))
            }
            eventsLoading = false
        }
    }

    fun respondToGroupEvent(event: ReadingGroupEventItem, response: String) {
        eventsLoading = true
        scope.launch {
            runCatching { SupabaseService.respondToGroupEvent(activeGroupCode, event.id, response) }
                .onSuccess {
                    message = text.t("groups.events.responseSaved")
                    groupEvents = runCatching { SupabaseService.loadGroupEvents(activeGroupCode) }
                        .getOrDefault(groupEvents)
                }
                .onFailure { message = friendlyGroupError(it, text.t("groups.events.responseError")) }
            eventsLoading = false
        }
    }

    fun applyEventStatusChange() {
        val (event, status) = eventStatusChange ?: return
        eventsLoading = true
        scope.launch {
            runCatching { SupabaseService.updateGroupEventStatus(activeGroupCode, event.id, status) }
                .onSuccess {
                    eventStatusChange = null
                    message = text.t(if (status == "deleted") "groups.events.deleted" else "groups.events.statusSaved")
                    groupEvents = runCatching { SupabaseService.loadGroupEvents(activeGroupCode) }
                        .getOrDefault(groupEvents)
                }
                .onFailure { message = friendlyGroupError(it, text.t("groups.events.statusError")) }
            eventsLoading = false
        }
    }

    fun confirmDeleteGroupMedia() {
        val target = deletingMedia ?: return
        if (activeGroupCode.isBlank()) return
        mediaLoading = true
        scope.launch {
            runCatching { SupabaseService.deleteGroupMedia(activeGroupCode, target.id) }
                .onSuccess {
                    groupMedia = groupMedia.filterNot { it.id == target.id }
                    if (selectedMedia?.id == target.id) selectedMedia = null
                    deletingMedia = null
                    message = text.t("groups.media.deleted")
                    feedItems = runCatching { SupabaseService.loadGroupFeed(activeGroupCode) }
                        .getOrDefault(feedItems)
                }
                .onFailure {
                    message = friendlyGroupError(it, text.t("groups.media.deleteError"))
                }
            mediaLoading = false
        }
    }

    fun loadMembershipAdminData(showStatus: Boolean = false) {
        val role = activeGroupDetails?.currentRole.orEmpty()
        if (activeGroupCode.isBlank() || !canManageGroupMembership(role)) return
        scope.launch {
            val result = runCatching {
                val loadedMembers = SupabaseService.loadGroupMembers(activeGroupCode)
                val loadedRoles = SupabaseService.loadGroupRoles(activeGroupCode)
                val loadedInvitations = SupabaseService.loadGroupInvitations(activeGroupCode)
                val loadedRequests = SupabaseService.loadGroupJoinRequests(activeGroupCode)
                MembershipAdminSnapshot(loadedMembers, loadedRoles, loadedInvitations, loadedRequests)
            }
            result.onSuccess { snapshot ->
                members = snapshot.members
                groupRoles = snapshot.roles
                invitations = snapshot.invitations
                joinRequests = snapshot.requests
                if (showStatus) message = text.t("groups.members.refreshed")
            }.onFailure {
                if (showStatus) message = friendlyGroupError(it, text.t("groups.members.loadError"))
            }
        }
    }

    fun secureInvitationLinks(invitation: ReadingGroupInvitationRow): Pair<String, String>? {
        val token = invitation.token?.takeIf(String::isNotBlank) ?: return null
        val encodedToken = Uri.encode(token)
        return "https://qurantracker-8f775.web.app/group/$activeGroupCode?invite=$encodedToken&lang=${invitationLanguage()}" to
            "qurantracker://group/$activeGroupCode?invite=$encodedToken"
    }

    fun copySecureInvitation(invitation: ReadingGroupInvitationRow) {
        val links = secureInvitationLinks(invitation) ?: return
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText(text.t("groups.invite.link"), links.first))
        message = text.t("groups.invite.copied")
    }

    fun shareSecureInvitation(invitation: ReadingGroupInvitationRow) {
        val links = secureInvitationLinks(invitation) ?: return
        val shareText = listOf(
            text.t("groups.invite.shareText", createdGroupName.ifBlank { groupName }),
            links.first
        ).joinToString("\n")
        context.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, shareText)
        }, text.t("groups.invite.shareChooser")))
    }

    fun createSecureInvitation() {
        if (activeGroupCode.isBlank()) return
        busy = true
        scope.launch {
            runCatching {
                SupabaseService.createGroupInvitation(
                    code = activeGroupCode,
                    invitedEmail = invitationEmail.trim().takeIf(String::isNotBlank),
                    expiresDays = invitationExpiresDays,
                    maxUses = 10
                )
            }.onSuccess { invitation ->
                createdInvitation = invitation
                invitations = listOf(invitation.copy(token = null)) + invitations
                message = text.t("groups.invite.created")
            }.onFailure { message = friendlyGroupError(it, text.t("groups.invite.createError")) }
            busy = false
        }
    }

    fun revokeInvitation(invitation: ReadingGroupInvitationRow) {
        busy = true
        scope.launch {
            runCatching { SupabaseService.revokeGroupInvitation(activeGroupCode, invitation.id) }
                .onSuccess {
                    invitations = invitations.map { if (it.id == invitation.id) it.copy(status = "revoked") else it }
                    message = text.t("groups.invite.revoked")
                }
                .onFailure { message = friendlyGroupError(it, text.t("groups.invite.revokeError")) }
            busy = false
        }
    }

    fun saveMemberRole() {
        val member = managingMember ?: return
        busy = true
        scope.launch {
            runCatching { SupabaseService.setGroupMemberRole(activeGroupCode, member.userId, selectedMemberRole) }
                .onSuccess {
                    members = SupabaseService.loadGroupMembers(activeGroupCode)
                    managingMember = null
                    message = text.t("groups.members.roleSaved")
                }
                .onFailure { message = friendlyGroupError(it, text.t("groups.members.roleError")) }
            busy = false
        }
    }

    fun confirmRemoveMember() {
        val member = removingMember ?: return
        busy = true
        scope.launch {
            runCatching { SupabaseService.removeGroupMember(activeGroupCode, member.userId, blockRemovedMember) }
                .onSuccess {
                    members = members.filterNot { it.userId == member.userId }
                    removingMember = null
                    message = text.t(if (blockRemovedMember) "groups.members.blocked" else "groups.members.removed")
                }
                .onFailure { message = friendlyGroupError(it, text.t("groups.members.removeError")) }
            busy = false
        }
    }

    fun reviewJoinRequest(request: ReadingGroupJoinRequestRow, approve: Boolean) {
        busy = true
        scope.launch {
            runCatching { SupabaseService.reviewGroupJoinRequest(activeGroupCode, request.id, approve) }
                .onSuccess {
                    joinRequests = joinRequests.map {
                        if (it.id == request.id) it.copy(status = if (approve) "approved" else "rejected") else it
                    }
                    if (approve) members = SupabaseService.loadGroupMembers(activeGroupCode)
                    message = text.t(if (approve) "groups.requests.approved" else "groups.requests.rejected")
                }
                .onFailure { message = friendlyGroupError(it, text.t("groups.requests.reviewError")) }
            busy = false
        }
    }

    fun submitJoinRequest() {
        if (busy) return
        val cleanCode = joinRequestCode
        if (!isValidGroupCode(cleanCode)) {
            message = text.groupJoinText.invalidCode
            return
        }
        busy = true
        scope.launch {
            runCatching { SupabaseService.createGroupJoinRequest(cleanCode, joinRequestMessage) }
                .onSuccess {
                    showJoinRequestDialog = false
                    joinRequestMessage = ""
                    message = text.t("groups.requests.sent")
                    if (invitedGroupCode.equals(cleanCode, ignoreCase = true) && invitedGroupToken.isNullOrBlank()) {
                        onInviteConsumed()
                    }
                }
                .onFailure { message = friendlyGroupError(it, text.t("groups.requests.sendError")) }
            busy = false
        }
    }

    fun shareActiveGroupCode() {
        if (activeGroupCode.isBlank()) {
            message = text.groupSelectFirst
            return
        }
        val shareText = listOf(
            text.groupShareText.format(groupInviteLink(activeGroupCode)),
            text.t("group.shareCodeLine", activeGroupCode)
        ).joinToString(separator = "\n")
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, shareText)
        }
        context.startActivity(Intent.createChooser(shareIntent, text.groupShareChooser))
    }

    fun copyActiveGroupCode() {
        if (activeGroupCode.isBlank()) {
            message = text.groupForm.codeAvailableAfterSave
            return
        }
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText(text.groupForm.groupCode, activeGroupCode))
        message = text.groupForm.codeCopied
    }

    fun handleCreateGroup() {
        validateGroupForm()?.let {
            message = it
            return
        }
        val trimmedName = groupName.trim()
        val targetCode = buildGroupCode(trimmedName)
        message = ""
        busy = true
        scope.launch {
            try {
                if (!SupabaseService.isAuthenticated()) {
                    accountRequired = true
                    return@launch
                }
                val details = withTimeout(12_000L) {
                    SupabaseService.createReadingGroup(
                        name = trimmedName,
                        description = description.trim(),
                        goal = goal,
                        unit = unit,
                        code = targetCode,
                        goalPeriod = normalizeGoalPeriod(goalPeriod),
                        goalTarget = goalTarget,
                        privacy = groupPrivacyBackendValue(privacy),
                        memberPermissions = permissions
                    )
                }
                openGroup(details, text.groupCreateText.success, destination = "overview")
                saveStoredGoalConfig(targetCode)
                saveStoredPrivacy(targetCode)
            } catch (error: Exception) {
                message = friendlyGroupError(error, text.groupCreateText.error)
            } finally {
                busy = false
            }
        }
    }

    fun saveGroupSettings() {
        validateGroupForm()?.let {
            message = it
            return
        }
        if (activeGroupCode.isBlank() || !canManageGroupMembership(activeGroupDetails?.currentRole.orEmpty())) {
            message = text.groupSettingsText.adminOnly
            return
        }
        val trimmedName = groupName.trim()
        val targetCode = activeGroupCode
        busy = true
        scope.launch {
            try {
                val details = SupabaseService.updateReadingGroup(
                    code = targetCode,
                    name = trimmedName,
                    description = description.trim(),
                    goal = goal,
                    unit = unit,
                    goalPeriod = normalizeGoalPeriod(goalPeriod),
                    goalTarget = goalTarget,
                    privacy = groupPrivacyBackendValue(privacy),
                    memberPermissions = permissions
                )
                saveStoredGoalConfig(targetCode)
                saveStoredPrivacy(targetCode)
                openGroup(details, text.groupSettingsText.saved)
            } catch (error: Exception) {
                message = friendlyGroupError(error, text.groupSettingsText.saveError)
            } finally {
                busy = false
            }
        }
    }

    fun deleteActiveGroup() {
        val targetCode = activeGroupCode
        if (targetCode.isBlank() || !isGroupOwner) {
            message = text.groupSettingsText.adminOnly
            return
        }
        busy = true
        scope.launch {
            try {
                SupabaseService.deleteReadingGroup(targetCode)
                val remainingGroups = availableGroups.filterNot {
                    it.code.equals(targetCode, ignoreCase = true)
                }
                availableGroups = remainingGroups
                groupFormPrefs.edit()
                    .remove("${targetCode}_period")
                    .remove("${targetCode}_target")
                    .remove("${targetCode}_privacy")
                    .remove("${targetCode}_can_post_messages")
                    .remove("${targetCode}_can_share_progress")
                    .remove("${targetCode}_can_comment")
                    .remove("${targetCode}_can_invite_members")
                    .apply()

                if (remainingGroups.isNotEmpty()) {
                    openGroup(
                        summary = remainingGroups.first(),
                        successMessage = text.t("groups.delete.success"),
                        destination = "overview"
                    )
                } else {
                    activeGroupDetails = null
                    groupCode = ""
                    createdGroupName = ""
                    groupName = ""
                    description = ""
                    goal = GROUP_TYPE_FREE_READING
                    unit = PROGRESS_UNIT_PAGE
                    goalPeriod = GOAL_PERIOD_NONE
                    goalTarget = null
                    privacy = GROUP_PRIVACY_CODE_ONLY
                    permissions = GroupMemberPermissions()
                    feedItems = emptyList()
                    leaderboard = emptyList()
                    members = emptyList()
                    groupRoles = emptyList()
                    invitations = emptyList()
                    joinRequests = emptyList()
                    replyDrafts = emptyMap()
                    openReplyPostId = null
                    isGroupOwner = false
                    groupPage = "feed"
                    groupScreen = "overview"
                    checkedExistingGroup = true
                    message = text.t("groups.delete.success")
                }
            } catch (error: Exception) {
                message = friendlyGroupError(error, text.t("groups.delete.error"))
            } finally {
                busy = false
            }
        }
    }

    fun loadGroupFeed(showStatus: Boolean = true, showBusy: Boolean = true) {
        if (activeGroupCode.isBlank()) {
            if (showStatus) message = text.groupSelectFirst
            return
        }
        if (showBusy) busy = true
        scope.launch {
            val result = runCatching { SupabaseService.loadGroupFeed(activeGroupCode) }
            if (showBusy) busy = false
            result
                .onSuccess {
                    feedItems = it
                    if (showStatus) {
                        message = if (it.isEmpty()) text.groupNoMessages.format(activeGroupCode) else text.groupFeedUpdated
                    }
                }
                .onFailure {
                    if (showStatus) message = friendlyGroupError(it, text.groupFeedLoadFailed)
                }
        }
    }

    fun shareGroupProgress() {
        if (activeGroupCode.isBlank()) {
            message = text.groupSelectFirst
            return
        }
        val amount = progressAmount.toIntOrNull()
        if (amount == null || amount < 1) {
            message = text.groupValidAmountRequired
            return
        }
        val activeProgressUnit = normalizeProgressUnit(progressUnit)
        val referenceNumber = progressNumber.toIntOrNull() ?: 1
        val progressLabel = groupProgressLabel(activeProgressUnit, referenceNumber, amount)
        val safeAmount = if (activeProgressUnit in listOf("surah", "juz", "hizb")) 1 else amount
        busy = true
        scope.launch {
            val result = runCatching {
                SupabaseService.recordGroupProgress(
                    code = activeGroupCode,
                    unit = activeProgressUnit,
                    amount = safeAmount,
                    source = "group_manual:$activeProgressUnit:$referenceNumber",
                    shareToFeed = true,
                    feedMessage = text.groupReadProgressMessage.format(progressLabel)
                )
            }
            busy = false
            result
                .onSuccess {
                    message = text.groupProgressShared.format(activeGroupCode)
                    loadGroupFeed()
                    runCatching {
                        leaderboard = SupabaseService.loadGroupLeaderboard(activeGroupCode)
                    }
                }
                .onFailure { message = friendlyGroupError(it, text.groupProgressShareFailed) }
        }
    }

    fun sendFeedMessage() {
        if (activeGroupCode.isBlank()) {
            message = text.groupSelectFirst
            return
        }
        if (chatMessage.isBlank()) {
            message = text.groupWriteMessageFirst
            return
        }
        busy = true
        scope.launch {
            val result = runCatching {
                SupabaseService.sendGroupMessage(activeGroupCode, chatMessage)
                }
            busy = false
            result
                .onSuccess { newItem ->
                    feedItems = listOf(newItem) + feedItems
                    chatMessage = ""
                    message = text.groupMessagePosted
                    scope.launch {
                        delay(1200)
                        loadGroupFeed(showStatus = false, showBusy = false)
                    }
                }
                .onFailure { message = friendlyGroupError(it, text.groupFeed.postError) }
        }
    }

    fun reactToFeedPost(item: ReadingGroupFeedItem, reaction: String) {
        if (activeGroupCode.isBlank() || item.serverId.isBlank()) return
        val previousReaction = item.myReaction
        val nextReaction = if (previousReaction == reaction) null else reaction
        fun nextCounts(): Map<String, Int> {
            val counts = item.reactionCounts.toMutableMap()
            previousReaction?.let { old ->
                val next = (counts[old] ?: 0) - 1
                if (next > 0) counts[old] = next else counts.remove(old)
            }
            nextReaction?.let { next -> counts[next] = (counts[next] ?: 0) + 1 }
            return counts
        }
        feedItems = feedItems.map {
            if (it.id == item.id) {
                it.copy(
                    likedByMe = nextReaction == "like",
                    likeCount = nextCounts()["like"] ?: 0,
                    myReaction = nextReaction,
                    reactionCounts = nextCounts()
                )
            } else it
        }
        scope.launch {
            runCatching {
                SupabaseService.toggleGroupPostReaction(activeGroupCode, item.serverId, reaction)
            }.onSuccess { serverReaction ->
                if (serverReaction != nextReaction) loadGroupFeed(showStatus = false, showBusy = false)
            }.onFailure {
                feedItems = feedItems.map { current ->
                    if (current.id == item.id) current.copy(
                        likedByMe = item.likedByMe,
                        likeCount = item.likeCount,
                        myReaction = item.myReaction,
                        reactionCounts = item.reactionCounts
                    ) else current
                }
                message = friendlyGroupError(it, text.groupFeedPostError)
            }
        }
    }

    fun updateFeedPost() {
        val target = editingPost ?: return
        val content = editPostDraft.trim()
        if (content.isBlank()) {
            message = text.t("groups.feed.edit.empty")
            return
        }
        busy = true
        scope.launch {
            runCatching { SupabaseService.updateGroupPost(activeGroupCode, target.serverId, content) }
                .onSuccess { updated ->
                    feedItems = feedItems.map { current ->
                        if (current.id == target.id) current.copy(
                            message = updated.message,
                            editedAt = updated.editedAt
                        ) else current
                    }
                    editingPost = null
                    editPostDraft = ""
                    message = text.t("groups.feed.edit.success")
                }
                .onFailure { message = friendlyGroupError(it, text.t("groups.feed.edit.error")) }
            busy = false
        }
    }

    fun toggleFeedPostPinned(item: ReadingGroupFeedItem) {
        if (activeGroupCode.isBlank() || item.serverId.isBlank()) return
        val nextPinned = !item.isPinned
        feedItems = feedItems.map { if (it.id == item.id) it.copy(isPinned = nextPinned) else it }
        scope.launch {
            runCatching { SupabaseService.setGroupPostPinned(activeGroupCode, item.serverId, nextPinned) }
                .onSuccess {
                    message = text.t(if (nextPinned) "groups.feed.pin.success" else "groups.feed.unpin.success")
                }
                .onFailure {
                    feedItems = feedItems.map { current ->
                        if (current.id == item.id) current.copy(isPinned = item.isPinned) else current
                    }
                    message = friendlyGroupError(it, text.t("groups.feed.pin.error"))
                }
        }
    }

    fun confirmDeleteFeedPost() {
        val target = deletingPost ?: return
        busy = true
        scope.launch {
            runCatching { SupabaseService.deleteGroupPost(activeGroupCode, target.serverId) }
                .onSuccess {
                    feedItems = feedItems.filterNot { it.id == target.id }
                    deletingPost = null
                    message = text.t("groups.feed.delete.success")
                }
                .onFailure { message = friendlyGroupError(it, text.t("groups.feed.delete.error")) }
            busy = false
        }
    }

    fun submitFeedPostReport() {
        val target = reportingPost ?: return
        busy = true
        scope.launch {
            runCatching {
                SupabaseService.reportGroupPost(
                    activeGroupCode,
                    target.serverId,
                    reportReason,
                    reportDetails
                )
            }.onSuccess {
                reportingPost = null
                reportReason = "spam"
                reportDetails = ""
                message = text.t("groups.feed.report.success")
            }.onFailure { message = friendlyGroupError(it, text.t("groups.feed.report.error")) }
            busy = false
        }
    }

    fun confirmDeleteFeedComment() {
        val (post, comment) = deletingComment ?: return
        if (busy) return
        commentDeleteError = ""
        busy = true
        scope.launch {
            runCatching {
                SupabaseService.deleteGroupPostComment(activeGroupCode, post.serverId, comment.serverId)
            }.onSuccess {
                feedItems = feedItems.map { current ->
                    if (current.id == post.id) current.copy(
                        comments = current.comments.filterNot { it.id == comment.id },
                        commentCount = (current.commentCount - 1).coerceAtLeast(0)
                    ) else current
                }
                deletingComment = null
                openReplyPostId = post.id
                message = text.t("groups.feed.comment.delete.success")
            }.onFailure {
                commentDeleteError = friendlyGroupError(it, text.t("groups.feed.comment.delete.error"))
            }
            busy = false
        }
    }

    fun submitFeedComment(item: ReadingGroupFeedItem) {
        if (activeGroupCode.isBlank() || item.serverId.isBlank()) return
        val draft = replyDrafts[item.id].orEmpty().trim()
        if (draft.isBlank()) return
        busy = true
        scope.launch {
            val result = runCatching {
                SupabaseService.addGroupFeedComment(activeGroupCode, item.serverId, draft)
            }
            busy = false
            result
                .onSuccess { comment ->
                    feedItems = feedItems.map { current ->
                        if (current.id == item.id) {
                            current.copy(
                                commentCount = current.commentCount + 1,
                                comments = current.comments + comment
                            )
                        } else current
                    }
                    replyDrafts = replyDrafts - item.id
                    openReplyPostId = null
                    scope.launch {
                        delay(1200)
                        loadGroupFeed(showStatus = false, showBusy = false)
                    }
                }
                .onFailure { message = friendlyGroupError(it, text.groupFeedReplyError) }
        }
    }

    LaunchedEffect(activeGroupCode, groupPage, groupScreen) {
        if (activeGroupCode.isBlank() || groupScreen != "home") return@LaunchedEffect
        while (true) {
            runCatching {
                val refreshed = SupabaseService.loadReadingGroup(activeGroupCode)
                activeGroupDetails = refreshed
                permissions = refreshed.memberPermissions
            }
            delay(10000)
            if (groupPage == "feed") runCatching {
                feedItems = SupabaseService.loadGroupFeed(activeGroupCode)
            }
        }
    }

    fun loadLeaderboard() {
        if (activeGroupCode.isBlank()) {
            message = text.groupSelectFirst
            return
        }
        busy = true
        scope.launch {
            val result = runCatching { SupabaseService.loadGroupLeaderboard(activeGroupCode) }
            busy = false
            result
                .onSuccess {
                    leaderboard = it
                    message = if (it.isEmpty()) text.groupNoProgress.format(activeGroupCode) else text.groupLeaderboardUpdated
                }
                .onFailure { message = friendlyGroupError(it, text.groupLeaderboardLoadFailed) }
        }
    }

    fun joinOnlineGroup(onJoined: () -> Unit = {}) {
        if (busy) return
        if (joinCode.isBlank()) {
            message = text.groupJoinText.invalidCode
            return
        }
        val input = joinCode.trim()
        val link = runCatching { Uri.parse(input) }.getOrNull()
            ?.takeIf { (it.scheme == "https" && it.host == "qurantracker-8f775.web.app" && it.pathSegments.firstOrNull() == "group") ||
                (it.scheme == "qurantracker" && it.host == "group") }
        val token = link?.getQueryParameter("invite")?.takeIf { it.isNotBlank() }
        val cleanCode = (link?.lastPathSegment ?: formatGroupCodeInput(input)).orEmpty().uppercase()
        if (!isValidGroupCode(cleanCode)) {
            message = text.groupJoinText.invalidCode
            return
        }
        busy = true
        scope.launch {
            if (!SupabaseService.isAuthenticated()) {
                busy = false
                accountRequired = true
                return@launch
            }
            val result = runCatching {
                if (token != null) SupabaseService.acceptGroupInvitation(token)
                else SupabaseService.joinReadingGroup(cleanCode)
            }
            busy = false
            result
                .onSuccess { details ->
                    openGroup(details, text.groupJoinText.success.format(cleanCode))
                    onJoined()
                }
                .onFailure {
                    if (requiresGroupAccessRequest(it, token != null)) {
                        joinRequestCode = cleanCode
                        joinRequestMessage = ""
                        message = ""
                        showJoinRequestDialog = true
                    } else {
                        message = friendlyGroupError(it, text.groupJoinText.error)
                    }
                }
        }
    }

    LaunchedEffect(invitedGroupCode, invitedGroupToken) {
        val cleanInvite = invitedGroupCode?.trim()?.takeIf { it.isNotBlank() }
        val secureToken = invitedGroupToken?.trim()?.takeIf { it.isNotBlank() }
        if ((cleanInvite != null || secureToken != null) && !SupabaseService.isAuthenticated()) {
            checkedExistingGroup = true
            accountRequired = true
            return@LaunchedEffect
        }
        if (secureToken != null || cleanInvite != null) {
            joinCode = cleanInvite.orEmpty()
            message = ""
            showIncomingInvitation = true
        }
    }

    LaunchedEffect(notificationId, authenticatedUserId) {
        if (notificationId == null) return@LaunchedEffect
        busy = true
        try {
            val target = SupabaseService.groupPushTarget(notificationId)
                ?: error("GROUP_POST_NOT_FOUND")
            openGroup(SupabaseService.loadReadingGroup(target.groupCode))
            val post = SupabaseService.loadGroupFeed(target.groupCode, target.postId).firstOrNull()
                ?: error("GROUP_POST_NOT_FOUND")
            feedItems = listOf(post) + feedItems.filterNot { it.serverId == post.serverId }
            openReplyPostId = post.id
            SupabaseService.markGroupNotificationRead(target.groupCode, notificationId, true)
        } catch (cancel: kotlinx.coroutines.CancellationException) { throw cancel }
          catch (failure: Exception) { message = friendlyGroupError(failure, text.groupFeedLoadFailed) }
        finally { busy = false; checkedExistingGroup = true }
    }

    LaunchedEffect(authenticatedUserId) {
        if (notificationId != null) return@LaunchedEffect
        if (invitedGroupCode?.isNotBlank() == true || invitedGroupToken?.isNotBlank() == true || activeGroupCode.isNotBlank()) {
            checkedExistingGroup = true
            return@LaunchedEffect
        }
        busy = true
        val result = runCatching { SupabaseService.loadCurrentUserReadingGroups() }
        busy = false
        result
            .onSuccess { groups ->
                availableGroups = groups
                if (groups.isNotEmpty()) {
                    openGroup(groups.first(), destination = "overview")
                } else {
                    checkedExistingGroup = true
                    message = ""
                }
            }
            .onFailure {
                checkedExistingGroup = true
                message = friendlyGroupError(it, text.groupOpen.error)
            }
    }

    GroupCommunityContent(
        text = text,
        activeGroupCode = activeGroupCode,
        availableGroups = availableGroups,
        groupName = createdGroupName.ifBlank { groupName },
        description = description,
        goal = goal,
        unit = unit,
        goalPeriod = goalPeriod,
        goalTarget = goalTarget,
        privacy = privacy,
        groupLanguage = activeGroupDetails?.languageCode ?: "nl",
        currentRole = activeGroupDetails?.currentRole ?: if (isGroupOwner) "owner" else "member",
        permissions = permissions,
        effectivePermissions = activeGroupDetails?.permissions.orEmpty(),
        message = message,
        groupScreen = groupScreen,
        groupPage = groupPage,
        onGroupPageChange = { page ->
            groupPage = page
            if (page == "media") loadGroupMedia()
            if (page == "tasks") loadGroupTasks()
            if (page == "events") loadGroupEvents()
        },
        groupNameInput = groupName,
        onGroupNameChange = { groupName = it },
        descriptionInput = description,
        onDescriptionChange = { description = it },
        onGoalChange = { goal = normalizeGroupType(it) },
        onUnitChange = {
            val nextUnit = normalizeProgressUnit(it)
            unit = nextUnit
            progressUnit = nextUnit
            progressAmount = "1"
            progressNumber = "1"
        },
        onGoalPeriodChange = { period ->
            goalPeriod = normalizeGoalPeriod(period)
            if (goalPeriod == GOAL_PERIOD_NONE) goalTarget = null else if (goalTarget == null) goalTarget = 1
        },
        onGoalTargetChange = { goalTarget = it?.coerceIn(1, 9999) },
        onPrivacyChange = { privacy = normalizeGroupPrivacy(it) },
        onPermissionsChange = { permissions = it },
        joinCode = joinCode,
        onJoinCodeChange = { joinCode = formatGroupCodeInput(it) },
        chatMessage = chatMessage,
        onChatMessageChange = { chatMessage = it.take(500) },
        progressAmount = progressAmount,
        onProgressAmountChange = { progressAmount = it.filter { char -> char.isDigit() }.take(4) },
        progressUnit = progressUnit,
        onProgressUnitChange = { progressUnit = normalizeProgressUnit(it) },
        progressNumber = progressNumber,
        onProgressNumberChange = { progressNumber = it.filter { char -> char.isDigit() }.take(3) },
        feedItems = feedItems,
        replyDrafts = replyDrafts,
        openReplyPostId = openReplyPostId,
        leaderboard = leaderboard,
        members = members,
        groupRoles = groupRoles,
        invitations = invitations,
        joinRequests = joinRequests,
        mediaItems = groupMedia,
        mediaLoading = mediaLoading,
        taskItems = groupTasks,
        tasksLoading = tasksLoading,
        eventItems = groupEvents,
        eventsLoading = eventsLoading,
        myGroupProfile = myGroupProfile,
        busy = busy,
        isCheckingExistingGroup = !checkedExistingGroup && activeGroupCode.isBlank(),
        isGroupOwner = isGroupOwner,
        onBack = onBack,
        onOpenOverview = { groupScreen = "overview" },
        onOpenGroup = { openGroup(it) },
        onStartCreateGroup = { startCreatingGroup() },
        onCancelCreateGroup = { cancelCreatingGroup() },
        onOpenSettings = {
            if (canManageGroupMembership(activeGroupDetails?.currentRole.orEmpty())) {
                groupScreen = "settings"
            } else {
                message = text.groupSettingsText.adminOnly
            }
        },
        onCloseSettings = { groupScreen = "home" },
        onCreateGroup = { handleCreateGroup() },
        onSaveGroupSettings = { saveGroupSettings() },
        onDeleteGroup = { deleteActiveGroup() },
        onJoinGroup = { joinOnlineGroup() },
        onShareGroup = { shareActiveGroupCode() },
        onOpenInviteManager = {
            invitationEmail = ""
            invitationExpiresDays = 7
            createdInvitation = null
            showInvitationDialog = true
            loadMembershipAdminData()
        },
        onManageMember = { member ->
            managingMember = member
            selectedMemberRole = member.role
        },
        onRemoveMember = { member, block ->
            removingMember = member
            blockRemovedMember = block
        },
        onRevokeInvitation = { revokeInvitation(it) },
        onReviewJoinRequest = { request, approve -> reviewJoinRequest(request, approve) },
        onPickMedia = {
            groupMediaPicker.launch(
                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
            )
        },
        onOpenMedia = { selectedMedia = it },
        onDeleteMedia = { deletingMedia = it },
        onRefreshMedia = { loadGroupMedia(showStatus = true) },
        onCreateTask = {
            taskTitle = ""
            taskDescription = ""
            taskType = "reading"
            taskTarget = "7"
            taskUnit = "page"
            taskDurationDays = 7
            taskPoints = "50"
            showCreateTaskDialog = true
        },
        onUpdateTaskProgress = { task ->
            progressTask = task
            taskProgressDraft = task.myProgress.toString()
        },
        onChangeTaskStatus = { task, status -> taskStatusChange = task to status },
        onRefreshTasks = { loadGroupTasks(showStatus = true) },
        onCreateEvent = {
            eventTitle = ""
            eventDescription = ""
            eventDate = defaultGroupEventDate()
            eventTime = "19:00"
            eventDurationMinutes = 60
            eventLocation = ""
            showCreateEventDialog = true
        },
        onRespondEvent = { event, response -> respondToGroupEvent(event, response) },
        onChangeEventStatus = { event, status -> eventStatusChange = event to status },
        onRefreshEvents = { loadGroupEvents(showStatus = true) },
        onEditGroupProfile = { openMyGroupProfile() },
        onRefreshMembers = {
            if (canManageGroupMembership(activeGroupDetails?.currentRole.orEmpty())) {
                loadMembershipAdminData(showStatus = true)
            } else {
                loadGroupMembers(showStatus = true)
            }
        },
        onCopyGroupCode = { copyActiveGroupCode() },
        onSendMessage = { sendFeedMessage() },
        onShareProgress = { shareGroupProgress() },
        onReact = { item, reaction -> reactToFeedPost(item, reaction) },
        onEditPost = { item -> editingPost = item; editPostDraft = item.message },
        onTogglePinPost = { toggleFeedPostPinned(it) },
        onDeletePost = { deletingPost = it },
        onReportPost = { item -> reportingPost = item; reportReason = "spam"; reportDetails = "" },
        onDeleteComment = { post, comment ->
            // ModalBottomSheet and AlertDialog use separate windows. Dismiss the sheet first.
            openReplyPostId = null
            commentDeleteError = ""
            deletingComment = post to comment
        },
        onToggleReply = { item ->
            openReplyPostId = if (openReplyPostId == item.id) null else item.id
        },
        onReplyDraftChange = { postId, value ->
            replyDrafts = replyDrafts + (postId to value.take(400))
        },
        onSubmitReply = { submitFeedComment(it) },
        onRefreshFeed = { loadGroupFeed() },
        onRefreshLeaderboard = { loadLeaderboard() }
    )

    editingPost?.let {
        EditGroupPostDialog(
            text = text,
            value = editPostDraft,
            onValueChange = { value -> editPostDraft = value.take(10_000) },
            busy = busy,
            onDismiss = { if (!busy) editingPost = null },
            onConfirm = { updateFeedPost() }
        )
    }
    deletingPost?.let {
        ConfirmFeedDeleteDialog(
            text = text,
            title = text.t("groups.feed.delete.title"),
            body = text.t("groups.feed.delete.body"),
            busy = busy,
            onDismiss = { if (!busy) deletingPost = null },
            onConfirm = { confirmDeleteFeedPost() }
        )
    }
    reportingPost?.let {
        ReportGroupPostDialog(
            text = text,
            reason = reportReason,
            details = reportDetails,
            onReasonChange = { reportReason = it },
            onDetailsChange = { reportDetails = it.take(2_000) },
            busy = busy,
            onDismiss = { if (!busy) reportingPost = null },
            onConfirm = { submitFeedPostReport() }
        )
    }
    deletingComment?.let { (post, _) ->
        ConfirmFeedDeleteDialog(
            text = text,
            title = text.t("groups.feed.comment.delete.title"),
            body = text.t("groups.feed.comment.delete.body"),
            errorMessage = commentDeleteError,
            busy = busy,
            onDismiss = {
                if (!busy) {
                    deletingComment = null
                    commentDeleteError = ""
                    openReplyPostId = post.id
                }
            },
            onConfirm = { confirmDeleteFeedComment() }
        )
    }
    managingMember?.let { member ->
        val currentRank = groupRoles.firstOrNull {
            it.key == activeGroupDetails?.currentRole
        }?.rank ?: if (isGroupOwner) 100 else 0
        MemberRoleDialog(
            text = text,
            member = member,
            roles = groupRoles.filter { it.key != "owner" && it.rank < currentRank },
            selectedRole = selectedMemberRole,
            onRoleSelected = { selectedMemberRole = it },
            busy = busy,
            onDismiss = { if (!busy) managingMember = null },
            onConfirm = { saveMemberRole() }
        )
    }
    removingMember?.let { member ->
        RemoveGroupMemberDialog(
            text = text,
            member = member,
            block = blockRemovedMember,
            onBlockChange = { blockRemovedMember = it },
            busy = busy,
            onDismiss = { if (!busy) removingMember = null },
            onConfirm = { confirmRemoveMember() }
        )
    }
    if (showInvitationDialog) {
        GroupInvitationManagerDialog(
            text = text,
            email = invitationEmail,
            onEmailChange = { invitationEmail = it.take(160) },
            expiresDays = invitationExpiresDays,
            onExpiresDaysChange = { invitationExpiresDays = it },
            createdInvitation = createdInvitation,
            invitations = invitations,
            busy = busy,
            onCreate = { createSecureInvitation() },
            onCopy = { copySecureInvitation(it) },
            onShare = { shareSecureInvitation(it) },
            onRevoke = { revokeInvitation(it) },
            onDismiss = {
                if (!busy) {
                    showInvitationDialog = false
                    createdInvitation = null
                }
            }
        )
    }
    if (showIncomingInvitation) {
        AlertDialog(
            onDismissRequest = {
                if (!busy) {
                    showIncomingInvitation = false
                    onInviteConsumed()
                }
            },
            title = { Text(text.t("groups.invite.confirmTitle")) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(text.t("groups.invite.confirmBody"))
                    invitedGroupCode?.takeIf { it.isNotBlank() }?.let { Text(it) }
                    if (message.isNotBlank()) Text(message, color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(enabled = !busy, onClick = {
                    showIncomingInvitation = false
                    onInviteConsumed()
                }) { Text(text.t("common.cancel")) }
            },
            confirmButton = {
                TextButton(enabled = !busy, onClick = {
                    val token = invitedGroupToken?.trim()?.takeIf { it.isNotBlank() }
                    if (token == null) {
                        showIncomingInvitation = false
                        joinOnlineGroup(onJoined = onInviteConsumed)
                    } else {
                        busy = true
                        message = ""
                        scope.launch {
                            runCatching { SupabaseService.acceptGroupInvitation(token) }
                                .onSuccess { details ->
                                    showIncomingInvitation = false
                                    openGroup(details, text.t("groups.invite.accepted"))
                                    onInviteConsumed()
                                }
                                .onFailure { message = friendlyGroupError(it, text.t("groups.invite.acceptError")) }
                            busy = false
                        }
                    }
                }) {
                    if (busy) CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                    else Text(text.groupJoinAction)
                }
            }
        )
    }
    if (showJoinRequestDialog) {
        CreateJoinRequestDialog(
            text = text,
            groupCode = joinRequestCode,
            message = joinRequestMessage,
            onMessageChange = { joinRequestMessage = it.take(500) },
            busy = busy,
            onDismiss = { if (!busy) showJoinRequestDialog = false },
            onConfirm = { submitJoinRequest() }
        )
    }
    pendingMediaUpload?.let { pending ->
        UploadGroupMediaDialog(
            text = text,
            pending = pending,
            caption = mediaCaption,
            onCaptionChange = { mediaCaption = it.take(1000) },
            busy = mediaLoading,
            onDismiss = { if (!mediaLoading) pendingMediaUpload = null },
            onConfirm = { uploadPendingGroupMedia() }
        )
    }
    selectedMedia?.let { media ->
        GroupMediaPreviewDialog(
            text = text,
            media = media,
            onDismiss = { selectedMedia = null },
            onDelete = if (media.canDelete) {
                {
                    selectedMedia = null
                    deletingMedia = media
                }
            } else {
                null
            }
        )
    }
    deletingMedia?.let { media ->
        ConfirmFeedDeleteDialog(
            text = text,
            title = text.t("groups.media.deleteTitle"),
            body = text.t("groups.media.deleteBody", media.fileName),
            busy = mediaLoading,
            onDismiss = { if (!mediaLoading) deletingMedia = null },
            onConfirm = { confirmDeleteGroupMedia() }
        )
    }
    if (showCreateTaskDialog) {
        CreateGroupTaskDialog(
            text = text,
            title = taskTitle,
            description = taskDescription,
            type = taskType,
            target = taskTarget,
            unit = taskUnit,
            durationDays = taskDurationDays,
            points = taskPoints,
            busy = tasksLoading,
            onTitleChange = { taskTitle = it.take(120) },
            onDescriptionChange = { taskDescription = it.take(3_000) },
            onTypeChange = { taskType = it },
            onTargetChange = { taskTarget = it.filter(Char::isDigit).take(5) },
            onUnitChange = { taskUnit = normalizeProgressUnit(it) },
            onDurationChange = { taskDurationDays = it },
            onPointsChange = { taskPoints = it.filter(Char::isDigit).take(4) },
            onDismiss = { if (!tasksLoading) showCreateTaskDialog = false },
            onConfirm = { createGroupTask() }
        )
    }
    progressTask?.let { task ->
        GroupTaskProgressDialog(
            text = text,
            task = task,
            value = taskProgressDraft,
            busy = tasksLoading,
            onValueChange = { taskProgressDraft = it.filter(Char::isDigit).take(5) },
            onComplete = { taskProgressDraft = task.targetValue.toString() },
            onDismiss = { if (!tasksLoading) progressTask = null },
            onConfirm = { updateTaskProgress() }
        )
    }
    taskStatusChange?.let { (task, status) ->
        ConfirmGroupTaskStatusDialog(
            text = text,
            task = task,
            status = status,
            busy = tasksLoading,
            onDismiss = { if (!tasksLoading) taskStatusChange = null },
            onConfirm = { applyTaskStatusChange() }
        )
    }
    if (showCreateEventDialog) {
        CreateGroupEventDialog(
            text = text,
            title = eventTitle,
            description = eventDescription,
            date = eventDate,
            time = eventTime,
            durationMinutes = eventDurationMinutes,
            location = eventLocation,
            busy = eventsLoading,
            onTitleChange = { eventTitle = it.take(120) },
            onDescriptionChange = { eventDescription = it.take(3_000) },
            onDateChange = { eventDate = it.take(10) },
            onTimeChange = { eventTime = it.take(5) },
            onDurationChange = { eventDurationMinutes = it },
            onLocationChange = { eventLocation = it.take(180) },
            onDismiss = { if (!eventsLoading) showCreateEventDialog = false },
            onConfirm = { createGroupEvent() }
        )
    }
    eventStatusChange?.let { (event, status) ->
        ConfirmGroupEventStatusDialog(
            text = text,
            event = event,
            status = status,
            busy = eventsLoading,
            onDismiss = { if (!eventsLoading) eventStatusChange = null },
            onConfirm = { applyEventStatusChange() }
        )
    }
    if (showGroupProfileDialog) {
        GroupProfileDialog(
            text = text,
            name = groupProfileName,
            currentAvatarUrl = myGroupProfile?.avatarUrl,
            previewUri = pendingGroupProfileAvatar?.previewUri,
            resetAvatar = resetGroupProfileAvatar,
            busy = groupProfileLoading,
            onNameChange = { groupProfileName = it.take(40) },
            onPickPhoto = {
                groupProfilePicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
            },
            onUseAppProfile = {
                pendingGroupProfileAvatar = null
                resetGroupProfileAvatar = true
                groupProfileName = ""
            },
            onDismiss = { if (!groupProfileLoading) showGroupProfileDialog = false },
            onConfirm = { saveMyGroupProfile() }
        )
    }
}

@Composable
private fun GroupCommunityContent(
    text: AppStrings,
    activeGroupCode: String,
    availableGroups: List<ReadingGroupDetails>,
    groupName: String,
    description: String,
    goal: String,
    unit: String,
    goalPeriod: String,
    goalTarget: Int?,
    privacy: String,
    groupLanguage: String,
    currentRole: String,
    permissions: GroupMemberPermissions,
    effectivePermissions: Set<String>,
    message: String,
    groupScreen: String,
    groupPage: String,
    onGroupPageChange: (String) -> Unit,
    groupNameInput: String,
    onGroupNameChange: (String) -> Unit,
    descriptionInput: String,
    onDescriptionChange: (String) -> Unit,
    onGoalChange: (String) -> Unit,
    onUnitChange: (String) -> Unit,
    onGoalPeriodChange: (String) -> Unit,
    onGoalTargetChange: (Int?) -> Unit,
    onPrivacyChange: (String) -> Unit,
    onPermissionsChange: (GroupMemberPermissions) -> Unit,
    joinCode: String,
    onJoinCodeChange: (String) -> Unit,
    chatMessage: String,
    onChatMessageChange: (String) -> Unit,
    progressAmount: String,
    onProgressAmountChange: (String) -> Unit,
    progressUnit: String,
    onProgressUnitChange: (String) -> Unit,
    progressNumber: String,
    onProgressNumberChange: (String) -> Unit,
    feedItems: List<ReadingGroupFeedItem>,
    replyDrafts: Map<Long, String>,
    openReplyPostId: Long?,
    leaderboard: List<ReadingGroupLeaderboardRow>,
    members: List<ReadingGroupMemberRow>,
    groupRoles: List<ReadingGroupRoleRow>,
    invitations: List<ReadingGroupInvitationRow>,
    joinRequests: List<ReadingGroupJoinRequestRow>,
    mediaItems: List<ReadingGroupMediaItem>,
    mediaLoading: Boolean,
    taskItems: List<ReadingGroupTaskItem>,
    tasksLoading: Boolean,
    eventItems: List<ReadingGroupEventItem>,
    eventsLoading: Boolean,
    myGroupProfile: ReadingGroupProfile?,
    busy: Boolean,
    isCheckingExistingGroup: Boolean,
    isGroupOwner: Boolean,
    onBack: () -> Unit,
    onOpenOverview: () -> Unit,
    onOpenGroup: (String) -> Unit,
    onStartCreateGroup: () -> Unit,
    onCancelCreateGroup: () -> Unit,
    onOpenSettings: () -> Unit,
    onCloseSettings: () -> Unit,
    onCreateGroup: () -> Unit,
    onSaveGroupSettings: () -> Unit,
    onDeleteGroup: () -> Unit,
    onJoinGroup: () -> Unit,
    onShareGroup: () -> Unit,
    onOpenInviteManager: () -> Unit,
    onManageMember: (ReadingGroupMemberRow) -> Unit,
    onRemoveMember: (ReadingGroupMemberRow, Boolean) -> Unit,
    onRevokeInvitation: (ReadingGroupInvitationRow) -> Unit,
    onReviewJoinRequest: (ReadingGroupJoinRequestRow, Boolean) -> Unit,
    onPickMedia: () -> Unit,
    onOpenMedia: (ReadingGroupMediaItem) -> Unit,
    onDeleteMedia: (ReadingGroupMediaItem) -> Unit,
    onRefreshMedia: () -> Unit,
    onCreateTask: () -> Unit,
    onUpdateTaskProgress: (ReadingGroupTaskItem) -> Unit,
    onChangeTaskStatus: (ReadingGroupTaskItem, String) -> Unit,
    onRefreshTasks: () -> Unit,
    onCreateEvent: () -> Unit,
    onRespondEvent: (ReadingGroupEventItem, String) -> Unit,
    onChangeEventStatus: (ReadingGroupEventItem, String) -> Unit,
    onRefreshEvents: () -> Unit,
    onEditGroupProfile: () -> Unit,
    onRefreshMembers: () -> Unit,
    onCopyGroupCode: () -> Unit,
    onSendMessage: () -> Unit,
    onShareProgress: () -> Unit,
    onReact: (ReadingGroupFeedItem, String) -> Unit,
    onEditPost: (ReadingGroupFeedItem) -> Unit,
    onTogglePinPost: (ReadingGroupFeedItem) -> Unit,
    onDeletePost: (ReadingGroupFeedItem) -> Unit,
    onReportPost: (ReadingGroupFeedItem) -> Unit,
    onDeleteComment: (ReadingGroupFeedItem, ReadingGroupCommentItem) -> Unit,
    onToggleReply: (ReadingGroupFeedItem) -> Unit,
    onReplyDraftChange: (Long, String) -> Unit,
    onSubmitReply: (ReadingGroupFeedItem) -> Unit,
    onRefreshFeed: () -> Unit,
    onRefreshLeaderboard: () -> Unit
) {
    val cream = DarkNavy
    val green = Gold
    val softGreen = GoldSurface
    val ink = SoftTextGold
    val muted = MutedGold
    val card = MidNavy
    val line = BorderNavy
    val hasGroup = activeGroupCode.isNotBlank()
    val homeModifier = Modifier
        .fillMaxSize()
        .background(cream)
    val standardModifier = Modifier
        .fillMaxSize()
        .background(cream)
        .verticalScroll(rememberScrollState())
        .padding(horizontal = AppSpacing.screen, vertical = AppSpacing.xl)

    Column(
        modifier = if (groupScreen == "home" && hasGroup) homeModifier else standardModifier,
        verticalArrangement = Arrangement.spacedBy(if (groupScreen == "home") 0.dp else 12.dp)
    ) {
        if (!hasGroup && isCheckingExistingGroup) {
            GroupsOverviewLoading(text)
            return@Column
        }

        if (groupScreen == "overview") {
            GroupsOverviewScreen(
                text = text,
                groups = availableGroups,
                activeGroupCode = activeGroupCode,
                memberCount = members.size,
                statusMessage = message,
                joinCode = joinCode,
                onJoinCodeChange = onJoinCodeChange,
                busy = busy,
                onCreateGroup = onStartCreateGroup,
                onOpenGroup = onOpenGroup,
                onJoinGroup = onJoinGroup
            )
            return@Column
        }

        if (groupScreen == "create") {
            Dialog(
                onDismissRequest = onCancelCreateGroup,
                properties = DialogProperties(
                    dismissOnBackPress = true,
                    dismissOnClickOutside = false,
                    usePlatformDefaultWidth = false,
                    decorFitsSystemWindows = false
                )
            ) {
                GroupDialogSystemBars(background = cream)
                Surface(modifier = Modifier.fillMaxSize(), color = cream) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .windowInsetsPadding(WindowInsets.safeDrawing)
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = AppSpacing.screen, vertical = AppSpacing.xl),
                        verticalArrangement = Arrangement.spacedBy(AppSpacing.xl)
                    ) {
                        GroupCreateWizard(
                            text = text,
                            card = card,
                            ink = ink,
                            muted = muted,
                            green = green,
                            line = line,
                            groupName = groupNameInput,
                            onGroupNameChange = onGroupNameChange,
                            description = descriptionInput,
                            onDescriptionChange = onDescriptionChange,
                            goal = goal,
                            onGoalChange = onGoalChange,
                            unit = unit,
                            onUnitChange = onUnitChange,
                            goalPeriod = goalPeriod,
                            goalTarget = goalTarget,
                            onGoalPeriodChange = onGoalPeriodChange,
                            onGoalTargetChange = onGoalTargetChange,
                            privacy = privacy,
                            onPrivacyChange = onPrivacyChange,
                            groupCode = "",
                            onCopyCode = onCopyGroupCode,
                            onShareGroup = onShareGroup,
                            permissions = permissions,
                            onPermissionsChange = onPermissionsChange,
                            message = message,
                            busy = busy,
                            onCancel = onCancelCreateGroup,
                            onCreateGroup = onCreateGroup
                        )
                    }
                }
            }
            return@Column
        }

        if (message.isNotBlank() && groupScreen != "home") {
            Text(
                message,
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(softGreen)
                    .padding(10.dp),
                fontSize = 11.sp,
                color = green
            )
        }

        if (!hasGroup) {
            LaunchedEffect(Unit) { onOpenOverview() }
            return@Column
        }

        if (groupScreen == "settings") {
            GroupSettingsScreen(
                text = text,
                isAdmin = canManageGroupMembership(currentRole),
                canDelete = isGroupOwner,
                groupName = groupNameInput,
                onGroupNameChange = onGroupNameChange,
                description = descriptionInput,
                onDescriptionChange = onDescriptionChange,
                goal = goal,
                onGoalChange = onGoalChange,
                unit = unit,
                onUnitChange = onUnitChange,
                goalPeriod = goalPeriod,
                goalTarget = goalTarget,
                onGoalPeriodChange = onGoalPeriodChange,
                onGoalTargetChange = onGoalTargetChange,
                privacy = privacy,
                onPrivacyChange = onPrivacyChange,
                groupCode = activeGroupCode,
                onCopyCode = onCopyGroupCode,
                permissions = permissions,
                onPermissionsChange = onPermissionsChange,
                card = card,
                ink = ink,
                muted = muted,
                green = green,
                line = line,
                onShareGroup = onShareGroup,
                busy = busy,
                onBack = onCloseSettings,
                onSubmitGroupForm = onSaveGroupSettings,
                onDeleteGroup = onDeleteGroup
            )
            return@Column
        }

        GroupHomeScreen(
            text = text,
            effectivePermissions = effectivePermissions,
            groupName = groupName.ifBlank { text.groups },
            description = description.ifBlank { text.groupPageSubtitle },
            activeGroupCode = activeGroupCode,
            goal = goal,
            unit = unit,
            goalPeriod = goalPeriod,
            goalTarget = goalTarget,
            privacy = privacy,
            languageCode = groupLanguage,
            currentRole = currentRole,
            memberCount = members.size,
            isOwner = canManageGroupMembership(currentRole),
            selectedTab = groupPage,
            onTabSelected = onGroupPageChange,
            chatMessage = chatMessage,
            onChatMessageChange = onChatMessageChange,
            progressAmount = progressAmount,
            onProgressAmountChange = onProgressAmountChange,
            progressUnit = progressUnit,
            onProgressUnitChange = onProgressUnitChange,
            progressNumber = progressNumber,
            onProgressNumberChange = onProgressNumberChange,
            feedItems = feedItems,
            replyDrafts = replyDrafts,
            openReplyPostId = openReplyPostId,
            leaderboard = leaderboard,
            members = members,
            groupRoles = groupRoles,
            invitations = invitations,
            joinRequests = joinRequests,
            mediaItems = mediaItems,
            mediaLoading = mediaLoading,
            taskItems = taskItems,
            tasksLoading = tasksLoading,
            eventItems = eventItems,
            eventsLoading = eventsLoading,
            myGroupProfile = myGroupProfile,
            busy = busy,
            statusMessage = message,
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line,
            onShareGroup = onShareGroup,
            onOpenInviteManager = onOpenInviteManager,
            onManageMember = onManageMember,
            onRemoveMember = onRemoveMember,
            onRevokeInvitation = onRevokeInvitation,
            onReviewJoinRequest = onReviewJoinRequest,
            onPickMedia = onPickMedia,
            onOpenMedia = onOpenMedia,
            onDeleteMedia = onDeleteMedia,
            onRefreshMedia = onRefreshMedia,
            onCreateTask = onCreateTask,
            onUpdateTaskProgress = onUpdateTaskProgress,
            onChangeTaskStatus = onChangeTaskStatus,
            onRefreshTasks = onRefreshTasks,
            onCreateEvent = onCreateEvent,
            onRespondEvent = onRespondEvent,
            onChangeEventStatus = onChangeEventStatus,
            onRefreshEvents = onRefreshEvents,
            onEditGroupProfile = onEditGroupProfile,
            onRefreshMembers = onRefreshMembers,
            onSendMessage = onSendMessage,
            onShareProgress = onShareProgress,
            onReact = onReact,
            onEditPost = onEditPost,
            onTogglePinPost = onTogglePinPost,
            onDeletePost = onDeletePost,
            onReportPost = onReportPost,
            onDeleteComment = onDeleteComment,
            onToggleReply = onToggleReply,
            onReplyDraftChange = onReplyDraftChange,
            onSubmitReply = onSubmitReply,
            onRefreshFeed = onRefreshFeed,
            onRefreshLeaderboard = onRefreshLeaderboard,
            onBack = onOpenOverview,
            onOpenSettings = onOpenSettings
        )
    }
}

@Composable
private fun GroupDialogSystemBars(background: Color) {
    val view = LocalView.current
    SideEffect {
        val window = (view.parent as? DialogWindowProvider)?.window ?: return@SideEffect
        window.statusBarColor = background.toArgb()
        window.navigationBarColor = background.toArgb()
        WindowCompat.getInsetsController(window, view).apply {
            val useDarkIcons = background.luminance() > 0.5f
            isAppearanceLightStatusBars = useDarkIcons
            isAppearanceLightNavigationBars = useDarkIcons
        }
    }
}

@Composable
@OptIn(ExperimentalLayoutApi::class)
private fun GroupCreateWizard(
    text: AppStrings,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    groupName: String,
    onGroupNameChange: (String) -> Unit,
    description: String,
    onDescriptionChange: (String) -> Unit,
    goal: String,
    onGoalChange: (String) -> Unit,
    unit: String,
    onUnitChange: (String) -> Unit,
    goalPeriod: String,
    goalTarget: Int?,
    onGoalPeriodChange: (String) -> Unit,
    onGoalTargetChange: (Int?) -> Unit,
    privacy: String,
    onPrivacyChange: (String) -> Unit,
    groupCode: String,
    onCopyCode: () -> Unit,
    onShareGroup: () -> Unit,
    permissions: GroupMemberPermissions,
    onPermissionsChange: (GroupMemberPermissions) -> Unit,
    message: String,
    busy: Boolean,
    onCancel: () -> Unit,
    onCreateGroup: () -> Unit
) {
    var currentStep by remember { mutableIntStateOf(0) }
    val stepLabels = listOf(
        text.t("groups.create.step.basics"),
        text.t("groups.create.step.goal"),
        text.t("groups.create.step.access")
    )

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.xl)
    ) {
        GroupFormHeader(
            title = text.groupForm.titleCreate,
            subtitle = text.t("groups.create.stepCount", currentStep + 1, stepLabels.size),
            backLabel = text.groupForm.back,
            ink = ink,
            muted = muted,
            accent = green,
            onBack = {
                if (currentStep == 0) onCancel() else currentStep -= 1
            }
        )

        GroupCreateProgress(
            labels = stepLabels,
            currentStep = currentStep,
            green = green,
            muted = muted,
            line = line
        )

        Text(
            stepLabels[currentStep],
            color = ink,
            fontSize = 17.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text.t("groups.create.step.$currentStep.subtitle"),
            color = muted,
            fontSize = 11.sp,
            lineHeight = 16.sp
        )

        when (currentStep) {
            0 -> {
                GroupDetailsCard(
                    text = text,
                    groupName = groupName,
                    onGroupNameChange = onGroupNameChange,
                    description = description,
                    onDescriptionChange = onDescriptionChange,
                    card = card,
                    ink = ink,
                    muted = muted,
                    green = green,
                    line = line
                )
                FormSectionCard(card = card, line = line) {
                    Text(text.groupForm.groupTypeTitle, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
                    Text(text.groupForm.groupTypeSubtitle, fontSize = 11.sp, color = muted)
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(7.dp),
                        verticalArrangement = Arrangement.spacedBy(7.dp)
                    ) {
                        val selectedGoal = normalizeGroupType(goal)
                        GroupTypeOptions.forEach { option ->
                            GroupWizardChoiceChip(
                                label = option.label(text),
                                icon = option.icon,
                                selected = selectedGoal == option.value,
                                green = green,
                                muted = muted,
                                line = line,
                                onClick = { onGoalChange(option.value) }
                            )
                        }
                    }
                }
            }

            1 -> {
                FormSectionCard(card = card, line = line) {
                    Text(text.groupForm.progressUnitTitle, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
                    Text(text.groupForm.progressUnitSubtitle, fontSize = 11.sp, color = muted)
                    GroupUnitChips(text = text, selected = unit, onSelected = onUnitChange)
                }
                GroupGoalCard(
                    text = text,
                    goalPeriod = goalPeriod,
                    goalTarget = goalTarget,
                    progressUnit = unit,
                    onGoalPeriodChange = onGoalPeriodChange,
                    onGoalTargetChange = onGoalTargetChange,
                    card = card,
                    ink = ink,
                    muted = muted,
                    green = green,
                    line = line
                )
            }

            else -> {
                PrivacyAccessCard(
                    text = text,
                    selectedPrivacy = privacy,
                    onPrivacyChange = onPrivacyChange,
                    groupCode = groupCode,
                    onCopyCode = onCopyCode,
                    onShareGroup = onShareGroup,
                    card = card,
                    ink = ink,
                    muted = muted,
                    green = green,
                    line = line
                )
                MemberPermissionsCard(
                    text = text,
                    permissions = permissions,
                    onPermissionsChange = onPermissionsChange,
                    card = card,
                    ink = ink,
                    muted = muted,
                    green = green,
                    line = line
                )
            }
        }

        if (currentStep == stepLabels.lastIndex && message.isNotBlank()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(AppShape.control))
                    .background(DeleteSurface)
                    .border(1.dp, DeleteRed.copy(alpha = 0.55f), RoundedCornerShape(AppShape.control))
                    .padding(AppSpacing.list),
                horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = DeleteRed, modifier = Modifier.size(18.dp))
                Text(
                    message,
                    modifier = Modifier.weight(1f),
                    color = ink,
                    fontSize = 11.sp,
                    lineHeight = 15.sp
                )
            }
        }

        GroupPrimaryActionButton(
            label = if (currentStep == stepLabels.lastIndex) text.groupForm.createButton else text.t("groups.create.next"),
            loadingLabel = text.groupCreateText.creating,
            busy = busy,
            enabled = currentStep != 0 || groupName.isNotBlank(),
            green = green,
            onClick = {
                if (currentStep == stepLabels.lastIndex) onCreateGroup() else currentStep += 1
            }
        )
    }
}

@Composable
private fun GroupCreateProgress(
    labels: List<String>,
    currentStep: Int,
    green: Color,
    muted: Color,
    line: Color
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            labels.forEachIndexed { index, _ ->
                val completed = index <= currentStep
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(if (completed) green else DeepNavy)
                        .border(1.dp, if (completed) green else line, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    if (index < currentStep) {
                        Icon(Icons.Default.Check, contentDescription = null, tint = DarkNavy, modifier = Modifier.size(15.dp))
                    } else {
                        Text(
                            (index + 1).toString(),
                            color = if (completed) DarkNavy else muted,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                if (index != labels.lastIndex) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(2.dp)
                            .background(if (index < currentStep) green else line)
                    )
                }
            }
        }
        Row(modifier = Modifier.fillMaxWidth()) {
            labels.forEachIndexed { index, label ->
                Text(
                    label,
                    modifier = Modifier.weight(1f),
                    color = if (index == currentStep) green else muted,
                    fontSize = 9.sp,
                    fontWeight = if (index == currentStep) FontWeight.Bold else FontWeight.Medium,
                    textAlign = TextAlign.Center,
                    maxLines = 1
                )
            }
        }
    }
}

@Composable
private fun GroupWizardChoiceChip(
    label: String,
    icon: ImageVector,
    selected: Boolean,
    green: Color,
    muted: Color,
    line: Color,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(AppShape.pill))
            .background(if (selected) GoldSurface else DeepNavy)
            .border(1.dp, if (selected) green else line, RoundedCornerShape(AppShape.pill))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = if (selected) green else muted, modifier = Modifier.size(15.dp))
        Text(
            label,
            color = if (selected) green else muted,
            fontSize = 10.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
        )
    }
}

@Composable
private fun GroupEmptyStateCard(
    text: AppStrings,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    groupName: String,
    onGroupNameChange: (String) -> Unit,
    description: String,
    onDescriptionChange: (String) -> Unit,
    goal: String,
    onGoalChange: (String) -> Unit,
    unit: String,
    onUnitChange: (String) -> Unit,
    goalPeriod: String,
    goalTarget: Int?,
    onGoalPeriodChange: (String) -> Unit,
    onGoalTargetChange: (Int?) -> Unit,
    privacy: String,
    onPrivacyChange: (String) -> Unit,
    groupCode: String,
    onCopyCode: () -> Unit,
    onShareGroup: () -> Unit,
    permissions: GroupMemberPermissions,
    onPermissionsChange: (GroupMemberPermissions) -> Unit,
    busy: Boolean,
    onCreateGroup: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text(text.groupNoGroupTitle, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = ink)
        Text(text.groupNoGroupBody, fontSize = 12.sp, color = muted)
        GroupDetailsCard(
            text = text,
            groupName = groupName,
            onGroupNameChange = onGroupNameChange,
            description = description,
            onDescriptionChange = onDescriptionChange,
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line
        )
        GroupTypeSelector(
            text = text,
            selected = goal,
            onSelected = onGoalChange,
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line
        )
        ProgressUnitSelector(
            text = text,
            selected = unit,
            onSelected = onUnitChange,
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line
        )
        GroupGoalCard(
            text = text,
            goalPeriod = goalPeriod,
            goalTarget = goalTarget,
            progressUnit = unit,
            onGoalPeriodChange = onGoalPeriodChange,
            onGoalTargetChange = onGoalTargetChange,
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line
        )
        PrivacyAccessCard(
            text = text,
            selectedPrivacy = privacy,
            onPrivacyChange = onPrivacyChange,
            groupCode = groupCode,
            onCopyCode = onCopyCode,
            onShareGroup = onShareGroup,
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line
        )
        MemberPermissionsCard(
            text = text,
            permissions = permissions,
            onPermissionsChange = onPermissionsChange,
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line
        )
        FormSectionCard(card = card, line = line) {
            GroupPrimaryActionButton(
                label = text.groupForm.createButton,
                loadingLabel = text.groupCreateText.creating,
                busy = busy,
                green = green,
                onClick = onCreateGroup
            )
        }
    }
}

@Composable
private fun JoinGroupCard(
    text: AppStrings,
    joinCode: String,
    onJoinCodeChange: (String) -> Unit,
    busy: Boolean,
    onJoinGroup: () -> Unit,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color
) {
    val canJoin = isValidGroupCode(joinCode)
    FormSectionCard(card = card, line = line) {
        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(text.groupJoinText.title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
            Text(text.groupJoinText.subtitle, fontSize = 11.sp, color = muted, lineHeight = 15.sp)
        }
        GroupFormTextField(
            label = text.groupJoinText.groupCode,
            value = joinCode,
            placeholder = text.groupJoinText.placeholder,
            onValueChange = onJoinCodeChange,
            green = green,
            muted = muted,
            line = line,
            enabled = !busy,
            singleLine = true
        )
        OutlinedButton(
            onClick = onJoinGroup,
            enabled = !busy && canJoin,
            modifier = Modifier.fillMaxWidth().height(42.dp),
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, if (canJoin) green else line),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = green)
        ) {
            if (busy) {
                CircularProgressIndicator(
                    modifier = Modifier.size(15.dp),
                    strokeWidth = 2.dp,
                    color = green
                )
                Spacer(Modifier.width(8.dp))
            }
            Text(if (busy) text.groupForm.saving else text.groupJoinText.button, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun GroupHomeScreen(
    text: AppStrings,
    effectivePermissions: Set<String>,
    groupName: String,
    description: String,
    activeGroupCode: String,
    goal: String,
    unit: String,
    goalPeriod: String,
    goalTarget: Int?,
    privacy: String,
    languageCode: String,
    currentRole: String,
    memberCount: Int,
    isOwner: Boolean,
    selectedTab: String,
    onTabSelected: (String) -> Unit,
    chatMessage: String,
    onChatMessageChange: (String) -> Unit,
    progressAmount: String,
    onProgressAmountChange: (String) -> Unit,
    progressUnit: String,
    onProgressUnitChange: (String) -> Unit,
    progressNumber: String,
    onProgressNumberChange: (String) -> Unit,
    feedItems: List<ReadingGroupFeedItem>,
    replyDrafts: Map<Long, String>,
    openReplyPostId: Long?,
    leaderboard: List<ReadingGroupLeaderboardRow>,
    members: List<ReadingGroupMemberRow>,
    groupRoles: List<ReadingGroupRoleRow>,
    invitations: List<ReadingGroupInvitationRow>,
    joinRequests: List<ReadingGroupJoinRequestRow>,
    mediaItems: List<ReadingGroupMediaItem>,
    mediaLoading: Boolean,
    taskItems: List<ReadingGroupTaskItem>,
    tasksLoading: Boolean,
    eventItems: List<ReadingGroupEventItem>,
    eventsLoading: Boolean,
    myGroupProfile: ReadingGroupProfile?,
    busy: Boolean,
    statusMessage: String,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    onShareGroup: () -> Unit,
    onOpenInviteManager: () -> Unit,
    onManageMember: (ReadingGroupMemberRow) -> Unit,
    onRemoveMember: (ReadingGroupMemberRow, Boolean) -> Unit,
    onRevokeInvitation: (ReadingGroupInvitationRow) -> Unit,
    onReviewJoinRequest: (ReadingGroupJoinRequestRow, Boolean) -> Unit,
    onPickMedia: () -> Unit,
    onOpenMedia: (ReadingGroupMediaItem) -> Unit,
    onDeleteMedia: (ReadingGroupMediaItem) -> Unit,
    onRefreshMedia: () -> Unit,
    onCreateTask: () -> Unit,
    onUpdateTaskProgress: (ReadingGroupTaskItem) -> Unit,
    onChangeTaskStatus: (ReadingGroupTaskItem, String) -> Unit,
    onRefreshTasks: () -> Unit,
    onCreateEvent: () -> Unit,
    onRespondEvent: (ReadingGroupEventItem, String) -> Unit,
    onChangeEventStatus: (ReadingGroupEventItem, String) -> Unit,
    onRefreshEvents: () -> Unit,
    onEditGroupProfile: () -> Unit,
    onRefreshMembers: () -> Unit,
    onSendMessage: () -> Unit,
    onShareProgress: () -> Unit,
    onReact: (ReadingGroupFeedItem, String) -> Unit,
    onEditPost: (ReadingGroupFeedItem) -> Unit,
    onTogglePinPost: (ReadingGroupFeedItem) -> Unit,
    onDeletePost: (ReadingGroupFeedItem) -> Unit,
    onReportPost: (ReadingGroupFeedItem) -> Unit,
    onDeleteComment: (ReadingGroupFeedItem, ReadingGroupCommentItem) -> Unit,
    onToggleReply: (ReadingGroupFeedItem) -> Unit,
    onReplyDraftChange: (Long, String) -> Unit,
    onSubmitReply: (ReadingGroupFeedItem) -> Unit,
    onRefreshFeed: () -> Unit,
    onRefreshLeaderboard: () -> Unit,
    onBack: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val scrollState = rememberScrollState()
    LaunchedEffect(activeGroupCode) {
        scrollState.scrollTo(0)
    }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
    ) {
        PremiumGroupHeader(
            text = text,
            groupName = groupName,
            description = description,
            activeGroupCode = activeGroupCode,
            goal = goal,
            privacy = privacy,
            languageCode = languageCode,
            currentRole = currentRole,
            members = memberCount,
            isOwner = isOwner,
            ink = ink,
            muted = muted,
            green = green,
            onShareGroup = if (canManageGroupMembership(currentRole)) onOpenInviteManager else onShareGroup,
            onPost = { onTabSelected("feed") },
            onBack = onBack,
            onOpenSettings = onOpenSettings
        )

        Column(
            modifier = Modifier.padding(horizontal = AppSpacing.screen, vertical = AppSpacing.lg),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.lg)
        ) {
            if (statusMessage.isNotBlank()) {
                GroupInlineStatus(statusMessage, green)
            }
            if (busy) {
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth().height(3.dp).clip(RoundedCornerShape(3.dp)),
                    color = green,
                    trackColor = BorderNavy
                )
            }
            if (selectedTab != "feed") GroupSummaryCard(
                text = text,
                targetValue = goalTarget,
                goalPeriod = goalPeriod,
                leaderboard = leaderboard,
                unit = unit,
                card = card,
                ink = ink,
                muted = muted,
                green = green,
                line = line
            )
        }

        GroupTabs(
            text = text,
            selected = selectedTab,
            onSelected = onTabSelected,
            green = green,
            muted = muted
        )

        Column(
            modifier = Modifier.padding(horizontal = AppSpacing.screen, vertical = AppSpacing.lg)
        ) {
            when (selectedTab) {
                "dashboard" -> GroupDashboardTab(
                    text = text,
                    leaderboard = leaderboard,
                    feedItems = feedItems,
                    card = card,
                    ink = ink,
                    muted = muted,
                    green = green,
                    line = line
                )
                "leaderboard" -> GroupLeaderboardTab(
                    text = text,
                    leaderboard = leaderboard,
                    card = card,
                    ink = ink,
                    muted = muted,
                    green = green,
                    line = line,
                    onRefresh = onRefreshLeaderboard
                )
                "progress" -> GroupProgressTab(
                    text = text,
                    canShareProgress = "progress.create" in effectivePermissions && "post.create" in effectivePermissions,
                    groupUnit = unit,
                    targetValue = goalTarget,
                    leaderboard = leaderboard,
                    amount = progressAmount,
                    onAmountChange = onProgressAmountChange,
                    progressUnit = progressUnit,
                    onProgressUnitChange = onProgressUnitChange,
                    number = progressNumber,
                    onNumberChange = onProgressNumberChange,
                    busy = busy,
                    card = card,
                    ink = ink,
                    muted = muted,
                    green = green,
                    line = line,
                    onShareProgress = onShareProgress,
                    onRefreshLeaderboard = onRefreshLeaderboard
                )
                "members" -> GroupMembersTab(
                    text = text,
                    members = members,
                    myGroupProfile = myGroupProfile,
                    leaderboard = leaderboard,
                    currentRole = currentRole,
                    groupRoles = groupRoles,
                    invitations = invitations,
                    joinRequests = joinRequests,
                    card = card,
                    ink = ink,
                    muted = muted,
                    green = green,
                    line = line,
                    onInvite = onOpenInviteManager,
                    onManageMember = onManageMember,
                    onRemoveMember = onRemoveMember,
                    onRevokeInvitation = onRevokeInvitation,
                    onReviewJoinRequest = onReviewJoinRequest,
                    onEditGroupProfile = onEditGroupProfile,
                    onRefresh = onRefreshMembers
                )
                "media" -> GroupMediaTab(
                    text = text,
                    mediaItems = mediaItems,
                    loading = mediaLoading,
                    card = card,
                    muted = muted,
                    green = green,
                    line = line,
                    onOpen = onOpenMedia,
                    onDelete = onDeleteMedia,
                    onRefresh = onRefreshMedia
                )
                "tasks" -> GroupTasksTab(
                    text = text,
                    tasks = taskItems,
                    currentRole = currentRole,
                    loading = tasksLoading,
                    onCreate = onCreateTask,
                    onProgress = onUpdateTaskProgress,
                    onStatusChange = onChangeTaskStatus,
                    onRefresh = onRefreshTasks
                )
                "events" -> GroupEventsTab(
                    text = text,
                    events = eventItems,
                    currentRole = currentRole,
                    loading = eventsLoading,
                    onCreate = onCreateEvent,
                    onRespond = onRespondEvent,
                    onStatusChange = onChangeEventStatus,
                    onRefresh = onRefreshEvents
                )
                else -> GroupFeedTab(
                    text = text,
                    canPostMessages = "post.create" in effectivePermissions,
                    canComment = "comment.create" in effectivePermissions,
                    currentRole = currentRole,
                    currentMember = members.firstOrNull { it.isCurrentUser },
                    chatMessage = chatMessage,
                    onChatMessageChange = onChatMessageChange,
                    feedItems = feedItems,
                    replyDrafts = replyDrafts,
                    openReplyPostId = openReplyPostId,
                    busy = busy,
                    card = card,
                    ink = ink,
                    muted = muted,
                    green = green,
                    line = line,
                    onAttachMedia = onPickMedia,
                    onSendMessage = onSendMessage,
                    onReact = onReact,
                    onEditPost = onEditPost,
                    onTogglePinPost = onTogglePinPost,
                    onDeletePost = onDeletePost,
                    onReportPost = onReportPost,
                    onDeleteComment = onDeleteComment,
                    onToggleReply = onToggleReply,
                    onReplyDraftChange = onReplyDraftChange,
                    onSubmitReply = onSubmitReply,
                    onRefreshFeed = onRefreshFeed
                )
            }
        }
        Spacer(Modifier.height(AppSpacing.xxl))
    }
}

@Composable
private fun PremiumGroupHeader(
    text: AppStrings,
    groupName: String,
    description: String,
    activeGroupCode: String,
    goal: String,
    privacy: String,
    languageCode: String,
    currentRole: String,
    members: Int,
    isOwner: Boolean,
    ink: Color,
    muted: Color,
    green: Color,
    onShareGroup: () -> Unit,
    onPost: () -> Unit,
    onBack: () -> Unit,
    onOpenSettings: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                androidx.compose.ui.graphics.Brush.verticalGradient(
                    listOf(MidNavy, DeepNavy, DarkNavy)
                )
            )
            .padding(horizontal = AppSpacing.screen, vertical = AppSpacing.lg),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.lg)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            GroupHeaderIconButton(
                icon = Icons.AutoMirrored.Filled.ArrowBack,
                description = text.groupForm.back,
                onClick = onBack
            )
            Spacer(Modifier.weight(1f))
            GroupHeaderIconButton(
                icon = Icons.Default.Share,
                description = text.groupShareChooser,
                onClick = onShareGroup
            )
            if (isOwner) {
                Spacer(Modifier.width(8.dp))
                GroupHeaderIconButton(
                    icon = Icons.Default.Settings,
                    description = text.groupSettingsText.open,
                    onClick = onOpenSettings
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            GroupLogo(activeGroupCode, currentRole in setOf("owner", "admin"), text)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    groupName,
                    fontSize = 23.sp,
                    lineHeight = 27.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = ink,
                    maxLines = 2
                )
                Row(horizontalArrangement = Arrangement.spacedBy(7.dp), verticalAlignment = Alignment.CenterVertically) {
                    GroupMetaPill(groupPrivacyLabel(text, privacy), Icons.Default.Lock, Gold)
                    GroupMetaPill(groupRoleLabel(text, currentRole), Icons.Default.VerifiedUser, DoneGreen)
                }
            }
        }

        Text(
            description,
            fontSize = 13.sp,
            lineHeight = 19.sp,
            color = SoftTextGold,
            maxLines = 3
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            GroupHeaderStat(Icons.Default.Groups, text.groupHome.membersCount.format(members.coerceAtLeast(1)), Modifier.weight(1f))
            GroupHeaderStat(Icons.AutoMirrored.Filled.MenuBook, groupGoalTypeLabel(text, goal), Modifier.weight(1f))
            GroupHeaderStat(Icons.Default.Language, groupLanguageLabel(languageCode), Modifier.weight(1f))
        }

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Button(
                onClick = onShareGroup,
                modifier = Modifier.weight(1f).height(46.dp),
                shape = RoundedCornerShape(AppShape.control),
                colors = ButtonDefaults.buttonColors(containerColor = Gold)
            ) {
                Icon(Icons.Default.PersonAdd, contentDescription = null, modifier = Modifier.size(18.dp), tint = DarkNavy)
                Spacer(Modifier.width(8.dp))
                Text(text.t("groups.detail.invite"), color = DarkNavy, fontWeight = FontWeight.Bold, maxLines = 1)
            }
            OutlinedButton(
                onClick = onPost,
                modifier = Modifier.weight(1f).height(46.dp),
                shape = RoundedCornerShape(AppShape.control),
                border = BorderStroke(AppBorder.thin, Gold.copy(alpha = 0.55f)),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight)
            ) {
                Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(17.dp))
                Spacer(Modifier.width(8.dp))
                Text(text.t("groups.detail.post"), fontWeight = FontWeight.Bold, maxLines = 1)
            }
        }
        Text(
            text.groupHome.groupCode.format(activeGroupCode),
            modifier = Modifier.align(Alignment.CenterHorizontally),
            fontSize = 10.sp,
            color = muted
        )
    }
}

@Composable
private fun GroupHeaderIconButton(
    icon: ImageVector,
    description: String,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        modifier = Modifier.size(42.dp),
        shape = CircleShape,
        color = MidNavy.copy(alpha = 0.92f),
        border = BorderStroke(AppBorder.hairline, BorderNavy)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = description, tint = GoldLight, modifier = Modifier.size(20.dp))
        }
    }
}

@Composable
private fun GroupMetaPill(label: String, icon: ImageVector, color: Color) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(color.copy(alpha = 0.13f))
            .padding(horizontal = 8.dp, vertical = 5.dp),
        horizontalArrangement = Arrangement.spacedBy(5.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(13.dp))
        Text(label, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = color, maxLines = 1)
    }
}

@Composable
private fun GroupHeaderStat(icon: ImageVector, label: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(AppShape.control))
            .background(MidNavy.copy(alpha = 0.72f))
            .padding(horizontal = 8.dp, vertical = 9.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = Gold, modifier = Modifier.size(15.dp))
        Spacer(Modifier.width(5.dp))
        Text(label, fontSize = 9.sp, color = SoftTextGold, maxLines = 1)
    }
}

@Composable
private fun GroupInlineStatus(message: String, accent: Color) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.control))
            .background(accent.copy(alpha = 0.10f))
            .padding(horizontal = 12.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = accent, modifier = Modifier.size(17.dp))
        Text(message, modifier = Modifier.weight(1f), fontSize = 11.sp, color = SoftTextGold)
    }
}

@Composable
private fun GroupFeatureEmptyState(icon: ImageVector, title: String, body: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.card))
            .background(MidNavy)
            .padding(horizontal = 24.dp, vertical = 30.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Box(
            modifier = Modifier.size(52.dp).clip(CircleShape).background(GoldSurface),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = Gold, modifier = Modifier.size(25.dp))
        }
        Text(title, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = GoldLight, textAlign = TextAlign.Center)
        Text(body, fontSize = 11.sp, lineHeight = 16.sp, color = MutedGold, textAlign = TextAlign.Center)
    }
}

@Composable
private fun GroupMediaTab(
    text: AppStrings,
    mediaItems: List<ReadingGroupMediaItem>,
    loading: Boolean,
    card: Color,
    muted: Color,
    green: Color,
    line: Color,
    onOpen: (ReadingGroupMediaItem) -> Unit,
    onDelete: (ReadingGroupMediaItem) -> Unit,
    onRefresh: () -> Unit
) {
    var ownOnly by rememberSaveable { mutableStateOf(false) }
    val visibleMedia = if (ownOnly) mediaItems.filter(ReadingGroupMediaItem::isMine) else mediaItems
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.lg)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    text.t("groups.media.title"),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = GoldLight
                )
                Text(
                    text.t("groups.media.summary", mediaItems.size),
                    fontSize = 11.sp,
                    color = muted
                )
            }
            IconButton(onClick = onRefresh, enabled = !loading) {
                Icon(
                    Icons.Default.Refresh,
                    contentDescription = text.t("groups.media.refresh"),
                    tint = green
                )
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
            FilterChip(
                selected = !ownOnly,
                onClick = { ownOnly = false },
                label = { Text(text.t("groups.media.all")) },
                leadingIcon = if (!ownOnly) {
                    { Icon(Icons.Default.Check, null, Modifier.size(15.dp)) }
                } else {
                    null
                },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = GoldSurface,
                    selectedLabelColor = GoldLight,
                    labelColor = muted
                )
            )
            FilterChip(
                selected = ownOnly,
                onClick = { ownOnly = true },
                label = { Text(text.t("groups.media.mine")) },
                leadingIcon = if (ownOnly) {
                    { Icon(Icons.Default.Check, null, Modifier.size(15.dp)) }
                } else {
                    null
                },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = GoldSurface,
                    selectedLabelColor = GoldLight,
                    labelColor = muted
                )
            )
        }

        when {
            loading && mediaItems.isEmpty() -> GroupMediaSkeleton(card, line)
            visibleMedia.isEmpty() -> GroupFeatureEmptyState(
                icon = Icons.Default.Collections,
                title = text.t(if (ownOnly) "groups.media.mineEmptyTitle" else "groups.detail.media.emptyTitle"),
                body = text.t(if (ownOnly) "groups.media.mineEmptyBody" else "groups.detail.media.emptyBody")
            )
            else -> visibleMedia.chunked(2).forEach { rowItems ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)
                ) {
                    rowItems.forEach { media ->
                        GroupMediaTile(
                            text = text,
                            media = media,
                            card = card,
                            muted = muted,
                            line = line,
                            onOpen = { onOpen(media) },
                            onDelete = { onDelete(media) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                    if (rowItems.size == 1) Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun GroupTasksTab(
    text: AppStrings,
    tasks: List<ReadingGroupTaskItem>,
    currentRole: String,
    loading: Boolean,
    onCreate: () -> Unit,
    onProgress: (ReadingGroupTaskItem) -> Unit,
    onStatusChange: (ReadingGroupTaskItem, String) -> Unit,
    onRefresh: () -> Unit
) {
    var section by rememberSaveable { mutableStateOf("active") }
    val activeTasks = tasks.filter { it.status == "active" }
    val historyTasks = tasks.filter { it.status != "active" }
    val visibleTasks = if (section == "active") activeTasks else historyTasks
    val canCreate = canCreateGroupTasks(currentRole)

    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.lg)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    text.t("groups.tasks.title"),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = GoldLight
                )
                Text(
                    text.t("groups.tasks.summary", activeTasks.size),
                    fontSize = 11.sp,
                    color = MutedGold
                )
            }
            IconButton(onClick = onRefresh, enabled = !loading) {
                Icon(Icons.Default.Refresh, contentDescription = text.t("groups.tasks.refresh"), tint = Gold)
            }
        }

        if (canCreate) {
            Button(
                onClick = onCreate,
                enabled = !loading,
                modifier = Modifier.fillMaxWidth().height(46.dp),
                shape = RoundedCornerShape(AppShape.control),
                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = DarkNavy)
            ) {
                Icon(Icons.Default.AddTask, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(AppSpacing.sm))
                Text(text.t("groups.tasks.create"), fontWeight = FontWeight.ExtraBold)
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
            GroupTaskFilterChip(
                selected = section == "active",
                label = text.t("groups.tasks.filter.active", activeTasks.size),
                onClick = { section = "active" }
            )
            GroupTaskFilterChip(
                selected = section == "history",
                label = text.t("groups.tasks.filter.history", historyTasks.size),
                onClick = { section = "history" }
            )
        }

        when {
            loading && tasks.isEmpty() -> GroupTasksSkeleton()
            visibleTasks.isEmpty() -> GroupFeatureEmptyState(
                icon = if (section == "active") Icons.Default.TaskAlt else Icons.Default.History,
                title = text.t(
                    if (section == "active") "groups.tasks.activeEmptyTitle" else "groups.tasks.historyEmptyTitle"
                ),
                body = text.t(
                    if (section == "active") "groups.tasks.activeEmptyBody" else "groups.tasks.historyEmptyBody"
                )
            )
            else -> visibleTasks.forEach { task ->
                GroupTaskCard(
                    text = text,
                    task = task,
                    loading = loading,
                    onProgress = { onProgress(task) },
                    onStatusChange = { status -> onStatusChange(task, status) }
                )
            }
        }
    }
}

@Composable
private fun GroupTaskFilterChip(selected: Boolean, label: String, onClick: () -> Unit) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label) },
        leadingIcon = if (selected) {
            { Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(15.dp)) }
        } else null,
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = GoldSurface,
            selectedLabelColor = GoldLight,
            labelColor = MutedGold
        )
    )
}

@Composable
private fun GroupTasksSkeleton() {
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
        repeat(2) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(AppShape.card))
                    .background(MidNavy)
                    .padding(AppSpacing.lg),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md)
            ) {
                Box(Modifier.fillMaxWidth(0.56f).height(16.dp).clip(RoundedCornerShape(8.dp)).background(BorderNavy))
                Box(Modifier.fillMaxWidth().height(9.dp).clip(RoundedCornerShape(8.dp)).background(BorderNavy))
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(8.dp)),
                    color = Gold,
                    trackColor = DeepNavy
                )
            }
        }
    }
}

@Composable
private fun GroupTaskCard(
    text: AppStrings,
    task: ReadingGroupTaskItem,
    loading: Boolean,
    onProgress: () -> Unit,
    onStatusChange: (String) -> Unit
) {
    var menuOpen by remember(task.id) { mutableStateOf(false) }
    val progress = (task.myProgress.toFloat() / task.targetValue.coerceAtLeast(1)).coerceIn(0f, 1f)
    val active = task.status == "active"

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.card))
            .background(MidNavy)
            .border(AppBorder.thin, BorderNavy, RoundedCornerShape(AppShape.card))
            .padding(AppSpacing.lg),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.md)
    ) {
        Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
            Box(
                modifier = Modifier.size(42.dp).clip(CircleShape).background(GoldSurface),
                contentAlignment = Alignment.Center
            ) {
                Icon(groupTaskTypeIcon(task.taskType), contentDescription = null, tint = Gold, modifier = Modifier.size(21.dp))
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(task.title, color = GoldLight, fontSize = 15.sp, fontWeight = FontWeight.ExtraBold)
                Row(horizontalArrangement = Arrangement.spacedBy(7.dp), verticalAlignment = Alignment.CenterVertically) {
                    GroupTaskStatusBadge(text, task.status)
                    Text(groupTaskTypeLabel(text, task.taskType), color = MutedGold, fontSize = 10.sp)
                }
                if (task.pointsReward > 0) {
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Stars, contentDescription = null, tint = Gold, modifier = Modifier.size(14.dp))
                        Text(
                            text.t("groups.tasks.pointsReward", task.pointsReward),
                            color = if (task.myPointsAwarded) DoneGreen else Gold,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                        if (task.myPointsAwarded) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = DoneGreen, modifier = Modifier.size(13.dp))
                        }
                    }
                }
            }
            if (task.canManage) {
                Box {
                    IconButton(onClick = { menuOpen = true }, enabled = !loading) {
                        Icon(Icons.Default.MoreVert, contentDescription = text.t("groups.tasks.manage"), tint = MutedGold)
                    }
                    DropdownMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }) {
                        if (active) {
                            DropdownMenuItem(
                                text = { Text(text.t("groups.tasks.markCompleted")) },
                                leadingIcon = { Icon(Icons.Default.TaskAlt, contentDescription = null, tint = DoneGreen) },
                                onClick = { menuOpen = false; onStatusChange("completed") }
                            )
                            DropdownMenuItem(
                                text = { Text(text.t("groups.tasks.cancel")) },
                                leadingIcon = { Icon(Icons.Default.Block, contentDescription = null, tint = MutedGold) },
                                onClick = { menuOpen = false; onStatusChange("cancelled") }
                            )
                        } else {
                            DropdownMenuItem(
                                text = { Text(text.t("groups.tasks.reactivate")) },
                                leadingIcon = { Icon(Icons.Default.Refresh, contentDescription = null, tint = DoneGreen) },
                                onClick = { menuOpen = false; onStatusChange("active") }
                            )
                        }
                        DropdownMenuItem(
                            text = { Text(text.t("groups.tasks.delete"), color = DeleteRed) },
                            leadingIcon = { Icon(Icons.Default.DeleteOutline, contentDescription = null, tint = DeleteRed) },
                            onClick = { menuOpen = false; onStatusChange("deleted") }
                        )
                    }
                }
            }
        }

        if (task.description.isNotBlank()) {
            Text(task.description, color = SoftTextGold, fontSize = 12.sp, lineHeight = 18.sp)
        }

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(
                text.t("groups.tasks.progressValue", task.myProgress, task.targetValue, groupTaskUnitLabel(text, task.targetUnit, task.targetValue)),
                color = GoldLight,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
            Text("${(progress * 100).toInt()}%", color = if (task.myCompleted) DoneGreen else Gold, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier.fillMaxWidth().height(7.dp).clip(RoundedCornerShape(10.dp)),
            color = if (task.myCompleted) DoneGreen else Gold,
            trackColor = DeepNavy
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm),
            verticalAlignment = Alignment.CenterVertically
        ) {
            GroupTaskMeta(Icons.Default.CalendarMonth, groupTaskDueLabel(text, task.dueAt), Modifier.weight(1f))
            GroupTaskMeta(
                Icons.Default.Groups,
                text.t("groups.tasks.participants", task.participantCount, task.completedCount),
                Modifier.weight(1f)
            )
        }

        if (active) {
            OutlinedButton(
                onClick = onProgress,
                enabled = !loading,
                modifier = Modifier.fillMaxWidth().height(42.dp),
                shape = RoundedCornerShape(AppShape.control),
                border = BorderStroke(1.dp, if (task.myCompleted) DoneGreen else Gold),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = if (task.myCompleted) DoneGreen else Gold)
            ) {
                Icon(
                    if (task.myCompleted) Icons.Default.CheckCircle else Icons.Default.Edit,
                    contentDescription = null,
                    modifier = Modifier.size(17.dp)
                )
                Spacer(Modifier.width(AppSpacing.sm))
                Text(
                    text.t(if (task.myCompleted) "groups.tasks.adjustProgress" else "groups.tasks.updateProgress"),
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
private fun GroupTaskStatusBadge(text: AppStrings, status: String) {
    val color = when (status) {
        "active" -> DoneGreen
        "completed" -> Gold
        else -> MutedGold
    }
    Text(
        text.t("groups.tasks.status.$status"),
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = 8.dp, vertical = 3.dp),
        color = color,
        fontSize = 9.sp,
        fontWeight = FontWeight.Bold
    )
}

@Composable
private fun GroupTaskMeta(icon: ImageVector, label: String, modifier: Modifier = Modifier) {
    Row(modifier = modifier, horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = MutedGold, modifier = Modifier.size(15.dp))
        Text(label, color = MutedGold, fontSize = 9.sp, maxLines = 1)
    }
}

@Composable
private fun GroupMediaSkeleton(card: Color, line: Color) {
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
        repeat(2) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                repeat(2) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .aspectRatio(0.86f)
                            .clip(RoundedCornerShape(AppShape.card))
                            .background(card)
                            .border(AppBorder.thin, line, RoundedCornerShape(AppShape.card))
                    ) {
                        LinearProgressIndicator(
                            modifier = Modifier.fillMaxWidth().align(Alignment.BottomCenter),
                            color = Gold,
                            trackColor = DeepNavy
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun GroupMediaTile(
    text: AppStrings,
    media: ReadingGroupMediaItem,
    card: Color,
    muted: Color,
    line: Color,
    onOpen: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(AppShape.card))
            .background(card)
            .border(AppBorder.thin, line, RoundedCornerShape(AppShape.card))
            .clickable(onClick = onOpen)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .background(DeepNavy),
            contentAlignment = Alignment.Center
        ) {
            if (media.signedUrl.isBlank()) {
                Icon(Icons.Default.BrokenImage, contentDescription = null, tint = muted, modifier = Modifier.size(34.dp))
            } else {
                AsyncImage(
                    model = media.signedUrl,
                    contentDescription = text.t("groups.media.open", media.fileName),
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            }
            if (media.canDelete) {
                IconButton(
                    onClick = onDelete,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(AppSpacing.xs)
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(DarkNavy.copy(alpha = 0.82f))
                ) {
                    Icon(
                        Icons.Default.DeleteOutline,
                        contentDescription = text.t("groups.media.deleteAction"),
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
        Column(
            modifier = Modifier.fillMaxWidth().padding(AppSpacing.md),
            verticalArrangement = Arrangement.spacedBy(3.dp)
        ) {
            Text(media.fileName, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = GoldLight, maxLines = 1)
            Text(
                "${media.displayName} · ${groupFeedTimeLabel(media.createdAt)}",
                fontSize = 9.sp,
                color = muted,
                maxLines = 1
            )
        }
    }
}

@Composable
private fun UploadGroupMediaDialog(
    text: AppStrings,
    pending: PendingGroupMediaUpload,
    caption: String,
    onCaptionChange: (String) -> Unit,
    busy: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        titleContentColor = GoldLight,
        textContentColor = SoftTextGold,
        title = { Text(text.t("groups.media.uploadTitle"), fontWeight = FontWeight.ExtraBold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.lg)) {
                AsyncImage(
                    model = Uri.parse(pending.previewUri),
                    contentDescription = pending.fileName,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 180.dp, max = 260.dp)
                        .clip(RoundedCornerShape(AppShape.card))
                        .background(DeepNavy),
                    contentScale = ContentScale.Fit
                )
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(pending.fileName, modifier = Modifier.weight(1f), fontSize = 11.sp, color = GoldLight, maxLines = 1)
                    Spacer(Modifier.width(AppSpacing.sm))
                    Text(formatGroupMediaSize(pending.bytes.size.toLong()), fontSize = 10.sp, color = MutedGold)
                }
                OutlinedTextField(
                    value = caption,
                    onValueChange = onCaptionChange,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 4,
                    label = { Text(text.t("groups.media.caption")) },
                    placeholder = { Text(text.t("groups.media.captionHint")) },
                    supportingText = { Text("${caption.length}/1000") },
                    shape = RoundedCornerShape(AppShape.control),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Gold,
                        unfocusedBorderColor = BorderNavy,
                        focusedTextColor = SoftTextGold,
                        unfocusedTextColor = SoftTextGold,
                        focusedContainerColor = DeepNavy,
                        unfocusedContainerColor = DeepNavy,
                        cursorColor = Gold
                    )
                )
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !busy) {
                Text(text.t("common.cancel"), color = MutedGold)
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !busy,
                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = DarkNavy)
            ) {
                if (busy) {
                    CircularProgressIndicator(Modifier.size(17.dp), strokeWidth = 2.dp, color = DarkNavy)
                    Spacer(Modifier.width(AppSpacing.sm))
                }
                Text(text.t(if (busy) "groups.media.uploading" else "groups.media.confirmUpload"))
            }
        }
    )
}

@Composable
private fun GroupMediaPreviewDialog(
    text: AppStrings,
    media: ReadingGroupMediaItem,
    onDismiss: () -> Unit,
    onDelete: (() -> Unit)?
) {
    val context = LocalContext.current
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = false
        )
    ) {
        GroupDialogSystemBars(DarkNavy)
        Surface(modifier = Modifier.fillMaxSize(), color = DarkNavy) {
            Column(
                modifier = Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = AppSpacing.md, vertical = AppSpacing.sm),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = text.groupForm.back, tint = GoldLight)
                    }
                    Text(
                        media.fileName,
                        modifier = Modifier.weight(1f),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = GoldLight,
                        maxLines = 1
                    )
                    IconButton(onClick = {
                        val shareText = listOf(media.caption, media.signedUrl).filter(String::isNotBlank).joinToString("\n\n")
                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_TEXT, shareText)
                        }
                        context.startActivity(Intent.createChooser(shareIntent, text.t("groups.media.share")))
                    }) {
                        Icon(Icons.Default.Share, contentDescription = text.t("groups.media.share"), tint = Gold)
                    }
                    if (onDelete != null) {
                        IconButton(onClick = onDelete) {
                            Icon(
                                Icons.Default.DeleteOutline,
                                contentDescription = text.t("groups.media.deleteAction"),
                                tint = DeleteRed
                            )
                        }
                    }
                }
                Box(
                    modifier = Modifier.fillMaxWidth().weight(1f).background(Color.Black),
                    contentAlignment = Alignment.Center
                ) {
                    AsyncImage(
                        model = media.signedUrl,
                        contentDescription = media.fileName,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit
                    )
                }
                Column(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = AppSpacing.lg, vertical = AppSpacing.md),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (media.caption.isNotBlank()) {
                        Text(media.caption, fontSize = 13.sp, lineHeight = 19.sp, color = SoftTextGold)
                    }
                    Text(
                        text.t(
                            "groups.media.meta",
                            media.displayName,
                            groupFeedTimeLabel(media.createdAt),
                            formatGroupMediaSize(media.byteSize)
                        ),
                        fontSize = 10.sp,
                        color = MutedGold
                    )
                }
            }
        }
    }
}

private fun groupPrivacyLabel(text: AppStrings, privacy: String): String = when (normalizeGroupPrivacy(privacy)) {
    GROUP_PRIVACY_PUBLIC -> text.groupPrivacyOption.public
    GROUP_PRIVACY_INVITE_ONLY -> text.groupPrivacyOption.inviteOnly
    else -> text.groupPrivacyOption.codeOnly
}

private fun groupRoleLabel(text: AppStrings, role: String): String = when (role.trim().lowercase()) {
    "owner" -> text.groupOwnerBadge
    "admin" -> text.t("groups.detail.role.admin")
    "moderator" -> text.t("groups.detail.role.moderator")
    else -> text.t("groups.member")
}

private fun canManageGroupMembership(role: String): Boolean =
    role.trim().lowercase() in setOf("owner", "admin")

private fun canCreateGroupTasks(role: String): Boolean =
    role.trim().lowercase() in setOf("owner", "admin")

private fun canUploadGroupMedia(role: String): Boolean =
    role.trim().lowercase() in setOf("owner", "admin", "moderator", "member")

@Composable
private fun GroupEventsTab(
    text: AppStrings,
    events: List<ReadingGroupEventItem>,
    currentRole: String,
    loading: Boolean,
    onCreate: () -> Unit,
    onRespond: (ReadingGroupEventItem, String) -> Unit,
    onStatusChange: (ReadingGroupEventItem, String) -> Unit,
    onRefresh: () -> Unit
) {
    var section by rememberSaveable { mutableStateOf("upcoming") }
    val upcoming = events.filter { it.status == "scheduled" }
    val history = events.filter { it.status != "scheduled" }
    val visible = if (section == "upcoming") upcoming else history
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.lg)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(text.t("groups.events.title"), color = GoldLight, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
                Text(text.t("groups.events.summary", upcoming.size), color = MutedGold, fontSize = 11.sp)
            }
            IconButton(onClick = onRefresh, enabled = !loading) {
                Icon(Icons.Default.Refresh, contentDescription = text.t("groups.events.refresh"), tint = Gold)
            }
        }
        if (canCreateGroupEvents(currentRole)) {
            Button(
                onClick = onCreate,
                enabled = !loading,
                modifier = Modifier.fillMaxWidth().height(46.dp),
                shape = RoundedCornerShape(AppShape.control),
                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = DarkNavy)
            ) {
                Icon(Icons.Default.EventAvailable, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(AppSpacing.sm))
                Text(text.t("groups.events.create"), fontWeight = FontWeight.ExtraBold)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
            GroupTaskFilterChip(section == "upcoming", text.t("groups.events.filter.upcoming", upcoming.size)) { section = "upcoming" }
            GroupTaskFilterChip(section == "history", text.t("groups.events.filter.history", history.size)) { section = "history" }
        }
        when {
            loading && events.isEmpty() -> GroupTasksSkeleton()
            visible.isEmpty() -> GroupFeatureEmptyState(
                icon = if (section == "upcoming") Icons.Default.Event else Icons.Default.History,
                title = text.t(if (section == "upcoming") "groups.detail.events.emptyTitle" else "groups.events.historyEmptyTitle"),
                body = text.t(if (section == "upcoming") "groups.detail.events.emptyBody" else "groups.events.historyEmptyBody")
            )
            else -> visible.forEach { event ->
                GroupEventCard(text, event, loading, onRespond, onStatusChange)
            }
        }
    }
}

@Composable
private fun GroupEventCard(
    text: AppStrings,
    event: ReadingGroupEventItem,
    loading: Boolean,
    onRespond: (ReadingGroupEventItem, String) -> Unit,
    onStatusChange: (ReadingGroupEventItem, String) -> Unit
) {
    var menuOpen by remember(event.id) { mutableStateOf(false) }
    val scheduled = event.status == "scheduled"
    Column(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(AppShape.card)).background(MidNavy)
            .border(AppBorder.thin, BorderNavy, RoundedCornerShape(AppShape.card)).padding(AppSpacing.lg),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.md)
    ) {
        Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
            Box(Modifier.size(48.dp).clip(RoundedCornerShape(14.dp)).background(GoldSurface), contentAlignment = Alignment.Center) {
                Icon(Icons.Default.CalendarMonth, contentDescription = null, tint = Gold, modifier = Modifier.size(24.dp))
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(event.title, color = GoldLight, fontSize = 15.sp, fontWeight = FontWeight.ExtraBold)
                Text(groupEventDateLabel(event.startsAt), color = Gold, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                if (event.location.isNotBlank()) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Default.Place, contentDescription = null, tint = MutedGold, modifier = Modifier.size(13.dp))
                        Text(event.location, color = MutedGold, fontSize = 10.sp, maxLines = 1)
                    }
                }
            }
            if (event.canManage) {
                Box {
                    IconButton(onClick = { menuOpen = true }, enabled = !loading) {
                        Icon(Icons.Default.MoreVert, contentDescription = text.t("groups.events.manage"), tint = MutedGold)
                    }
                    DropdownMenu(menuOpen, { menuOpen = false }) {
                        if (scheduled) {
                            DropdownMenuItem(
                                text = { Text(text.t("groups.events.complete")) },
                                leadingIcon = { Icon(Icons.Default.CheckCircle, null, tint = DoneGreen) },
                                onClick = { menuOpen = false; onStatusChange(event, "completed") }
                            )
                            DropdownMenuItem(
                                text = { Text(text.t("groups.events.cancel")) },
                                leadingIcon = { Icon(Icons.Default.Block, null, tint = MutedGold) },
                                onClick = { menuOpen = false; onStatusChange(event, "cancelled") }
                            )
                        } else {
                            DropdownMenuItem(
                                text = { Text(text.t("groups.events.reactivate")) },
                                leadingIcon = { Icon(Icons.Default.Refresh, null, tint = DoneGreen) },
                                onClick = { menuOpen = false; onStatusChange(event, "scheduled") }
                            )
                        }
                        DropdownMenuItem(
                            text = { Text(text.t("groups.events.delete"), color = DeleteRed) },
                            leadingIcon = { Icon(Icons.Default.DeleteOutline, null, tint = DeleteRed) },
                            onClick = { menuOpen = false; onStatusChange(event, "deleted") }
                        )
                    }
                }
            }
        }
        if (event.description.isNotBlank()) Text(event.description, color = SoftTextGold, fontSize = 12.sp, lineHeight = 18.sp)
        Text(text.t("groups.events.organizer", event.displayName), color = MutedGold, fontSize = 10.sp)
        Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm), verticalAlignment = Alignment.CenterVertically) {
            GroupTaskMeta(Icons.Default.People, text.t("groups.events.goingCount", event.goingCount), Modifier.weight(1f))
            GroupTaskMeta(Icons.Default.HelpOutline, text.t("groups.events.maybeCount", event.maybeCount), Modifier.weight(1f))
        }
        if (scheduled) {
            Text(text.t("groups.events.rsvp"), color = GoldLight, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf(
                    "going" to text.t("groups.events.going"),
                    "maybe" to text.t("groups.events.maybe"),
                    "declined" to text.t("groups.events.declined")
                ).forEach { (key, label) ->
                    FilterChip(
                        selected = event.myResponse == key,
                        onClick = { onRespond(event, key) },
                        enabled = !loading,
                        label = { Text(label, fontSize = 9.sp) },
                        modifier = Modifier.weight(1f),
                        leadingIcon = if (event.myResponse == key) { { Icon(Icons.Default.Check, null, Modifier.size(13.dp)) } } else null,
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = GoldSurface, selectedLabelColor = GoldLight, labelColor = MutedGold)
                    )
                }
            }
        } else {
            GroupTaskStatusBadge(text, event.status)
        }
    }
}

private fun canCreateGroupEvents(role: String): Boolean = role.lowercase() in setOf("owner", "admin")

private fun groupTaskTypeIcon(type: String): ImageVector = when (type.lowercase()) {
    "reading" -> Icons.AutoMirrored.Filled.MenuBook
    "memorization" -> Icons.Default.Psychology
    "custom" -> Icons.Default.Tune
    else -> Icons.Default.EmojiEvents
}

private fun groupTaskTypeLabel(text: AppStrings, type: String): String =
    text.t("groups.tasks.type.${type.lowercase()}")

private fun groupTaskUnitLabel(text: AppStrings, unit: String, amount: Int): String = when (normalizeProgressUnit(unit)) {
    PROGRESS_UNIT_PAGE -> if (amount == 1) text.groupUnitOption.page else text.groupUnitOption.pages
    PROGRESS_UNIT_AYAH -> if (amount == 1) text.groupUnitOption.ayah else text.groupUnitOption.ayahs
    PROGRESS_UNIT_HIZB -> if (amount == 1) text.groupUnitOption.hizb else text.groupUnitOption.hizbs
    PROGRESS_UNIT_JUZ -> if (amount == 1) text.groupUnitOption.juz else text.groupUnitOption.juzs
    PROGRESS_UNIT_SURAH -> if (amount == 1) text.groupUnitOption.surah else text.groupUnitOption.surahs
    PROGRESS_UNIT_LESSON -> if (amount == 1) text.groupUnitOption.lesson else text.groupUnitOption.lessons
    else -> text.groupUnitOption.custom
}

private fun groupTaskDueLabel(text: AppStrings, dueAt: String?): String =
    dueAt?.takeIf(String::isNotBlank)?.take(10)?.let { text.t("groups.tasks.due", it) }
        ?: text.t("groups.tasks.noDeadline")

private fun groupRoleRank(role: String): Int = when (role.trim().lowercase()) {
    "owner" -> 100
    "admin" -> 80
    "moderator" -> 50
    else -> 10
}

private fun groupLanguageLabel(languageCode: String): String = when (languageCode.lowercase()) {
    "ar" -> "العربية"
    "en" -> "English"
    "fr" -> "Français"
    else -> "Nederlands"
}

@Composable
private fun GroupSummaryCard(
    text: AppStrings,
    targetValue: Int?,
    goalPeriod: String,
    leaderboard: List<ReadingGroupLeaderboardRow>,
    unit: String,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color
) {
    val total = leaderboard.sumOf { it.totalAyahEquivalent }.toGoalUnitAmount(unit)
    val hasGoal = normalizeGoalPeriod(goalPeriod) != GOAL_PERIOD_NONE && targetValue != null && targetValue > 0
    val safeTarget = targetValue?.coerceAtLeast(1) ?: 1
    val progress = if (hasGoal) (total.toFloat() / safeTarget).coerceIn(0f, 1f) else 0f
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.card))
            .background(MidNavy)
            .padding(AppSpacing.lg),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.md)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier.size(34.dp).clip(CircleShape).background(GoldSurface),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Flag, contentDescription = null, tint = Gold, modifier = Modifier.size(17.dp))
                }
                Column {
                    Text(text.t("groups.detail.groupGoal"), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    Text(
                        if (hasGoal) formatGoalSummary(text, goalPeriod, safeTarget, unit) else text.groupGoalText.noFixedGoal,
                        fontSize = 10.sp,
                        color = muted
                    )
                }
            }
            if (hasGoal) {
                Text("${(progress * 100).toInt()}%", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = green)
            }
        }
        if (hasGoal) {
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(10.dp)),
                color = green,
                trackColor = BorderNavy
            )
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(
                    text.t("groups.detail.communityProgress"),
                    fontSize = 10.sp,
                    color = muted
                )
                Text(
                    "${total.coerceAtMost(safeTarget)} / $safeTarget ${formatGoalUnit(text, unit, safeTarget)}",
                    fontSize = 11.sp,
                    color = green,
                    fontWeight = FontWeight.Bold
                )
            }
        } else {
            Text(
                text.groupGoalText.noFixedGoalSummary,
                fontSize = 11.sp,
                color = muted
            )
        }
    }
}

@Composable
private fun GroupTabs(text: AppStrings, selected: String, onSelected: (String) -> Unit, green: Color, muted: Color) {
    val tabs = listOf(
        Triple("dashboard", text.t("groups.detail.tab.overview"), Icons.Default.Dashboard),
        Triple("feed", text.t("groups.detail.tab.posts"), Icons.Default.Forum),
        Triple("members", text.t("groups.detail.tab.members"), Icons.Default.Groups),
        Triple("progress", text.t("groups.detail.tab.progress"), Icons.Default.TaskAlt),
        Triple("leaderboard", text.t("groups.detail.tab.ranking"), Icons.Default.Leaderboard),
        Triple("media", text.t("groups.detail.tab.media"), Icons.Default.Collections),
        Triple("tasks", text.t("groups.detail.tab.tasks"), Icons.Default.Checklist),
        Triple("events", text.t("groups.detail.tab.events"), Icons.Default.Event)
    )
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(DeepNavy)
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = AppSpacing.screen),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        tabs.forEach { (key, label, icon) ->
            val isSelected = selected == key
            Column(
                modifier = Modifier
                    .widthIn(min = 72.dp)
                    .clickable { onSelected(key) }
                    .padding(horizontal = 8.dp, vertical = 10.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    icon,
                    contentDescription = label,
                    tint = if (isSelected) green else muted,
                    modifier = Modifier.size(19.dp)
                )
                Spacer(Modifier.height(5.dp))
                Text(
                    label,
                    fontSize = 10.sp,
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                    color = if (isSelected) green else muted,
                    maxLines = 1
                )
                Spacer(Modifier.height(8.dp))
                Box(
                    Modifier
                        .width(36.dp)
                        .height(2.dp)
                        .background(if (isSelected) green else Color.Transparent, RoundedCornerShape(2.dp))
                )
            }
        }
    }
}

@Composable
private fun GroupLeaderboardTab(
    text: AppStrings,
    leaderboard: List<ReadingGroupLeaderboardRow>,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    onRefresh: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
        GroupLeaderboardSection(
            text = text,
            leaderboard = leaderboard,
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line,
            onRefresh = onRefresh
        )
    }
}

@Composable
private fun GroupDashboardTab(
    text: AppStrings,
    leaderboard: List<ReadingGroupLeaderboardRow>,
    feedItems: List<ReadingGroupFeedItem>,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color
) {
    val totalPoints = leaderboard.sumOf { it.totalPoints }
    val totalPages = leaderboard.sumOf { it.pages }
    val totalJuz = leaderboard.sumOf { it.juz }
    val totalHizb = leaderboard.sumOf { it.hizb }
    val totalSurah = leaderboard.sumOf { it.surah }
    val activeToday = leaderboard.count { it.activeToday }
    val topReader = leaderboard.maxByOrNull { it.totalPoints }
    val topWeekReader = leaderboard.maxByOrNull { it.weeklyPoints }?.takeIf { it.weeklyPoints > 0 }
    val topMonthReader = leaderboard.maxByOrNull { it.monthlyPoints }?.takeIf { it.monthlyPoints > 0 }
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        FormSectionCard(card = card, line = line) {
            Text(text.t("group.dashboard"), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = ink)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                GroupDashboardMetric(text.t("group.totalPoints"), totalPoints.toString(), Gold, Modifier.weight(1f))
                GroupDashboardMetric(text.t("group.activeToday"), activeToday.toString(), green, Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                GroupDashboardMetric(text.groupUnitOption.pages, totalPages.toString(), ReadBlue, Modifier.weight(1f))
                GroupDashboardMetric(text.groupUnitOption.juzs, totalJuz.toString(), DoneGreen, Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                GroupDashboardMetric(text.groupUnitOption.hizbs, totalHizb.toString(), Gold, Modifier.weight(1f))
                GroupDashboardMetric(text.groupUnitOption.surahs, totalSurah.toString(), ReadBlue, Modifier.weight(1f))
            }
        }

        FormSectionCard(card = card, line = line) {
            Text(text.t("group.bestReader"), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
            if (topReader == null && topWeekReader == null && topMonthReader == null) {
                Text(text.groupNoLeaderboardLoaded, fontSize = 12.sp, color = muted)
            } else {
                topWeekReader?.let {
                    Text(text.t("group.bestWeek"), fontSize = 11.sp, color = muted, fontWeight = FontWeight.Bold)
                    GroupLeaderboardRow(text, leaderboard.indexOf(it) + 1, it)
                }
                topMonthReader?.let {
                    Text(text.t("group.bestMonth"), fontSize = 11.sp, color = muted, fontWeight = FontWeight.Bold)
                    GroupLeaderboardRow(text, leaderboard.indexOf(it) + 1, it)
                }
                if (topWeekReader == null && topMonthReader == null && topReader != null) {
                    GroupLeaderboardRow(text, 1, topReader)
                }
            }
        }

        FormSectionCard(card = card, line = line) {
            Text(text.t("group.recentActivity"), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
            val recent = feedItems.filter { it.type == "progress" }.take(4)
            if (recent.isEmpty()) {
                Text(text.groupFeed.empty, fontSize = 12.sp, color = muted)
            } else {
                recent.forEach { item ->
                    Text(item.message, fontSize = 12.sp, color = ink, maxLines = 2)
                    Text(groupFeedTimeLabel(item.createdAt), fontSize = 10.sp, color = muted)
                    HorizontalDivider(color = line, thickness = AppBorder.hairline)
                }
            }
        }
    }
}

@Composable
private fun GroupDashboardMetric(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(AppShape.control))
            .background(DeepNavy)
            .border(AppBorder.thin, BorderNavy, RoundedCornerShape(AppShape.control))
            .padding(AppSpacing.list),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = color)
        Text(label, fontSize = 10.sp, color = MutedGold, maxLines = 1, textAlign = TextAlign.Center)
    }
}

@Composable
private fun GroupFeedTab(
    text: AppStrings,
    canPostMessages: Boolean,
    canComment: Boolean,
    currentRole: String,
    currentMember: ReadingGroupMemberRow?,
    chatMessage: String,
    onChatMessageChange: (String) -> Unit,
    feedItems: List<ReadingGroupFeedItem>,
    replyDrafts: Map<Long, String>,
    openReplyPostId: Long?,
    busy: Boolean,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    onAttachMedia: () -> Unit,
    onSendMessage: () -> Unit,
    onReact: (ReadingGroupFeedItem, String) -> Unit,
    onEditPost: (ReadingGroupFeedItem) -> Unit,
    onTogglePinPost: (ReadingGroupFeedItem) -> Unit,
    onDeletePost: (ReadingGroupFeedItem) -> Unit,
    onReportPost: (ReadingGroupFeedItem) -> Unit,
    onDeleteComment: (ReadingGroupFeedItem, ReadingGroupCommentItem) -> Unit,
    onToggleReply: (ReadingGroupFeedItem) -> Unit,
    onReplyDraftChange: (Long, String) -> Unit,
    onSubmitReply: (ReadingGroupFeedItem) -> Unit,
    onRefreshFeed: () -> Unit
) {
    val sortedPosts = feedItems.sortedByDescending { it.createdAt }.take(30)
    val pinnedPosts = sortedPosts.filter { it.isPinned }
    val recentPosts = sortedPosts.filterNot { it.isPinned }
    Column {
        if (canPostMessages) FeedComposer(
            text = text,
            currentMember = currentMember,
            chatMessage = chatMessage,
            onChatMessageChange = onChatMessageChange,
            busy = busy,
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line,
            onAttachMedia = onAttachMedia,
            onSendMessage = onSendMessage
        ) else Text(text.t("groups.error.permission"), color = muted, fontSize = 13.sp)
        if (sortedPosts.isEmpty()) {
            GroupFeatureEmptyState(
                icon = Icons.Default.Forum,
                title = text.t("groups.detail.posts.emptyTitle"),
                body = text.groupFeed.empty
            )
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                TextButton(onClick = onRefreshFeed) {
                    Text(text.groupRefresh, color = green)
                }
            }
        } else {
            if (pinnedPosts.isNotEmpty()) {
                pinnedPosts.forEach { item ->
                    FeedPostCard(
                        text = text,
                        item = item,
                        currentRole = currentRole,
                        replyDraft = replyDrafts[item.id].orEmpty(),
                        replyOpen = openReplyPostId == item.id,
                        canComment = canComment,
                        busy = busy,
                        onReact = { reaction -> onReact(item, reaction) },
                        onEdit = { onEditPost(item) },
                        onTogglePin = { onTogglePinPost(item) },
                        onDelete = { onDeletePost(item) },
                        onReport = { onReportPost(item) },
                        onDeleteComment = { comment -> onDeleteComment(item, comment) },
                        onToggleReply = { onToggleReply(item) },
                        onReplyDraftChange = { onReplyDraftChange(item.id, it) },
                        onSubmitReply = { onSubmitReply(item) }
                    )
                }
            }
            if (recentPosts.isNotEmpty()) {
                recentPosts.forEach { item ->
                    FeedPostCard(
                        text = text,
                        item = item,
                        currentRole = currentRole,
                        replyDraft = replyDrafts[item.id].orEmpty(),
                        replyOpen = openReplyPostId == item.id,
                        canComment = canComment,
                        busy = busy,
                        onReact = { reaction -> onReact(item, reaction) },
                        onEdit = { onEditPost(item) },
                        onTogglePin = { onTogglePinPost(item) },
                        onDelete = { onDeletePost(item) },
                        onReport = { onReportPost(item) },
                        onDeleteComment = { comment -> onDeleteComment(item, comment) },
                        onToggleReply = { onToggleReply(item) },
                        onReplyDraftChange = { onReplyDraftChange(item.id, it) },
                        onSubmitReply = { onSubmitReply(item) }
                    )
                }
            }
        }
    }
}

@Composable
private fun GroupFeedSectionTitle(icon: ImageVector, label: String, accent: Color) {
    Row(horizontalArrangement = Arrangement.spacedBy(7.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = accent, modifier = Modifier.size(16.dp))
        Text(label, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = GoldLight)
    }
}

@Composable
private fun FeedComposer(
    text: AppStrings,
    currentMember: ReadingGroupMemberRow?,
    chatMessage: String,
    onChatMessageChange: (String) -> Unit,
    busy: Boolean,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    onAttachMedia: () -> Unit,
    onSendMessage: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 4.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.md)
    ) {
        Text(text.t("groups.detail.startDiscussion"), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = GoldLight)
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            GroupMemberAvatar(
                name = currentMember?.displayName ?: text.t("groups.profile.you"),
                avatarUrl = currentMember?.avatarUrl,
                size = 38.dp,
                accent = Gold
            )
            OutlinedTextField(
                value = chatMessage,
                onValueChange = onChatMessageChange,
                placeholder = { Text(text.groupFeed.placeholder, fontSize = 12.sp, color = muted) },
                modifier = Modifier
                    .weight(1f)
                    .heightIn(min = 46.dp),
                singleLine = true,
                textStyle = LocalTextStyle.current.copy(fontSize = 13.sp, color = ink),
                shape = RoundedCornerShape(AppShape.control),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = green,
                    unfocusedBorderColor = BorderNavy,
                    focusedContainerColor = DeepNavy,
                    unfocusedContainerColor = DeepNavy,
                    cursorColor = green
                )
            )
            FilledIconButton(
                onClick = onSendMessage,
                enabled = !busy && chatMessage.isNotBlank(),
                modifier = Modifier.size(42.dp),
                colors = IconButtonDefaults.filledIconButtonColors(
                    containerColor = green,
                    contentColor = DarkNavy,
                    disabledContainerColor = BorderNavy,
                    disabledContentColor = muted
                )
            ) {
                if (busy) {
                    CircularProgressIndicator(modifier = Modifier.size(17.dp), strokeWidth = 2.dp, color = DarkNavy)
                } else {
                    Icon(Icons.AutoMirrored.Filled.Send, contentDescription = text.groupFeed.postButton, modifier = Modifier.size(18.dp))
                }
            }
        }
        TextButton(
            onClick = onAttachMedia,
            enabled = !busy,
            contentPadding = PaddingValues(horizontal = 4.dp, vertical = 2.dp)
        ) {
            Icon(Icons.Default.AttachFile, contentDescription = null, tint = green, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(AppSpacing.xs))
            Text(text.t("groups.feed.attachPhoto"), color = green, fontWeight = FontWeight.Bold, fontSize = 12.sp)
        }
    }
}

@Composable
private fun GroupMembersTab(
    text: AppStrings,
    members: List<ReadingGroupMemberRow>,
    myGroupProfile: ReadingGroupProfile?,
    leaderboard: List<ReadingGroupLeaderboardRow>,
    currentRole: String,
    groupRoles: List<ReadingGroupRoleRow>,
    invitations: List<ReadingGroupInvitationRow>,
    joinRequests: List<ReadingGroupJoinRequestRow>,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    onInvite: () -> Unit,
    onManageMember: (ReadingGroupMemberRow) -> Unit,
    onRemoveMember: (ReadingGroupMemberRow, Boolean) -> Unit,
    onRevokeInvitation: (ReadingGroupInvitationRow) -> Unit,
    onReviewJoinRequest: (ReadingGroupJoinRequestRow, Boolean) -> Unit,
    onEditGroupProfile: () -> Unit,
    onRefresh: () -> Unit
) {
    var query by rememberSaveable { mutableStateOf("") }
    var section by rememberSaveable { mutableStateOf("members") }
    val canManage = canManageGroupMembership(currentRole)
    val pendingRequests = joinRequests.filter { it.status == "pending" }
    val activeInvitations = invitations.filter { it.status == "active" }
    val visibleMembers = members.filter {
        query.isBlank() || it.displayName.contains(query.trim(), ignoreCase = true) ||
            groupRoleLabel(text, it.role).contains(query.trim(), ignoreCase = true)
    }
    val roleRankByKey = groupRoles.associate { it.key to it.rank }
    val currentRank = roleRankByKey[currentRole] ?: groupRoleRank(currentRole)

    Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text.groupMembersText.title, fontSize = 17.sp, fontWeight = FontWeight.Bold, color = ink)
                Text(
                    text.t("groups.members.summary", members.size, members.count { it.role != "member" }),
                    fontSize = 10.sp,
                    color = muted
                )
            }
            IconButton(onClick = onRefresh) {
                Icon(Icons.Default.Refresh, contentDescription = text.t("groups.members.refresh"), tint = green)
            }
        }

        Surface(
            onClick = onEditGroupProfile,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(AppShape.card),
            color = GoldSurface,
            border = BorderStroke(AppBorder.thin, Gold.copy(alpha = 0.45f))
        ) {
            Row(
                modifier = Modifier.padding(AppSpacing.lg),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)
            ) {
                GroupMemberAvatar(
                    name = myGroupProfile?.displayName ?: text.t("groups.profile.you"),
                    avatarUrl = myGroupProfile?.avatarUrl,
                    accent = Gold,
                    size = 46.dp
                )
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(text.t("groups.profile.title"), color = GoldLight, fontSize = 13.sp, fontWeight = FontWeight.ExtraBold)
                    Text(
                        myGroupProfile?.displayName ?: text.t("groups.profile.subtitle"),
                        color = MutedGold,
                        fontSize = 10.sp,
                        maxLines = 1
                    )
                }
                Icon(Icons.Default.Edit, contentDescription = text.t("groups.profile.edit"), tint = Gold, modifier = Modifier.size(19.dp))
            }
        }

        if (canManage) {
            Button(
                onClick = onInvite,
                modifier = Modifier.fillMaxWidth().height(44.dp),
                shape = RoundedCornerShape(AppShape.control),
                colors = ButtonDefaults.buttonColors(containerColor = green, contentColor = DarkNavy)
            ) {
                Icon(Icons.Default.PersonAdd, contentDescription = null, modifier = Modifier.size(17.dp))
                Spacer(Modifier.width(7.dp))
                Text(text.t("groups.members.inviteAction"), fontWeight = FontWeight.Bold)
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf(
                    Triple("members", text.t("groups.members.section.members"), members.size),
                    Triple("requests", text.t("groups.members.section.requests"), pendingRequests.size),
                    Triple("invitations", text.t("groups.members.section.invitations"), activeInvitations.size)
                ).forEach { (key, label, count) ->
                    Surface(
                        onClick = { section = key },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp),
                        color = if (section == key) GoldSurface else DeepNavy,
                        border = BorderStroke(1.dp, if (section == key) green else line)
                    ) {
                        Column(
                            modifier = Modifier.padding(horizontal = 5.dp, vertical = 8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(count.toString(), color = if (section == key) green else ink, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            Text(label, color = muted, fontSize = 8.sp, maxLines = 1)
                        }
                    }
                }
            }
        }

        when (section) {
            "requests" -> {
                if (pendingRequests.isEmpty()) {
                    GroupMembershipEmptyState(
                        icon = Icons.Default.HowToReg,
                        title = text.t("groups.requests.emptyTitle"),
                        body = text.t("groups.requests.emptyBody")
                    )
                } else {
                    pendingRequests.forEach { request ->
                        JoinRequestCard(
                            text = text,
                            request = request,
                            card = card,
                            ink = ink,
                            muted = muted,
                            green = green,
                            line = line,
                            onApprove = { onReviewJoinRequest(request, true) },
                            onReject = { onReviewJoinRequest(request, false) }
                        )
                    }
                }
            }
            "invitations" -> {
                if (activeInvitations.isEmpty()) {
                    GroupMembershipEmptyState(
                        icon = Icons.Default.MarkEmailUnread,
                        title = text.t("groups.invite.emptyTitle"),
                        body = text.t("groups.invite.emptyBody")
                    )
                } else {
                    activeInvitations.forEach { invitation ->
                        InvitationStatusCard(
                            text = text,
                            invitation = invitation,
                            card = card,
                            ink = ink,
                            muted = muted,
                            green = green,
                            line = line,
                            onRevoke = { onRevokeInvitation(invitation) }
                        )
                    }
                }
            }
            else -> {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it.take(60) },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text(text.t("groups.members.search"), color = muted, fontSize = 11.sp) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = muted) },
                    singleLine = true,
                    shape = RoundedCornerShape(AppShape.control),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = DeepNavy,
                        unfocusedContainerColor = DeepNavy,
                        focusedBorderColor = green,
                        unfocusedBorderColor = line,
                        focusedTextColor = ink,
                        unfocusedTextColor = ink,
                        cursorColor = green
                    )
                )
                if (members.isEmpty()) {
                    FormSectionCard(card = card, line = line) {
                        Text(text.groupMembersText.noMembers, fontSize = 13.sp, color = muted)
                    }
                } else if (visibleMembers.isEmpty()) {
                    Text(text.t("groups.members.searchEmpty"), fontSize = 12.sp, color = muted)
                } else {
                    visibleMembers.forEach { member ->
                        val contribution = leaderboard.firstOrNull { it.userId == member.userId }?.totalPoints ?: 0
                        val targetRank = roleRankByKey[member.role] ?: groupRoleRank(member.role)
                        MemberListItem(
                            text = text,
                            member = member,
                            contribution = contribution,
                            canManage = canManage && !member.isCurrentUser && member.role != "owner" && targetRank < currentRank,
                            card = card,
                            ink = ink,
                            muted = muted,
                            green = green,
                            line = line,
                            onManage = { onManageMember(member) },
                            onRemove = { onRemoveMember(member, false) },
                            onBlock = { onRemoveMember(member, true) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun GroupMembershipEmptyState(icon: ImageVector, title: String, body: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.card))
            .background(MidNavy)
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(7.dp)
    ) {
        Icon(icon, contentDescription = null, tint = Gold, modifier = Modifier.size(28.dp))
        Text(title, color = GoldLight, fontWeight = FontWeight.Bold, fontSize = 13.sp, textAlign = TextAlign.Center)
        Text(body, color = MutedGold, fontSize = 10.sp, lineHeight = 14.sp, textAlign = TextAlign.Center)
    }
}

@Composable
private fun JoinRequestCard(
    text: AppStrings,
    request: ReadingGroupJoinRequestRow,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(card)
            .border(1.dp, line, RoundedCornerShape(14.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(9.dp)
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
            GroupMemberAvatar(request.displayName, request.avatarUrl, green)
            Column(modifier = Modifier.weight(1f)) {
                Text(request.displayName, color = ink, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Text(text.t("groups.requests.pending"), color = green, fontSize = 10.sp)
            }
        }
        if (request.message.isNotBlank()) {
            Text(request.message, color = muted, fontSize = 11.sp, lineHeight = 15.sp)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(
                onClick = onReject,
                modifier = Modifier.weight(1f).height(38.dp),
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, DeleteRed.copy(alpha = 0.65f)),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = DeleteRed)
            ) { Text(text.t("groups.requests.reject"), fontSize = 10.sp, fontWeight = FontWeight.Bold) }
            Button(
                onClick = onApprove,
                modifier = Modifier.weight(1f).height(38.dp),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = green, contentColor = DarkNavy)
            ) { Text(text.t("groups.requests.approve"), fontSize = 10.sp, fontWeight = FontWeight.Bold) }
        }
    }
}

@Composable
private fun InvitationStatusCard(
    text: AppStrings,
    invitation: ReadingGroupInvitationRow,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    onRevoke: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(card)
            .border(1.dp, line, RoundedCornerShape(14.dp))
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(Modifier.size(40.dp).clip(CircleShape).background(GoldSurface), contentAlignment = Alignment.Center) {
            Icon(Icons.Default.Link, contentDescription = null, tint = green, modifier = Modifier.size(19.dp))
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(invitation.invitedEmail ?: text.t("groups.invite.shareable"), color = ink, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Text(text.t("groups.invite.usage", invitation.useCount, invitation.maxUses), color = muted, fontSize = 9.sp)
        }
        TextButton(onClick = onRevoke) {
            Text(text.t("groups.invite.revoke"), color = DeleteRed, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun GroupMemberAvatar(name: String, avatarUrl: String?, accent: Color, size: Dp = 42.dp) {
    Box(
        modifier = Modifier.size(size).clip(CircleShape).background(accent.copy(alpha = 0.14f)),
        contentAlignment = Alignment.Center
    ) {
        if (!avatarUrl.isNullOrBlank()) {
            AsyncImage(
                model = avatarUrl,
                contentDescription = null,
                modifier = Modifier.fillMaxSize().clip(CircleShape),
                contentScale = ContentScale.Crop
            )
        } else {
            Text(name.firstOrNull()?.uppercaseChar()?.toString().orEmpty(), color = accent, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun MemberListItem(
    text: AppStrings,
    member: ReadingGroupMemberRow,
    contribution: Int,
    canManage: Boolean,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    onManage: () -> Unit,
    onRemove: () -> Unit,
    onBlock: () -> Unit
) {
    var menuOpen by remember { mutableStateOf(false) }
    val displayName = member.displayName.ifBlank { text.groupMembersText.member }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(card)
            .border(1.dp, line, RoundedCornerShape(14.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        GroupMemberAvatar(displayName, member.avatarUrl, green)
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                Text(displayName, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ink, maxLines = 1)
                if (member.isCurrentUser) Text(text.t("groups.members.you"), color = muted, fontSize = 9.sp)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                MemberRoleBadge(text = text, role = member.role, green = green, muted = muted)
                Text("$contribution ${text.groupPointsShort}", fontSize = 10.sp, color = muted)
            }
        }
        if (canManage) {
            Box {
                IconButton(onClick = { menuOpen = true }) {
                    Icon(Icons.Default.MoreVert, contentDescription = text.groupMembersText.manageMember, tint = muted)
                }
                DropdownMenu(
                    expanded = menuOpen,
                    onDismissRequest = { menuOpen = false }
                ) {
                    DropdownMenuItem(
                        text = { Text(text.t("groups.members.changeRole"), color = ink) },
                        leadingIcon = { Icon(Icons.Default.AdminPanelSettings, contentDescription = null, tint = green) },
                        onClick = { menuOpen = false; onManage() }
                    )
                    DropdownMenuItem(
                        text = { Text(text.t("groups.members.remove"), color = ink) },
                        leadingIcon = { Icon(Icons.Default.PersonRemove, contentDescription = null, tint = DeleteRed) },
                        onClick = { menuOpen = false; onRemove() }
                    )
                    DropdownMenuItem(
                        text = { Text(text.t("groups.members.block"), color = DeleteRed) },
                        leadingIcon = { Icon(Icons.Default.Block, contentDescription = null, tint = DeleteRed) },
                        onClick = { menuOpen = false; onBlock() }
                    )
                }
            }
        }
    }
}

@Composable
private fun MemberRoleBadge(
    text: AppStrings,
    role: String,
    green: Color,
    muted: Color
) {
    val elevated = role in setOf("owner", "admin", "moderator")
    Text(
        groupRoleLabel(text, role),
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background((if (elevated) green else muted).copy(alpha = 0.1f))
            .padding(horizontal = 8.dp, vertical = 3.dp),
        color = if (elevated) green else muted,
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold
    )
}

@Composable
private fun GroupProgressTab(
    text: AppStrings,
    canShareProgress: Boolean,
    groupUnit: String,
    targetValue: Int?,
    leaderboard: List<ReadingGroupLeaderboardRow>,
    amount: String,
    onAmountChange: (String) -> Unit,
    progressUnit: String,
    onProgressUnitChange: (String) -> Unit,
    number: String,
    onNumberChange: (String) -> Unit,
    busy: Boolean,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    onShareProgress: () -> Unit,
    onRefreshLeaderboard: () -> Unit
) {
    var selectedFilter by remember { mutableStateOf("week") }
    val filters = listOf(
        "today" to text.groupProgress.today,
        "week" to text.groupProgress.week,
        "month" to text.groupProgress.month,
        "total" to text.groupProgress.total
    )

    Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
        Text(text.groupProgress.title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = ink)
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
            filters.forEach { (key, label) ->
                SettingsChoiceChip(
                    label = label,
                    selected = selectedFilter == key,
                    onClick = { selectedFilter = key },
                    modifier = Modifier.weight(1f)
                )
            }
        }
        GroupProgressCard(
            text = text,
            leaderboard = leaderboard,
            targetValue = targetValue,
            groupUnit = groupUnit,
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line,
            onRefreshLeaderboard = onRefreshLeaderboard
        )
        PersonalProgressCard(
            text = text,
            row = leaderboard.firstOrNull(),
            groupUnit = groupUnit,
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line
        )
        if (canShareProgress) AddProgressCard(
            text = text,
            groupUnit = groupUnit,
            amount = amount,
            onAmountChange = onAmountChange,
            progressUnit = progressUnit,
            onProgressUnitChange = onProgressUnitChange,
            number = number,
            onNumberChange = onNumberChange,
            busy = busy,
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line,
            onShareProgress = onShareProgress
        ) else Text(text.t("groups.error.permission"), color = muted, fontSize = 13.sp)
    }
}

@Composable
private fun GroupProgressCard(
    text: AppStrings,
    leaderboard: List<ReadingGroupLeaderboardRow>,
    targetValue: Int?,
    groupUnit: String,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    onRefreshLeaderboard: () -> Unit
) {
    val total = leaderboard.sumOf { it.totalAyahEquivalent }.toGoalUnitAmount(groupUnit)
    val hasGoal = targetValue != null && targetValue > 0
    val safeTarget = targetValue?.coerceAtLeast(1) ?: 1
    val progress = if (hasGoal) (total.toFloat() / safeTarget).coerceIn(0f, 1f) else 0f
    FormSectionCard(card = card, line = line) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(text.groupProgress.groupProgress, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
            IconButton(onClick = onRefreshLeaderboard, modifier = Modifier.size(AppComponentDefaults.minTouchTarget)) {
                Icon(Icons.Default.Refresh, contentDescription = text.groupRefresh, tint = green, modifier = Modifier.size(18.dp))
            }
        }
        Text(
            if (hasGoal) formatGoalSummary(text, GOAL_PERIOD_TOTAL, targetValue, groupUnit) else text.groupGoalText.noFixedGoalSummary,
            fontSize = 12.sp,
            color = muted
        )
        if (hasGoal) {
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier.fillMaxWidth().height(7.dp).clip(RoundedCornerShape(10.dp)),
                color = green,
                trackColor = BorderNavy
            )
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("${total.coerceAtMost(safeTarget)} / $safeTarget", fontSize = 12.sp, color = green, fontWeight = FontWeight.Bold)
                Text(formatGoalUnit(text, groupUnit, total.coerceAtLeast(1)), fontSize = 11.sp, color = muted)
            }
        } else {
            Text(text.groupGoalText.noFixedGoalSummary, fontSize = 11.sp, color = muted)
        }
    }
}

@Composable
private fun PersonalProgressCard(
    text: AppStrings,
    row: ReadingGroupLeaderboardRow?,
    groupUnit: String,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color
) {
    FormSectionCard(card = card, line = line) {
        Text(text.groupProgress.myProgress, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
        val total = row?.totalPoints ?: 0
        Text("$total ${text.points}", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = green)
        Text(row?.details ?: formatGoalUnit(text, groupUnit, total.coerceAtLeast(1)), fontSize = 11.sp, color = muted)
    }
}

@Composable
private fun AddProgressCard(
    text: AppStrings,
    groupUnit: String,
    amount: String,
    onAmountChange: (String) -> Unit,
    progressUnit: String,
    onProgressUnitChange: (String) -> Unit,
    number: String,
    onNumberChange: (String) -> Unit,
    busy: Boolean,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    onShareProgress: () -> Unit
) {
    val selectedUnit = normalizeProgressUnit(progressUnit).let {
        if (it in listOf(PROGRESS_UNIT_PAGE, PROGRESS_UNIT_HIZB, PROGRESS_UNIT_JUZ, PROGRESS_UNIT_SURAH)) it else PROGRESS_UNIT_PAGE
    }
    val referenceNumber = number.toIntOrNull() ?: 1
    val safeAmount = if (selectedUnit == PROGRESS_UNIT_PAGE) (amount.toIntOrNull() ?: 1).coerceAtLeast(1) else 1
    val preview = groupProgressPreview(selectedUnit, referenceNumber, safeAmount, text)
    FormSectionCard(card = card, line = line) {
        Text(text.groupProgress.addProgress, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
            listOf(
                PROGRESS_UNIT_PAGE to text.groupUnitOption.pages,
                PROGRESS_UNIT_HIZB to text.groupUnitOption.hizb,
                PROGRESS_UNIT_JUZ to text.groupUnitOption.juz,
                PROGRESS_UNIT_SURAH to text.groupUnitOption.surah
            ).forEach { (unit, label) ->
                SettingsChoiceChip(
                    label = label,
                    selected = selectedUnit == unit,
                    onClick = {
                        onProgressUnitChange(unit)
                        onAmountChange("1")
                        onNumberChange("1")
                    },
                    modifier = Modifier.weight(1f)
                )
            }
        }
        if (selectedUnit in listOf(PROGRESS_UNIT_SURAH, PROGRESS_UNIT_JUZ, PROGRESS_UNIT_HIZB)) {
            SettingsTextField(
                when (selectedUnit) {
                    PROGRESS_UNIT_SURAH -> text.groupSurahNumber
                    PROGRESS_UNIT_JUZ -> text.groupJuzNumber
                    else -> text.groupHizbNumber
                },
                number,
                "1",
                onNumberChange
            )
        } else {
            SettingsTextField(text.groupAmount, amount, "5", onAmountChange)
        }
        GroupProgressPreviewCard(preview = preview, text = text, ink = ink, muted = muted, green = green, line = line)
        Button(
            onClick = onShareProgress,
            enabled = !busy,
            modifier = Modifier.fillMaxWidth().height(42.dp),
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.buttonColors(containerColor = green)
        ) {
            Text(if (busy) text.groupSharing else text.groupProgress.save, color = DarkNavy, fontWeight = FontWeight.Bold)
        }
    }
}

private data class GroupProgressPreview(
    val title: String,
    val subtitle: String,
    val pages: Int,
    val points: Int,
    val details: String
)

@Composable
private fun GroupProgressPreviewCard(
    preview: GroupProgressPreview,
    text: AppStrings,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.control))
            .background(DeepNavy)
            .border(AppBorder.thin, line, RoundedCornerShape(AppShape.control))
            .padding(AppSpacing.list),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)
    ) {
        Text(preview.title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ink)
        Text(preview.subtitle, fontSize = 11.sp, color = muted)
        Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.md), modifier = Modifier.fillMaxWidth()) {
            GroupMetricPill("${preview.pages} ${text.groupUnitOption.pages}", green, Modifier.weight(1f))
            GroupMetricPill("${preview.points} ${text.groupPointsShort}", Gold, Modifier.weight(1f))
        }
        Text(preview.details, fontSize = 10.sp, color = muted)
    }
}

@Composable
private fun GroupLeaderboardStat(label: String, color: Color) {
    Text(
        label,
        modifier = Modifier
            .clip(RoundedCornerShape(AppShape.pill))
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = AppSpacing.sm, vertical = 3.dp),
        fontSize = 10.sp,
        color = color,
        fontWeight = FontWeight.Bold,
        maxLines = 1
    )
}

@Composable
private fun GroupMetricPill(label: String, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(AppShape.pill))
            .background(color.copy(alpha = 0.14f))
            .border(AppBorder.thin, color.copy(alpha = 0.45f), RoundedCornerShape(AppShape.pill))
            .padding(horizontal = AppSpacing.md, vertical = AppSpacing.sm),
        contentAlignment = Alignment.Center
    ) {
        Text(label, fontSize = 11.sp, color = color, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
    }
}

@Composable
private fun GroupFormHeader(
    title: String,
    subtitle: String,
    backLabel: String,
    ink: Color,
    muted: Color,
    accent: Color,
    onBack: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onBack) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = backLabel,
                tint = accent
            )
        }
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Text(title, fontSize = 19.sp, fontWeight = FontWeight.Bold, color = ink)
            Text(subtitle, fontSize = 12.sp, color = muted)
        }
        Spacer(modifier = Modifier.size(48.dp))
    }
}

@Composable
private fun AdminOnlyGuard(
    isAdmin: Boolean,
    text: AppStrings,
    card: Color,
    ink: Color,
    muted: Color,
    line: Color,
    content: @Composable () -> Unit
) {
    if (isAdmin) {
        content()
    } else {
        FormSectionCard(card = card, line = line) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(SubtleGoldSurface),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = muted, modifier = Modifier.size(18.dp))
                }
                Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(text.groupForm.adminOnly, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ink)
                    Text(text.groupForm.notAllowed, fontSize = 11.sp, color = muted, lineHeight = 15.sp)
                }
            }
        }
    }
}

@Composable
private fun FormSectionCard(
    card: Color,
    line: Color,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(card)
            .border(1.dp, line, RoundedCornerShape(14.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        content = content
    )
}

@Composable
private fun GroupDetailsCard(
    text: AppStrings,
    groupName: String,
    onGroupNameChange: (String) -> Unit,
    description: String,
    onDescriptionChange: (String) -> Unit,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    enabled: Boolean = true
) {
    FormSectionCard(card = card, line = line) {
        Text(text.groupForm.detailsTitle, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
        GroupFormTextField(
            label = text.groupForm.groupName,
            value = groupName,
            placeholder = text.groupForm.groupNamePlaceholder,
            onValueChange = onGroupNameChange,
            muted = muted,
            green = green,
            line = line,
            enabled = enabled,
            singleLine = true
        )
        GroupFormTextField(
            label = text.groupForm.description,
            value = description,
            placeholder = text.groupForm.descriptionPlaceholder,
            onValueChange = onDescriptionChange,
            muted = muted,
            green = green,
            line = line,
            enabled = enabled,
            singleLine = false,
            minLines = 2,
            maxLines = 3
        )
    }
}

@Composable
private fun GroupFormTextField(
    label: String,
    value: String,
    placeholder: String,
    onValueChange: (String) -> Unit,
    muted: Color,
    green: Color,
    line: Color,
    enabled: Boolean,
    singleLine: Boolean,
    minLines: Int = 1,
    maxLines: Int = 1
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, fontSize = 11.sp, color = muted, fontWeight = FontWeight.Medium)
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            enabled = enabled,
            singleLine = singleLine,
            minLines = minLines,
            maxLines = maxLines,
            placeholder = { Text(placeholder, fontSize = 12.sp, color = muted.copy(alpha = 0.72f)) },
            textStyle = LocalTextStyle.current.copy(fontSize = 13.sp, color = SoftTextGold),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(AppShape.control),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = green,
                unfocusedBorderColor = line,
                disabledBorderColor = line,
                focusedContainerColor = DeepNavy,
                unfocusedContainerColor = DeepNavy,
                disabledContainerColor = SubtleGoldSurface,
                cursorColor = green,
                focusedTextColor = SoftTextGold,
                unfocusedTextColor = SoftTextGold,
                disabledTextColor = muted
            )
        )
    }
}

@Composable
private fun GroupSettingsScreen(
    text: AppStrings,
    isAdmin: Boolean,
    canDelete: Boolean,
    groupName: String,
    onGroupNameChange: (String) -> Unit,
    description: String,
    onDescriptionChange: (String) -> Unit,
    goal: String,
    onGoalChange: (String) -> Unit,
    unit: String,
    onUnitChange: (String) -> Unit,
    goalPeriod: String,
    goalTarget: Int?,
    onGoalPeriodChange: (String) -> Unit,
    onGoalTargetChange: (Int?) -> Unit,
    privacy: String,
    onPrivacyChange: (String) -> Unit,
    groupCode: String,
    onCopyCode: () -> Unit,
    permissions: GroupMemberPermissions,
    onPermissionsChange: (GroupMemberPermissions) -> Unit,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    onShareGroup: () -> Unit,
    busy: Boolean,
    onBack: () -> Unit,
    onSubmitGroupForm: () -> Unit,
    onDeleteGroup: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        GroupFormHeader(
            title = text.groupSettingsText.title,
            subtitle = text.groupSettingsText.adminOnly,
            backLabel = text.groupForm.back,
            ink = ink,
            muted = muted,
            accent = green,
            onBack = onBack
        )
        AdminOnlyGuard(
            isAdmin = isAdmin,
            text = text,
            card = card,
            ink = ink,
            muted = muted,
            line = line
        ) {
            GroupSettingsForm(
                text = text,
                groupName = groupName,
                onGroupNameChange = onGroupNameChange,
                description = description,
                onDescriptionChange = onDescriptionChange,
                goal = goal,
                onGoalChange = onGoalChange,
                unit = unit,
                onUnitChange = onUnitChange,
                goalPeriod = goalPeriod,
                goalTarget = goalTarget,
                onGoalPeriodChange = onGoalPeriodChange,
                onGoalTargetChange = onGoalTargetChange,
                privacy = privacy,
                onPrivacyChange = onPrivacyChange,
                groupCode = groupCode,
                onCopyCode = onCopyCode,
                permissions = permissions,
                onPermissionsChange = onPermissionsChange,
                card = card,
                ink = ink,
                muted = muted,
                green = green,
                line = line,
                onShareGroup = onShareGroup,
                isOwner = isAdmin,
                canDelete = canDelete,
                busy = busy,
                onSubmitGroupForm = onSubmitGroupForm,
                onDeleteGroup = onDeleteGroup
            )
        }
    }
}

@Composable
private fun GroupSettingsForm(
    text: AppStrings,
    groupName: String,
    onGroupNameChange: (String) -> Unit,
    description: String,
    onDescriptionChange: (String) -> Unit,
    goal: String,
    onGoalChange: (String) -> Unit,
    unit: String,
    onUnitChange: (String) -> Unit,
    goalPeriod: String,
    goalTarget: Int?,
    onGoalPeriodChange: (String) -> Unit,
    onGoalTargetChange: (Int?) -> Unit,
    privacy: String,
    onPrivacyChange: (String) -> Unit,
    groupCode: String,
    onCopyCode: () -> Unit,
    permissions: GroupMemberPermissions,
    onPermissionsChange: (GroupMemberPermissions) -> Unit,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    onShareGroup: () -> Unit,
    isOwner: Boolean,
    canDelete: Boolean,
    busy: Boolean,
    onSubmitGroupForm: () -> Unit,
    onDeleteGroup: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        GroupDetailsCard(
            text = text,
            groupName = groupName,
            onGroupNameChange = if (isOwner) onGroupNameChange else { _ -> },
            description = description,
            onDescriptionChange = if (isOwner) onDescriptionChange else { _ -> },
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line,
            enabled = isOwner
        )
        GroupTypeSelector(
            text = text,
            selected = goal,
            onSelected = if (isOwner) onGoalChange else { _ -> },
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line,
            enabled = isOwner
        )
        ProgressUnitSelector(
            text = text,
            selected = unit,
            onSelected = if (isOwner) onUnitChange else { _ -> },
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line,
            enabled = isOwner
        )
        GroupGoalCard(
            text = text,
            goalPeriod = goalPeriod,
            goalTarget = goalTarget,
            progressUnit = unit,
            onGoalPeriodChange = if (isOwner) onGoalPeriodChange else { _ -> },
            onGoalTargetChange = if (isOwner) onGoalTargetChange else { _ -> },
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line,
            enabled = isOwner
        )
        PrivacyAccessCard(
            text = text,
            selectedPrivacy = privacy,
            onPrivacyChange = if (isOwner) onPrivacyChange else { _ -> },
            groupCode = groupCode,
            onCopyCode = onCopyCode,
            onShareGroup = onShareGroup,
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line,
            enabled = isOwner
        )
        MemberPermissionsCard(
            text = text,
            permissions = permissions,
            onPermissionsChange = if (isOwner) onPermissionsChange else { _ -> },
            card = card,
            ink = ink,
            muted = muted,
            green = green,
            line = line,
            enabled = isOwner
        )
        FormSectionCard(card = card, line = line) {
            if (isOwner) {
                GroupPrimaryActionButton(
                    label = text.groupSettingsText.saveButton,
                    loadingLabel = text.groupForm.saving,
                    busy = busy,
                    green = green,
                    onClick = onSubmitGroupForm
                )
            }
        }
        if (canDelete) {
            GroupDangerZone(
                text = text,
                groupName = groupName,
                card = card,
                muted = muted,
                busy = busy,
                onDeleteGroup = onDeleteGroup
            )
        }
    }
}

@Composable
private fun GroupDangerZone(
    text: AppStrings,
    groupName: String,
    card: Color,
    muted: Color,
    busy: Boolean,
    onDeleteGroup: () -> Unit
) {
    var showConfirmation by rememberSaveable { mutableStateOf(false) }

    FormSectionCard(
        card = card,
        line = DeleteRed.copy(alpha = 0.55f)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(11.dp))
                    .background(DeleteRed.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.DeleteForever,
                    contentDescription = null,
                    tint = DeleteRed,
                    modifier = Modifier.size(20.dp)
                )
            }
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(3.dp)
            ) {
                Text(
                    text.t("groups.delete.dangerTitle"),
                    color = DeleteRed,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text.t("groups.delete.dangerBody"),
                    color = muted,
                    fontSize = 11.sp,
                    lineHeight = 15.sp
                )
            }
        }
        OutlinedButton(
            onClick = { showConfirmation = true },
            enabled = !busy,
            modifier = Modifier.fillMaxWidth().height(46.dp),
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, DeleteRed),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = DeleteRed)
        ) {
            Icon(Icons.Default.DeleteOutline, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(7.dp))
            Text(text.t("groups.delete.action"), fontWeight = FontWeight.Bold)
        }
    }

    if (showConfirmation) {
        AlertDialog(
            onDismissRequest = { if (!busy) showConfirmation = false },
            containerColor = card,
            icon = {
                Icon(Icons.Default.WarningAmber, contentDescription = null, tint = DeleteRed)
            },
            title = {
                Text(
                    text.t("groups.delete.confirmTitle"),
                    color = SoftTextGold,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text.t("groups.delete.confirmBody", groupName),
                    color = muted,
                    lineHeight = 19.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showConfirmation = false
                        onDeleteGroup()
                    },
                    enabled = !busy,
                    colors = ButtonDefaults.buttonColors(containerColor = DeleteRed),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(
                        text.t("groups.delete.confirmAction"),
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showConfirmation = false },
                    enabled = !busy
                ) {
                    Text(text.t("common.cancel"), color = SoftTextGold)
                }
            }
        )
    }
}

@Composable
private fun GroupPrimaryActionButton(
    label: String,
    loadingLabel: String,
    busy: Boolean,
    enabled: Boolean = true,
    green: Color,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        enabled = enabled && !busy,
        modifier = Modifier.fillMaxWidth().height(46.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(containerColor = green)
    ) {
        if (busy) {
            CircularProgressIndicator(
                modifier = Modifier.size(16.dp),
                strokeWidth = 2.dp,
                color = DarkNavy
            )
            Spacer(Modifier.width(8.dp))
        }
        Text(
            if (busy) loadingLabel else label,
            color = DarkNavy,
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp
        )
    }
}

@Composable
private fun GroupLeaderboardSection(
    text: AppStrings,
    leaderboard: List<ReadingGroupLeaderboardRow>,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    onRefresh: () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(card).border(1.dp, line, RoundedCornerShape(14.dp)).padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(text.groupTopContributors, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
            TextButton(onClick = onRefresh) { Text(text.groupRefresh, color = green) }
        }
        if (leaderboard.isEmpty()) {
            Text(text.groupNoLeaderboardLoaded, fontSize = 12.sp, color = muted)
        } else {
            leaderboard.forEachIndexed { index, row -> GroupLeaderboardRow(text, index + 1, row) }
        }
    }
}

@Composable
private fun GroupNoActivityCard(text: AppStrings, card: Color, ink: Color, muted: Color, line: Color, onRefresh: () -> Unit) {
    Column(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(card).border(1.dp, line, RoundedCornerShape(14.dp)).padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(text.groupFeedEmptyTitle, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
        Text(text.groupNoActivityBody, fontSize = 12.sp, color = muted)
        TextButton(onClick = onRefresh) { Text(text.groupRefresh) }
    }
}

@Composable
private fun GroupTypeSelector(
    text: AppStrings,
    selected: String,
    onSelected: (String) -> Unit,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    enabled: Boolean = true
) {
    val selectedValue = normalizeGroupType(selected)
    FormSectionCard(card = card, line = line) {
        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(text.groupForm.groupTypeTitle, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
            Text(text.groupForm.groupTypeSubtitle, fontSize = 11.sp, color = muted, lineHeight = 15.sp)
        }
        GroupTypeOptions.chunked(2).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                row.forEach { option ->
                    SelectionOptionCard(
                        option = option,
                        text = text,
                        selected = selectedValue == option.value,
                        enabled = enabled,
                        green = green,
                        muted = muted,
                        line = line,
                        onSelected = onSelected,
                        modifier = Modifier.weight(1f)
                    )
                }
                if (row.size == 1) Spacer(modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun ProgressUnitSelector(
    text: AppStrings,
    selected: String,
    onSelected: (String) -> Unit,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    enabled: Boolean = true
) {
    val selectedValue = normalizeProgressUnit(selected)
    FormSectionCard(card = card, line = line) {
        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(text.groupForm.progressUnitTitle, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
            Text(text.groupForm.progressUnitSubtitle, fontSize = 11.sp, color = muted, lineHeight = 15.sp)
        }
        ProgressUnitOptions.chunked(2).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                row.forEach { option ->
                    SelectionOptionCard(
                        option = option,
                        text = text,
                        selected = selectedValue == option.value,
                        enabled = enabled,
                        green = green,
                        muted = muted,
                        line = line,
                        onSelected = onSelected,
                        modifier = Modifier.weight(1f)
                    )
                }
                if (row.size == 1) Spacer(modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun GroupGoalCard(
    text: AppStrings,
    goalPeriod: String,
    goalTarget: Int?,
    progressUnit: String,
    onGoalPeriodChange: (String) -> Unit,
    onGoalTargetChange: (Int?) -> Unit,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    enabled: Boolean = true
) {
    val normalizedPeriod = normalizeGoalPeriod(goalPeriod)
    val hasFixedGoal = normalizedPeriod != GOAL_PERIOD_NONE
    FormSectionCard(card = card, line = line) {
        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(text.groupForm.goalTitle, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
            Text(text.groupForm.goalSubtitle, fontSize = 11.sp, color = muted, lineHeight = 15.sp)
        }
        GoalPeriodSelector(
            text = text,
            selected = normalizedPeriod,
            onSelected = onGoalPeriodChange,
            green = green,
            muted = muted,
            line = line,
            enabled = enabled
        )
        if (hasFixedGoal) {
            GoalValueInput(
                text = text,
                value = goalTarget,
                progressUnit = progressUnit,
                goalPeriod = normalizedPeriod,
                onValueChange = onGoalTargetChange,
                green = green,
                ink = ink,
                muted = muted,
                line = line,
                enabled = enabled
            )
        }
        GoalSummary(
            text = text,
            goalPeriod = normalizedPeriod,
            goalTarget = goalTarget,
            progressUnit = progressUnit,
            green = green,
            muted = muted
        )
    }
}

@Composable
private fun PrivacyAccessCard(
    text: AppStrings,
    selectedPrivacy: String,
    onPrivacyChange: (String) -> Unit,
    groupCode: String,
    onCopyCode: () -> Unit,
    onShareGroup: () -> Unit,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    enabled: Boolean = true
) {
    val normalizedPrivacy = normalizeGroupPrivacy(selectedPrivacy)
    val hasCode = groupCode.isNotBlank()
    FormSectionCard(card = card, line = line) {
        Text(text.groupForm.privacyTitle, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
        GroupPrivacyOptions.forEach { option ->
            SelectionOptionCard(
                option = option,
                text = text,
                selected = normalizedPrivacy == option.value,
                enabled = enabled,
                green = green,
                muted = muted,
                line = line,
                onSelected = onPrivacyChange,
                modifier = Modifier.fillMaxWidth()
            )
        }
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(text.groupForm.groupCode, fontSize = 11.sp, color = muted, fontWeight = FontWeight.Bold)
            Text(
                if (hasCode) groupCode else text.groupForm.codeAvailableAfterSave,
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(DeepNavy)
                    .border(1.dp, line, RoundedCornerShape(10.dp))
                    .padding(10.dp),
                fontSize = if (hasCode) 14.sp else 11.sp,
                color = if (hasCode) ink else muted,
                fontWeight = if (hasCode) FontWeight.Bold else FontWeight.Medium,
                lineHeight = 15.sp
            )
        }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(
                onClick = onCopyCode,
                enabled = hasCode,
                modifier = Modifier.weight(1f).height(40.dp),
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, line),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = green)
            ) {
                Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text(text.groupForm.copyCode, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
            Button(
                onClick = onShareGroup,
                enabled = hasCode,
                modifier = Modifier.weight(1f).height(40.dp),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = green)
            ) {
                Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp), tint = DarkNavy)
                Spacer(Modifier.width(6.dp))
                Text(text.groupForm.shareGroup, color = DarkNavy, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun MemberPermissionsCard(
    text: AppStrings,
    permissions: GroupMemberPermissions,
    onPermissionsChange: (GroupMemberPermissions) -> Unit,
    card: Color,
    ink: Color,
    muted: Color,
    green: Color,
    line: Color,
    enabled: Boolean = true
) {
    FormSectionCard(card = card, line = line) {
        Text(text.groupForm.permissionsTitle, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ink)
        MemberPermissionOptions.forEach { option ->
            val checked = option.isChecked(permissions)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (checked) GoldSurface else DeepNavy)
                    .border(1.dp, if (checked) green else line, RoundedCornerShape(10.dp))
                    .padding(horizontal = 10.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    option.label(text),
                    modifier = Modifier.weight(1f),
                    fontSize = 12.sp,
                    color = if (checked) green else muted,
                    fontWeight = if (checked) FontWeight.Bold else FontWeight.Medium,
                    lineHeight = 15.sp
                )
                Switch(
                    checked = checked,
                    onCheckedChange = { onPermissionsChange(option.update(permissions, it)) },
                    enabled = enabled,
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = AppColor.surfaceAlt,
                        checkedTrackColor = green,
                        uncheckedThumbColor = AppColor.surfaceAlt,
                        uncheckedTrackColor = line,
                        disabledCheckedThumbColor = AppColor.surfaceAlt.copy(alpha = 0.7f),
                        disabledCheckedTrackColor = green.copy(alpha = 0.45f),
                        disabledUncheckedThumbColor = AppColor.surfaceAlt.copy(alpha = 0.7f),
                        disabledUncheckedTrackColor = line.copy(alpha = 0.65f)
                    )
                )
            }
        }
    }
}

@Composable
private fun GoalPeriodSelector(
    text: AppStrings,
    selected: String,
    onSelected: (String) -> Unit,
    green: Color,
    muted: Color,
    line: Color,
    enabled: Boolean
) {
    Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
        Text(text.groupForm.goalPeriod, fontSize = 11.sp, color = muted, fontWeight = FontWeight.Bold)
        GoalPeriodOptions.chunked(2).forEach { row ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { option ->
                    SelectionOptionCard(
                        option = option,
                        text = text,
                        selected = selected == option.value,
                        enabled = enabled,
                        green = green,
                        muted = muted,
                        line = line,
                        onSelected = onSelected,
                        modifier = Modifier.weight(1f)
                    )
                }
                if (row.size == 1) Spacer(modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun GoalValueInput(
    text: AppStrings,
    value: Int?,
    progressUnit: String,
    goalPeriod: String,
    onValueChange: (Int?) -> Unit,
    green: Color,
    ink: Color,
    muted: Color,
    line: Color,
    enabled: Boolean
) {
    val currentValue = value ?: 1
    Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
        Text(text.groupForm.goalValue, fontSize = 11.sp, color = muted, fontWeight = FontWeight.Bold)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(DeepNavy)
                .border(1.dp, line, RoundedCornerShape(12.dp))
                .padding(6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            IconButton(
                onClick = { onValueChange((currentValue - 1).coerceAtLeast(1)) },
                enabled = enabled && currentValue > 1,
                modifier = Modifier.size(AppComponentDefaults.minTouchTarget)
            ) {
                Icon(Icons.Default.Remove, contentDescription = null, tint = if (enabled) green else muted)
            }
            OutlinedTextField(
                value = value?.toString().orEmpty(),
                onValueChange = { input ->
                    val number = input.filter { it.isDigit() }.take(4).toIntOrNull()
                    onValueChange(number)
                },
                enabled = enabled,
                singleLine = true,
                modifier = Modifier.weight(1f).heightIn(min = 48.dp),
                textStyle = LocalTextStyle.current.copy(textAlign = TextAlign.Center, fontWeight = FontWeight.Bold, color = ink),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = green,
                    unfocusedBorderColor = Color.Transparent,
                    disabledBorderColor = Color.Transparent,
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent,
                    disabledContainerColor = Color.Transparent,
                    cursorColor = green
                )
            )
            IconButton(
                onClick = { onValueChange((currentValue + 1).coerceAtMost(9999)) },
                enabled = enabled,
                modifier = Modifier.size(AppComponentDefaults.minTouchTarget)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = if (enabled) green else muted)
            }
        }
        Text(
            "${formatGoalUnit(text, progressUnit, currentValue)} ${goalPeriodPhrase(text, goalPeriod)}",
            fontSize = 11.sp,
            color = muted
        )
    }
}

@Composable
private fun GoalSummary(
    text: AppStrings,
    goalPeriod: String,
    goalTarget: Int?,
    progressUnit: String,
    green: Color,
    muted: Color
) {
    val summary = formatGoalSummary(text, goalPeriod, goalTarget, progressUnit)
    val isFixed = normalizeGoalPeriod(goalPeriod) != GOAL_PERIOD_NONE
    Text(
        summary,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(if (isFixed) GoldSurface else SubtleGoldSurface)
            .padding(10.dp),
        fontSize = 11.sp,
        color = if (isFixed) green else muted,
        fontWeight = if (isFixed) FontWeight.Bold else FontWeight.Medium,
        lineHeight = 15.sp
    )
}

@Composable
private fun SelectionOptionCard(
    option: SelectorOption,
    text: AppStrings,
    selected: Boolean,
    enabled: Boolean,
    green: Color,
    muted: Color,
    line: Color,
    onSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val borderColor = if (selected) green else line
    val backgroundColor = when {
        selected -> GoldSurface
        enabled -> DeepNavy
        else -> SubtleGoldSurface
    }
    val contentColor = if (selected) green else muted

    Row(
        modifier = modifier
            .heightIn(min = 46.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(backgroundColor)
            .border(1.dp, borderColor, RoundedCornerShape(10.dp))
            .clickable(enabled = enabled) { onSelected(option.value) }
            .padding(horizontal = 9.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(option.icon, contentDescription = null, tint = contentColor, modifier = Modifier.size(17.dp))
        Text(
            option.label(text),
            modifier = Modifier.weight(1f),
            fontSize = 11.sp,
            color = contentColor,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
            lineHeight = 14.sp
        )
        if (selected) {
            Icon(Icons.Default.Check, contentDescription = null, tint = green, modifier = Modifier.size(15.dp))
        }
    }
}

@Composable
private fun GroupUnitChips(text: AppStrings, selected: String, onSelected: (String) -> Unit) {
    val selectedValue = normalizeProgressUnit(selected)
    ProgressUnitOptions.chunked(3).forEach { row ->
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
            row.forEach { option ->
                SettingsChoiceChip(
                    label = option.label(text),
                    selected = selectedValue == option.value,
                    onClick = { onSelected(option.value) },
                    modifier = Modifier.weight(1f)
                )
            }
            repeat(3 - row.size) {
                Spacer(Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun GroupBadge(label: String, color: Color) {
    Text(
        label,
        modifier = Modifier.clip(RoundedCornerShape(999.dp)).background(color.copy(alpha = 0.09f)).padding(horizontal = 8.dp, vertical = 4.dp),
        fontSize = 10.sp,
        color = color,
        maxLines = 1
    )
}

private fun groupGoalTypeLabel(text: AppStrings, goal: String): String =
    GroupTypeOptions.firstOrNull { it.value == normalizeGroupType(goal) }?.label?.invoke(text)
        ?: text.groupType.freeReading

@Composable
internal fun GroupLeaderboardRow(text: AppStrings, rank: Int, row: ReadingGroupLeaderboardRow) {
    var showReading by remember(row.userId) { mutableStateOf(false) }
    if (showReading) GroupMemberReadingSheet(text, row) { showReading = false }
    val rankColor = when (rank) {
        1 -> Gold
        2 -> ReadBlue
        3 -> DoneGreen
        else -> MutedGold
    }
    val initial = profileAvatarInitial(row.label)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.control))
            .background(if (rank <= 3) StrongGoldSurface else PeriodItemSurface)
            .clickable { showReading = true }
            .border(1.dp, if (rank <= 3) Gold.copy(alpha = 0.35f) else BorderNavy, RoundedCornerShape(AppShape.control))
            .padding(AppSpacing.md),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)
    ) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(CircleShape)
                .background(rankColor.copy(alpha = 0.18f))
                .border(AppBorder.thin, rankColor.copy(alpha = 0.45f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text(rank.toString(), fontSize = 13.sp, fontWeight = FontWeight.ExtraBold, color = rankColor)
        }
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(GoldSurface)
                .border(AppBorder.thin, Gold.copy(alpha = 0.35f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            if (row.avatarUrl.isNullOrBlank()) {
                Text(initial, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = GoldLight)
            } else {
                AsyncImage(
                    model = row.avatarUrl,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            }
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(row.label, modifier = Modifier.weight(1f), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = GoldLight, maxLines = 1)
                Text("${row.totalPoints} ${text.groupPointsShort}", fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, color = Gold)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
                GroupLeaderboardStat("${row.streak} ${text.streak.lowercase()}", DoneGreen)
                GroupLeaderboardStat("${row.pages} ${text.groupUnitOption.pages}", ReadBlue)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
                GroupLeaderboardStat("${row.juz} ${text.groupUnitOption.juzs}", Gold)
                GroupLeaderboardStat("${row.hizb} ${text.groupUnitOption.hizbs}", MutedGold)
                GroupLeaderboardStat("${row.surah} ${text.groupUnitOption.surahs}", ReadBlue)
            }
        }
    }
}

@Composable
internal fun FeedPostCard(
    text: AppStrings,
    item: ReadingGroupFeedItem,
    currentRole: String,
    replyDraft: String = "",
    replyOpen: Boolean = false,
    canComment: Boolean = true,
    busy: Boolean = false,
    onReact: (String) -> Unit = {},
    onEdit: () -> Unit = {},
    onTogglePin: () -> Unit = {},
    onDelete: () -> Unit = {},
    onReport: () -> Unit = {},
    onDeleteComment: (ReadingGroupCommentItem) -> Unit = {},
    onToggleReply: () -> Unit = {},
    onReplyDraftChange: (String) -> Unit = {},
    onSubmitReply: () -> Unit = {}
) {
    val isProgress = item.type == "progress"
    val isMedia = item.type == "media"
    val avatarColor = when {
        isProgress -> DoneGreen
        isMedia -> ReadBlue
        else -> Gold
    }
    val canModerate = groupRoleCanModerateContent(currentRole)
    val canPin = groupRoleCanPinPosts(currentRole)
    val canEdit = item.isMine && !isProgress && !isMedia
    val canDelete = item.isMine || canModerate
    var menuExpanded by remember(item.id) { mutableStateOf(false) }
    val context = LocalContext.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 4.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.md)
    ) {
        Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            GroupMemberAvatar(
                name = item.displayName.ifBlank { text.groupHeaderGroup },
                avatarUrl = item.avatarUrl,
                accent = avatarColor,
                size = 38.dp
            )
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        item.displayName,
                        modifier = Modifier.weight(1f, fill = false),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = GoldLight,
                        maxLines = 1
                    )
                    if (item.isPinned) {
                        Icon(Icons.Default.PushPin, contentDescription = text.t("groups.detail.pinned"), tint = Gold, modifier = Modifier.size(13.dp))
                    }
                }
                Text(
                    listOfNotNull(feedTimestamp(item.createdAt, text.localeCode),
                        text.t("groups.feed.edited").takeIf { !item.editedAt.isNullOrBlank() })
                        .joinToString(" · "),
                    fontSize = 11.sp, color = Color(0xFFABB6C5)
                )
                if (isProgress && item.amount != null && item.unit != null) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.AutoMirrored.Filled.MenuBook, contentDescription = null, tint = Gold, modifier = Modifier.size(13.dp))
                        Text(
                            "${item.amount} ${groupUnitLabel(item.unit, item.amount)}",
                            fontSize = 11.sp,
                            color = MutedGold
                        )
                    }
                }
            }
            Box {
                IconButton(onClick = { menuExpanded = true }, modifier = Modifier.size(48.dp)) {
                    Icon(
                        Icons.Default.MoreHoriz,
                        contentDescription = text.t("groups.feed.moreActions"),
                        tint = MutedGold,
                        modifier = Modifier.size(19.dp)
                    )
                }
                DropdownMenu(expanded = menuExpanded, onDismissRequest = { menuExpanded = false }) {
                    if (canEdit) {
                        GroupPostMenuItem(Icons.Default.Edit, text.t("groups.feed.edit.action")) {
                            menuExpanded = false
                            onEdit()
                        }
                    }
                    if (canPin) {
                        GroupPostMenuItem(
                            if (item.isPinned) Icons.Default.PushPin else Icons.Default.PushPin,
                            text.t(if (item.isPinned) "groups.feed.unpin.action" else "groups.feed.pin.action")
                        ) {
                            menuExpanded = false
                            onTogglePin()
                        }
                    }
                    if (!item.isMine) {
                        GroupPostMenuItem(Icons.Default.Flag, text.t("groups.feed.report.action")) {
                            menuExpanded = false
                            onReport()
                        }
                    }
                    if (canDelete) {
                        GroupPostMenuItem(Icons.Default.DeleteOutline, text.t("groups.feed.delete.action"), DeleteRed) {
                            menuExpanded = false
                            onDelete()
                        }
                    }
                }
            }
        }
        if (item.message.isNotBlank()) {
            var expanded by remember(item.id, item.message) { mutableStateOf(false) }
            var overflows by remember(item.id, item.message) { mutableStateOf(false) }
            Text(
                item.message, fontSize = 15.sp, lineHeight = 23.sp, color = SoftTextGold,
                maxLines = if (expanded) Int.MAX_VALUE else 6,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                onTextLayout = { if (!expanded) overflows = it.hasVisualOverflow }
            )
            if (overflows || expanded) TextButton(onClick = { expanded = !expanded }) {
                Text(text.t(if (expanded) "groups.feed.readLess" else "groups.feed.readMore"), color = Gold)
            }
        }
        if (isMedia && !item.mediaUrl.isNullOrBlank()) {
            AsyncImage(
                model = item.mediaUrl,
                contentDescription = item.mediaFileName ?: text.t("groups.media.title"),
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 180.dp, max = 320.dp)
                    .clip(RoundedCornerShape(AppShape.control))
                    .background(DeepNavy),
                contentScale = ContentScale.Crop
            )
        }
        FeedActions(
            text = text,
            myReaction = item.myReaction,
            reactionCounts = item.reactionCounts,
            commentCount = item.commentCount,
            onReact = onReact,
            onToggleReply = onToggleReply,
            onShare = {
                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, "${item.displayName}\n\n${item.message}")
                }
                context.startActivity(Intent.createChooser(shareIntent, text.t("groups.feed.share")))
            }
        )
        HorizontalDivider(color = BorderNavy.copy(alpha = 0.6f), thickness = AppBorder.hairline)
    }
    if (replyOpen) GroupCommentsSheet(
        text = text, post = item, draft = replyDraft, canComment = canComment,
        canModerate = canModerate, busy = busy, onDismiss = onToggleReply,
        onDraftChange = onReplyDraftChange, onSubmit = onSubmitReply, onDelete = onDeleteComment
    )
}

@Composable
private fun FeedActions(
    text: AppStrings,
    myReaction: String?,
    reactionCounts: Map<String, Int>,
    commentCount: Int,
    onReact: (String) -> Unit,
    onToggleReply: () -> Unit,
    onShare: () -> Unit
) {
    var reactionsExpanded by remember { mutableStateOf(false) }
    val totalReactions = reactionCounts.values.sum()
    val reactionColor = if (myReaction == null) MutedGold else groupReactionColor(myReaction)
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(18.dp)) {
            Box {
                Row(
                    modifier = Modifier.heightIn(min = 48.dp).clickable { reactionsExpanded = true }.padding(horizontal = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        groupReactionIcon(myReaction),
                        contentDescription = text.t("groups.feed.reactions"),
                        tint = reactionColor,
                        modifier = Modifier.size(17.dp)
                    )
                    Text(
                        if (totalReactions > 0) dailyGoalNumber(totalReactions, text.localeCode) else text.t("groups.feed.appreciate"),
                        fontSize = 11.sp,
                        color = reactionColor
                    )
                }
                DropdownMenu(expanded = reactionsExpanded, onDismissRequest = { reactionsExpanded = false }) {
                    listOf("like", "love", "dua", "insightful").forEach { reaction ->
                        DropdownMenuItem(
                            text = {
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        groupReactionIcon(reaction),
                                        contentDescription = null,
                                        tint = groupReactionColor(reaction),
                                        modifier = Modifier.size(19.dp)
                                    )
                                    Text(groupReactionLabel(text, reaction))
                                    val count = reactionCounts[reaction] ?: 0
                                    if (count > 0) Text(count.toString(), color = MutedGold, fontSize = 10.sp)
                                }
                            },
                            trailingIcon = if (myReaction == reaction) {
                                { Icon(Icons.Default.Check, contentDescription = null, tint = DoneGreen) }
                            } else null,
                            onClick = {
                                reactionsExpanded = false
                                onReact(reaction)
                            }
                        )
                    }
                }
            }
            Row(
                modifier = Modifier.heightIn(min = 48.dp).clickable { onToggleReply() }.padding(horizontal = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(
                    Icons.Default.ChatBubbleOutline,
                    contentDescription = text.groupFeed.reply,
                    tint = MutedGold,
                    modifier = Modifier.size(16.dp)
                )
                Text(feedCommentLabel(text, commentCount), fontSize = 11.sp, color = Color(0xFFABB6C5))
            }
        }
        IconButton(onClick = onShare, modifier = Modifier.size(48.dp)) {
            Icon(Icons.AutoMirrored.Filled.Reply, contentDescription = text.t("groups.feed.share"), tint = MutedGold,
                modifier = Modifier.size(20.dp).graphicsLayer(scaleX = -1f))
        }
    }
}

@Composable
private fun GroupPostMenuItem(
    icon: ImageVector,
    label: String,
    color: Color = SoftTextGold,
    onClick: () -> Unit
) {
    DropdownMenuItem(
        text = { Text(label, color = color, fontSize = 12.sp) },
        leadingIcon = { Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(18.dp)) },
        onClick = onClick
    )
}

private fun groupRoleCanModerateContent(role: String): Boolean =
    role.lowercase() in setOf("owner", "admin", "moderator")

private fun groupRoleCanPinPosts(role: String): Boolean = groupRoleCanModerateContent(role)

private fun groupReactionIcon(reaction: String?): ImageVector = when (reaction) {
    "love" -> Icons.Default.Favorite
    "dua" -> Icons.Default.VolunteerActivism
    "insightful" -> Icons.Default.Lightbulb
    else -> Icons.Default.ThumbUp
}

private fun groupReactionColor(reaction: String): Color = when (reaction) {
    "love" -> DeleteRed
    "dua" -> DoneGreen
    "insightful" -> Gold
    else -> ReadBlue
}

private fun groupReactionLabel(text: AppStrings, reaction: String): String =
    text.t("groups.feed.reaction.$reaction")

@Composable
private fun MemberRoleDialog(
    text: AppStrings,
    member: ReadingGroupMemberRow,
    roles: List<ReadingGroupRoleRow>,
    selectedRole: String,
    onRoleSelected: (String) -> Unit,
    busy: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        icon = { Icon(Icons.Default.AdminPanelSettings, contentDescription = null, tint = Gold) },
        title = { Text(text.t("groups.members.roleTitle"), color = GoldLight, fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
                Text(text.t("groups.members.roleBody", member.displayName), color = MutedGold, fontSize = 11.sp)
                roles.forEach { role ->
                    Surface(
                        onClick = { onRoleSelected(role.key) },
                        shape = RoundedCornerShape(11.dp),
                        color = if (selectedRole == role.key) GoldSurface else DeepNavy,
                        border = BorderStroke(1.dp, if (selectedRole == role.key) Gold else BorderNavy)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = selectedRole == role.key,
                                onClick = { onRoleSelected(role.key) },
                                colors = RadioButtonDefaults.colors(selectedColor = Gold, unselectedColor = MutedGold)
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(groupRoleLabel(text, role.key), color = GoldLight, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Text(text.t("groups.members.role.${role.key}.hint"), color = MutedGold, fontSize = 9.sp)
                            }
                        }
                    }
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !busy) { Text(text.t("common.cancel"), color = MutedGold) }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !busy && selectedRole != member.role && roles.any { it.key == selectedRole },
                colors = ButtonDefaults.buttonColors(containerColor = Gold),
                shape = RoundedCornerShape(AppShape.control)
            ) {
                if (busy) {
                    CircularProgressIndicator(modifier = Modifier.size(15.dp), strokeWidth = 2.dp, color = DarkNavy)
                    Spacer(Modifier.width(7.dp))
                }
                Text(text.t("groups.members.roleConfirm"), color = DarkNavy, fontWeight = FontWeight.Bold)
            }
        }
    )
}

@Composable
private fun RemoveGroupMemberDialog(
    text: AppStrings,
    member: ReadingGroupMemberRow,
    block: Boolean,
    onBlockChange: (Boolean) -> Unit,
    busy: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        icon = { Icon(Icons.Default.PersonRemove, contentDescription = null, tint = DeleteRed) },
        title = { Text(text.t("groups.members.removeTitle"), color = GoldLight, fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(text.t("groups.members.removeBody", member.displayName), color = MutedGold, fontSize = 12.sp, lineHeight = 17.sp)
                Row(
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(11.dp)).background(DeleteSurface).padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(9.dp)
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text.t("groups.members.blockToggle"), color = GoldLight, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Text(text.t("groups.members.blockHint"), color = MutedGold, fontSize = 9.sp, lineHeight = 13.sp)
                    }
                    Switch(
                        checked = block,
                        onCheckedChange = onBlockChange,
                        colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = DeleteRed)
                    )
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !busy) { Text(text.t("common.cancel"), color = MutedGold) }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !busy,
                colors = ButtonDefaults.buttonColors(containerColor = DeleteRed),
                shape = RoundedCornerShape(AppShape.control)
            ) {
                if (busy) {
                    CircularProgressIndicator(modifier = Modifier.size(15.dp), strokeWidth = 2.dp, color = Color.White)
                    Spacer(Modifier.width(7.dp))
                }
                Text(text.t(if (block) "groups.members.blockConfirm" else "groups.members.removeConfirm"), color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    )
}

@Composable
private fun GroupInvitationManagerDialog(
    text: AppStrings,
    email: String,
    onEmailChange: (String) -> Unit,
    expiresDays: Int,
    onExpiresDaysChange: (Int) -> Unit,
    createdInvitation: ReadingGroupInvitationRow?,
    invitations: List<ReadingGroupInvitationRow>,
    busy: Boolean,
    onCreate: () -> Unit,
    onCopy: (ReadingGroupInvitationRow) -> Unit,
    onShare: (ReadingGroupInvitationRow) -> Unit,
    onRevoke: (ReadingGroupInvitationRow) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        icon = { Icon(Icons.Default.PersonAdd, contentDescription = null, tint = Gold) },
        title = { Text(text.t("groups.invite.title"), color = GoldLight, fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.heightIn(max = 450.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(text.t("groups.invite.body"), color = MutedGold, fontSize = 11.sp, lineHeight = 16.sp)
                OutlinedTextField(
                    value = email,
                    onValueChange = onEmailChange,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(text.t("groups.invite.email")) },
                    placeholder = { Text(text.t("groups.invite.emailHint"), fontSize = 10.sp) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    shape = RoundedCornerShape(AppShape.control),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Gold,
                        unfocusedBorderColor = BorderNavy,
                        focusedTextColor = SoftTextGold,
                        unfocusedTextColor = SoftTextGold,
                        cursorColor = Gold
                    )
                )
                Text(text.t("groups.invite.expires"), color = GoldLight, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    listOf(1, 7, 30).forEach { days ->
                        FilterChip(
                            selected = expiresDays == days,
                            onClick = { onExpiresDaysChange(days) },
                            label = { Text(text.t("groups.invite.days", days), fontSize = 10.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = GoldSurface,
                                selectedLabelColor = Gold,
                                labelColor = MutedGold
                            ),
                            border = FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = expiresDays == days,
                                borderColor = BorderNavy,
                                selectedBorderColor = Gold
                            )
                        )
                    }
                }
                Button(
                    onClick = onCreate,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth().height(42.dp),
                    shape = RoundedCornerShape(AppShape.control),
                    colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = DarkNavy)
                ) {
                    if (busy) {
                        CircularProgressIndicator(modifier = Modifier.size(15.dp), strokeWidth = 2.dp, color = DarkNavy)
                        Spacer(Modifier.width(7.dp))
                    }
                    Text(text.t("groups.invite.create"), fontWeight = FontWeight.Bold)
                }
                createdInvitation?.let { invitation ->
                    Column(
                        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(GoldSurface).border(1.dp, Gold, RoundedCornerShape(12.dp)).padding(11.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(7.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Gold, modifier = Modifier.size(17.dp))
                            Text(text.t("groups.invite.ready"), color = GoldLight, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                        }
                        Text(text.t("groups.invite.tokenOnce"), color = MutedGold, fontSize = 9.sp, lineHeight = 13.sp)
                        Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                            OutlinedButton(
                                onClick = { onCopy(invitation) },
                                modifier = Modifier.weight(1f).height(36.dp),
                                border = BorderStroke(1.dp, Gold),
                                shape = RoundedCornerShape(9.dp)
                            ) { Text(text.t("groups.invite.copy"), color = Gold, fontSize = 9.sp) }
                            Button(
                                onClick = { onShare(invitation) },
                                modifier = Modifier.weight(1f).height(36.dp),
                                shape = RoundedCornerShape(9.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = DarkNavy)
                            ) { Text(text.t("groups.invite.share"), fontSize = 9.sp) }
                        }
                    }
                }
                val activeInvitations = invitations.filter { it.status == "active" }.take(5)
                if (activeInvitations.isNotEmpty()) {
                    Text(text.t("groups.invite.activeTitle"), color = GoldLight, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    activeInvitations.forEach { invitation ->
                        InvitationStatusCard(
                            text = text,
                            invitation = invitation,
                            card = DeepNavy,
                            ink = GoldLight,
                            muted = MutedGold,
                            green = Gold,
                            line = BorderNavy,
                            onRevoke = { onRevoke(invitation) }
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss, enabled = !busy) { Text(text.t("common.ok"), color = Gold) }
        }
    )
}

@Composable
private fun CreateJoinRequestDialog(
    text: AppStrings,
    groupCode: String,
    message: String,
    onMessageChange: (String) -> Unit,
    busy: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        icon = { Icon(Icons.Default.HowToReg, contentDescription = null, tint = Gold) },
        title = { Text(text.t("groups.requests.dialogTitle"), color = GoldLight, fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
                Text(text.t("groups.requests.dialogBody", groupCode), color = MutedGold, fontSize = 11.sp, lineHeight = 16.sp)
                OutlinedTextField(
                    value = message,
                    onValueChange = onMessageChange,
                    modifier = Modifier.fillMaxWidth().heightIn(min = 100.dp),
                    placeholder = { Text(text.t("groups.requests.messageHint"), fontSize = 10.sp) },
                    minLines = 3,
                    maxLines = 6,
                    shape = RoundedCornerShape(AppShape.control),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Gold,
                        unfocusedBorderColor = BorderNavy,
                        focusedTextColor = SoftTextGold,
                        unfocusedTextColor = SoftTextGold,
                        cursorColor = Gold
                    )
                )
                Text("${message.length}/500", modifier = Modifier.align(Alignment.End), color = MutedGold, fontSize = 9.sp)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !busy) { Text(text.t("common.cancel"), color = MutedGold) }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !busy,
                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = DarkNavy),
                shape = RoundedCornerShape(AppShape.control)
            ) {
                if (busy) {
                    CircularProgressIndicator(modifier = Modifier.size(15.dp), strokeWidth = 2.dp, color = DarkNavy)
                    Spacer(Modifier.width(7.dp))
                }
                Text(text.t("groups.requests.send"), fontWeight = FontWeight.Bold)
            }
        }
    )
}

@Composable
private fun EditGroupPostDialog(
    text: AppStrings,
    value: String,
    onValueChange: (String) -> Unit,
    busy: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        icon = { Icon(Icons.Default.Edit, contentDescription = null, tint = Gold) },
        title = { Text(text.t("groups.feed.edit.title"), color = GoldLight, fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(text.t("groups.feed.edit.body"), color = MutedGold, fontSize = 11.sp)
                OutlinedTextField(
                    value = value,
                    onValueChange = onValueChange,
                    modifier = Modifier.fillMaxWidth().heightIn(min = 120.dp),
                    minLines = 4,
                    maxLines = 8,
                    shape = RoundedCornerShape(AppShape.control),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Gold,
                        unfocusedBorderColor = BorderNavy,
                        focusedTextColor = SoftTextGold,
                        unfocusedTextColor = SoftTextGold,
                        cursorColor = Gold
                    )
                )
                Text("${value.length}/10000", modifier = Modifier.align(Alignment.End), color = MutedGold, fontSize = 9.sp)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !busy) {
                Text(text.t("common.cancel"), color = MutedGold)
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !busy && value.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = Gold),
                shape = RoundedCornerShape(AppShape.control)
            ) {
                if (busy) {
                    CircularProgressIndicator(modifier = Modifier.size(15.dp), strokeWidth = 2.dp, color = DarkNavy)
                    Spacer(Modifier.width(7.dp))
                }
                Text(text.t("groups.feed.edit.confirm"), color = DarkNavy, fontWeight = FontWeight.Bold)
            }
        }
    )
}

@Composable
private fun CreateGroupTaskDialog(
    text: AppStrings,
    title: String,
    description: String,
    type: String,
    target: String,
    unit: String,
    durationDays: Int?,
    points: String,
    busy: Boolean,
    onTitleChange: (String) -> Unit,
    onDescriptionChange: (String) -> Unit,
    onTypeChange: (String) -> Unit,
    onTargetChange: (String) -> Unit,
    onUnitChange: (String) -> Unit,
    onDurationChange: (Int?) -> Unit,
    onPointsChange: (String) -> Unit,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    val typeOptions = listOf("reading", "memorization", "challenge", "custom")
    val unitOptions = listOf(
        PROGRESS_UNIT_PAGE,
        PROGRESS_UNIT_AYAH,
        PROGRESS_UNIT_HIZB,
        PROGRESS_UNIT_JUZ,
        PROGRESS_UNIT_SURAH,
        PROGRESS_UNIT_LESSON,
        PROGRESS_UNIT_CUSTOM
    )
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        title = { Text(text.t("groups.tasks.createTitle"), color = GoldLight, fontWeight = FontWeight.ExtraBold) },
        text = {
            Column(
                modifier = Modifier.heightIn(max = 560.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.lg)
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = onTitleChange,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    label = { Text(text.t("groups.tasks.titleLabel")) },
                    placeholder = { Text(text.t("groups.tasks.titleHint")) },
                    supportingText = { Text("${title.length}/120") },
                    shape = RoundedCornerShape(AppShape.control),
                    colors = groupDialogTextFieldColors()
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = onDescriptionChange,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    maxLines = 5,
                    label = { Text(text.t("groups.tasks.descriptionLabel")) },
                    placeholder = { Text(text.t("groups.tasks.descriptionHint")) },
                    supportingText = { Text("${description.length}/3000") },
                    shape = RoundedCornerShape(AppShape.control),
                    colors = groupDialogTextFieldColors()
                )

                GroupTaskDialogLabel(text.t("groups.tasks.typeLabel"))
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)
                ) {
                    typeOptions.forEach { option ->
                        GroupTaskChoiceChip(
                            selected = type == option,
                            label = groupTaskTypeLabel(text, option),
                            icon = groupTaskTypeIcon(option),
                            enabled = !busy,
                            onClick = { onTypeChange(option) }
                        )
                    }
                }

                OutlinedTextField(
                    value = target,
                    onValueChange = onTargetChange,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    label = { Text(text.t("groups.tasks.targetLabel")) },
                    shape = RoundedCornerShape(AppShape.control),
                    colors = groupDialogTextFieldColors()
                )

                OutlinedTextField(
                    value = points,
                    onValueChange = onPointsChange,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    label = { Text(text.t("groups.tasks.pointsLabel")) },
                    supportingText = { Text(text.t("groups.tasks.pointsHint")) },
                    leadingIcon = { Icon(Icons.Default.Stars, contentDescription = null, tint = Gold) },
                    shape = RoundedCornerShape(AppShape.control),
                    colors = groupDialogTextFieldColors()
                )

                GroupTaskDialogLabel(text.t("groups.tasks.unitLabel"))
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)
                ) {
                    unitOptions.forEach { option ->
                        val selector = ProgressUnitOptions.first { it.value == option }
                        GroupTaskChoiceChip(
                            selected = unit == option,
                            label = selector.label(text),
                            icon = selector.icon,
                            enabled = !busy,
                            onClick = { onUnitChange(option) }
                        )
                    }
                }

                GroupTaskDialogLabel(text.t("groups.tasks.durationLabel"))
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)
                ) {
                    listOf<Int?>(7, 14, 30, null).forEach { days ->
                        GroupTaskChoiceChip(
                            selected = durationDays == days,
                            label = text.t(if (days == null) "groups.tasks.duration.none" else "groups.tasks.duration.$days"),
                            icon = if (days == null) Icons.Default.AllInclusive else Icons.Default.CalendarMonth,
                            enabled = !busy,
                            onClick = { onDurationChange(days) }
                        )
                    }
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !busy) {
                Text(text.t("common.cancel"), color = MutedGold)
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !busy && title.trim().length >= 3 && target.toIntOrNull() in 1..10_000 && points.toIntOrNull() in 0..1_000,
                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = DarkNavy),
                shape = RoundedCornerShape(AppShape.control)
            ) {
                if (busy) {
                    CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp, color = DarkNavy)
                    Spacer(Modifier.width(AppSpacing.sm))
                }
                Text(text.t(if (busy) "groups.tasks.creating" else "groups.tasks.createConfirm"), fontWeight = FontWeight.Bold)
            }
        }
    )
}

@Composable
private fun GroupTaskProgressDialog(
    text: AppStrings,
    task: ReadingGroupTaskItem,
    value: String,
    busy: Boolean,
    onValueChange: (String) -> Unit,
    onComplete: () -> Unit,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        icon = { Icon(Icons.Default.TrackChanges, contentDescription = null, tint = Gold) },
        title = { Text(text.t("groups.tasks.progressTitle"), color = GoldLight, fontWeight = FontWeight.ExtraBold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.lg)) {
                Text(text.t("groups.tasks.progressBody", task.title), color = SoftTextGold, fontSize = 12.sp, lineHeight = 18.sp)
                OutlinedTextField(
                    value = value,
                    onValueChange = onValueChange,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    label = { Text(text.t("groups.tasks.progressLabel")) },
                    suffix = { Text("/ ${task.targetValue} ${groupTaskUnitLabel(text, task.targetUnit, task.targetValue)}") },
                    shape = RoundedCornerShape(AppShape.control),
                    colors = groupDialogTextFieldColors()
                )
                OutlinedButton(
                    onClick = onComplete,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(AppShape.control),
                    border = BorderStroke(1.dp, DoneGreen),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = DoneGreen)
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(17.dp))
                    Spacer(Modifier.width(AppSpacing.sm))
                    Text(text.t("groups.tasks.completeNow"), fontWeight = FontWeight.Bold)
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !busy) {
                Text(text.t("common.cancel"), color = MutedGold)
            }
        },
        confirmButton = {
            val parsed = value.toIntOrNull()
            Button(
                onClick = onConfirm,
                enabled = !busy && parsed != null && parsed in 0..task.targetValue,
                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = DarkNavy),
                shape = RoundedCornerShape(AppShape.control)
            ) {
                if (busy) {
                    CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp, color = DarkNavy)
                    Spacer(Modifier.width(AppSpacing.sm))
                }
                Text(text.t("groups.tasks.progressSave"), fontWeight = FontWeight.Bold)
            }
        }
    )
}

@Composable
private fun GroupTaskDialogLabel(label: String) {
    Text(label, color = GoldLight, fontSize = 12.sp, fontWeight = FontWeight.Bold)
}

@Composable
private fun GroupTaskChoiceChip(
    selected: Boolean,
    label: String,
    icon: ImageVector,
    enabled: Boolean,
    onClick: () -> Unit
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        enabled = enabled,
        label = { Text(label, fontSize = 10.sp) },
        leadingIcon = { Icon(if (selected) Icons.Default.Check else icon, contentDescription = null, modifier = Modifier.size(15.dp)) },
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = GoldSurface,
            selectedLabelColor = GoldLight,
            selectedLeadingIconColor = Gold,
            labelColor = MutedGold,
            iconColor = MutedGold
        )
    )
}

@Composable
private fun groupDialogTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Gold,
    unfocusedBorderColor = BorderNavy,
    focusedTextColor = SoftTextGold,
    unfocusedTextColor = SoftTextGold,
    focusedContainerColor = DeepNavy,
    unfocusedContainerColor = DeepNavy,
    cursorColor = Gold
)

@Composable
private fun CreateGroupEventDialog(
    text: AppStrings,
    title: String,
    description: String,
    date: String,
    time: String,
    durationMinutes: Int,
    location: String,
    busy: Boolean,
    onTitleChange: (String) -> Unit,
    onDescriptionChange: (String) -> Unit,
    onDateChange: (String) -> Unit,
    onTimeChange: (String) -> Unit,
    onDurationChange: (Int) -> Unit,
    onLocationChange: (String) -> Unit,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        icon = { Icon(Icons.Default.EventAvailable, contentDescription = null, tint = Gold) },
        title = { Text(text.t("groups.events.createTitle"), color = GoldLight, fontWeight = FontWeight.ExtraBold) },
        text = {
            Column(
                modifier = Modifier.heightIn(max = 560.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md)
            ) {
                OutlinedTextField(
                    value = title, onValueChange = onTitleChange, enabled = !busy,
                    modifier = Modifier.fillMaxWidth(), singleLine = true,
                    label = { Text(text.t("groups.events.titleLabel")) },
                    placeholder = { Text(text.t("groups.events.titleHint")) },
                    shape = RoundedCornerShape(AppShape.control), colors = groupDialogTextFieldColors()
                )
                OutlinedTextField(
                    value = description, onValueChange = onDescriptionChange, enabled = !busy,
                    modifier = Modifier.fillMaxWidth(), minLines = 3, maxLines = 5,
                    label = { Text(text.t("groups.events.descriptionLabel")) },
                    shape = RoundedCornerShape(AppShape.control), colors = groupDialogTextFieldColors()
                )
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    OutlinedTextField(
                        value = date, onValueChange = onDateChange, enabled = !busy,
                        modifier = Modifier.weight(1.35f), singleLine = true,
                        label = { Text(text.t("groups.events.dateLabel")) },
                        placeholder = { Text("2026-09-06") },
                        shape = RoundedCornerShape(AppShape.control), colors = groupDialogTextFieldColors()
                    )
                    OutlinedTextField(
                        value = time, onValueChange = onTimeChange, enabled = !busy,
                        modifier = Modifier.weight(0.8f), singleLine = true,
                        label = { Text(text.t("groups.events.timeLabel")) },
                        placeholder = { Text("19:00") },
                        shape = RoundedCornerShape(AppShape.control), colors = groupDialogTextFieldColors()
                    )
                }
                OutlinedTextField(
                    value = location, onValueChange = onLocationChange, enabled = !busy,
                    modifier = Modifier.fillMaxWidth(), singleLine = true,
                    label = { Text(text.t("groups.events.locationLabel")) },
                    leadingIcon = { Icon(Icons.Default.Place, contentDescription = null, tint = Gold) },
                    shape = RoundedCornerShape(AppShape.control), colors = groupDialogTextFieldColors()
                )
                GroupTaskDialogLabel(text.t("groups.events.durationLabel"))
                Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    listOf(30, 60, 90, 120).forEach { minutes ->
                        GroupTaskChoiceChip(
                            selected = durationMinutes == minutes,
                            label = text.t("groups.events.minutes", minutes),
                            icon = Icons.Default.Schedule,
                            enabled = !busy,
                            onClick = { onDurationChange(minutes) }
                        )
                    }
                }
            }
        },
        dismissButton = { TextButton(onClick = onDismiss, enabled = !busy) { Text(text.t("common.cancel"), color = MutedGold) } },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !busy && title.trim().length >= 3 && date.length == 10 && time.length == 5,
                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = DarkNavy),
                shape = RoundedCornerShape(AppShape.control)
            ) {
                if (busy) {
                    CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp, color = DarkNavy)
                    Spacer(Modifier.width(AppSpacing.sm))
                }
                Text(text.t("groups.events.createConfirm"), fontWeight = FontWeight.Bold)
            }
        }
    )
}

@Composable
private fun ConfirmGroupEventStatusDialog(
    text: AppStrings,
    event: ReadingGroupEventItem,
    status: String,
    busy: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    val destructive = status == "deleted"
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        icon = { Icon(if (destructive) Icons.Default.DeleteOutline else Icons.Default.Event, null, tint = if (destructive) DeleteRed else Gold) },
        title = { Text(text.t("groups.events.statusTitle"), color = GoldLight, fontWeight = FontWeight.Bold) },
        text = { Text(text.t("groups.events.statusBody", event.title), color = SoftTextGold, fontSize = 12.sp) },
        dismissButton = { TextButton(onClick = onDismiss, enabled = !busy) { Text(text.t("common.cancel"), color = MutedGold) } },
        confirmButton = {
            Button(
                onClick = onConfirm, enabled = !busy,
                colors = ButtonDefaults.buttonColors(containerColor = if (destructive) DeleteRed else Gold, contentColor = DarkNavy),
                shape = RoundedCornerShape(AppShape.control)
            ) { Text(text.t("common.confirm"), fontWeight = FontWeight.Bold) }
        }
    )
}

@Composable
private fun GroupProfileDialog(
    text: AppStrings,
    name: String,
    currentAvatarUrl: String?,
    previewUri: String?,
    resetAvatar: Boolean,
    busy: Boolean,
    onNameChange: (String) -> Unit,
    onPickPhoto: () -> Unit,
    onUseAppProfile: () -> Unit,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    val visibleAvatar = if (resetAvatar) null else previewUri ?: currentAvatarUrl
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        icon = { Icon(Icons.Default.Badge, contentDescription = null, tint = Gold) },
        title = { Text(text.t("groups.profile.dialogTitle"), color = GoldLight, fontWeight = FontWeight.ExtraBold) },
        text = {
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(AppSpacing.lg)) {
                GroupMemberAvatar(name.ifBlank { text.t("groups.profile.you") }, visibleAvatar, Gold, 88.dp)
                Text(text.t("groups.profile.dialogBody"), color = MutedGold, fontSize = 11.sp, textAlign = TextAlign.Center, lineHeight = 16.sp)
                OutlinedTextField(
                    value = name, onValueChange = onNameChange, enabled = !busy,
                    modifier = Modifier.fillMaxWidth(), singleLine = true,
                    label = { Text(text.t("groups.profile.nameLabel")) },
                    supportingText = { Text("${name.length}/40") },
                    shape = RoundedCornerShape(AppShape.control), colors = groupDialogTextFieldColors()
                )
                Button(
                    onClick = onPickPhoto, enabled = !busy, modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = GoldSurface, contentColor = GoldLight),
                    shape = RoundedCornerShape(AppShape.control)
                ) {
                    Icon(Icons.Default.PhotoCamera, contentDescription = null, tint = Gold)
                    Spacer(Modifier.width(AppSpacing.sm))
                    Text(text.t("groups.profile.choosePhoto"), fontWeight = FontWeight.Bold)
                }
                TextButton(onClick = onUseAppProfile, enabled = !busy) {
                    Text(text.t("groups.profile.useAppProfile"), color = MutedGold)
                }
            }
        },
        dismissButton = { TextButton(onClick = onDismiss, enabled = !busy) { Text(text.t("common.cancel"), color = MutedGold) } },
        confirmButton = {
            Button(
                onClick = onConfirm, enabled = !busy && (name.isBlank() || name.trim().length in 2..40),
                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = DarkNavy),
                shape = RoundedCornerShape(AppShape.control)
            ) {
                if (busy) {
                    CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp, color = DarkNavy)
                    Spacer(Modifier.width(AppSpacing.sm))
                }
                Text(text.t("groups.profile.save"), fontWeight = FontWeight.Bold)
            }
        }
    )
}

@Composable
private fun ConfirmGroupTaskStatusDialog(
    text: AppStrings,
    task: ReadingGroupTaskItem,
    status: String,
    busy: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    val destructive = status == "deleted"
    val accent = if (destructive) DeleteRed else Gold
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        icon = {
            Icon(
                if (destructive) Icons.Default.DeleteOutline else Icons.Default.FactCheck,
                contentDescription = null,
                tint = accent
            )
        },
        title = { Text(text.t("groups.tasks.status.$status.title"), color = GoldLight, fontWeight = FontWeight.Bold) },
        text = {
            Text(
                text.t("groups.tasks.status.$status.body", task.title),
                color = MutedGold,
                fontSize = 12.sp,
                lineHeight = 18.sp
            )
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !busy) {
                Text(text.t("common.cancel"), color = MutedGold)
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !busy,
                colors = ButtonDefaults.buttonColors(containerColor = accent, contentColor = if (destructive) Color.White else DarkNavy),
                shape = RoundedCornerShape(AppShape.control)
            ) {
                if (busy) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(15.dp),
                        strokeWidth = 2.dp,
                        color = if (destructive) Color.White else DarkNavy
                    )
                    Spacer(Modifier.width(AppSpacing.sm))
                }
                Text(text.t("groups.tasks.status.confirm"), fontWeight = FontWeight.Bold)
            }
        }
    )
}

@Composable
internal fun ConfirmFeedDeleteDialog(
    text: AppStrings,
    title: String,
    body: String,
    errorMessage: String = "",
    busy: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        icon = { Icon(Icons.Default.DeleteOutline, contentDescription = null, tint = DeleteRed) },
        title = { Text(title, color = GoldLight, fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(body, color = MutedGold, fontSize = 12.sp, lineHeight = 18.sp)
                if (errorMessage.isNotBlank()) Text(errorMessage, color = DeleteRed, fontSize = 12.sp)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !busy) {
                Text(text.t("common.cancel"), color = MutedGold)
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !busy,
                colors = ButtonDefaults.buttonColors(containerColor = DeleteRed),
                shape = RoundedCornerShape(AppShape.control)
            ) {
                if (busy) {
                    CircularProgressIndicator(modifier = Modifier.size(15.dp), strokeWidth = 2.dp, color = Color.White)
                    Spacer(Modifier.width(7.dp))
                }
                Text(text.t("groups.feed.delete.confirm"), color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    )
}

@Composable
@OptIn(ExperimentalLayoutApi::class)
private fun ReportGroupPostDialog(
    text: AppStrings,
    reason: String,
    details: String,
    onReasonChange: (String) -> Unit,
    onDetailsChange: (String) -> Unit,
    busy: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    val reasons = listOf("spam", "harassment", "inappropriate", "misinformation", "other")
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        icon = { Icon(Icons.Default.Flag, contentDescription = null, tint = Gold) },
        title = { Text(text.t("groups.feed.report.title"), color = GoldLight, fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(text.t("groups.feed.report.body"), color = MutedGold, fontSize = 11.sp, lineHeight = 17.sp)
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    reasons.forEach { option ->
                        FilterChip(
                            selected = reason == option,
                            onClick = { onReasonChange(option) },
                            label = { Text(text.t("groups.feed.report.reason.$option"), fontSize = 10.sp) },
                            leadingIcon = if (reason == option) {
                                { Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(15.dp)) }
                            } else null,
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = GoldSurface,
                                selectedLabelColor = GoldLight,
                                labelColor = MutedGold
                            ),
                            border = FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = reason == option,
                                borderColor = BorderNavy,
                                selectedBorderColor = Gold
                            )
                        )
                    }
                }
                OutlinedTextField(
                    value = details,
                    onValueChange = onDetailsChange,
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    maxLines = 5,
                    label = { Text(text.t("groups.feed.report.details")) },
                    supportingText = { Text("${details.length}/2000") },
                    shape = RoundedCornerShape(AppShape.control),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Gold,
                        unfocusedBorderColor = BorderNavy,
                        focusedTextColor = SoftTextGold,
                        unfocusedTextColor = SoftTextGold,
                        focusedLabelColor = Gold,
                        unfocusedLabelColor = MutedGold,
                        cursorColor = Gold
                    )
                )
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !busy) {
                Text(text.t("common.cancel"), color = MutedGold)
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !busy,
                colors = ButtonDefaults.buttonColors(containerColor = Gold),
                shape = RoundedCornerShape(AppShape.control)
            ) {
                if (busy) {
                    CircularProgressIndicator(modifier = Modifier.size(15.dp), strokeWidth = 2.dp, color = DarkNavy)
                    Spacer(Modifier.width(7.dp))
                }
                Text(text.t("groups.feed.report.confirm"), color = DarkNavy, fontWeight = FontWeight.Bold)
            }
        }
    )
}

private data class AccountStrings(
    val accountTitle: String,
    val optional: String,
    val optionalLogin: String,
    val supabaseMissing: String,
    val supabaseRequired: String,
    val signedInWithGoogle: String,
    val googleActive: String,
    val profileSettings: String,
    val changePhoto: String,
    val profileNameLabel: String,
    val saveProfileName: String,
    val saving: String,
    val nameSaved: String,
    val nameSaveFailed: String,
    val photoSaved: String,
    val photoReadFailed: String,
    val photoUploadFailed: String,
    val emailPasswordRequired: String,
    val passwordsMismatch: String,
    val loginExisting: String,
    val createAccount: String,
    val createAccountMessage: String,
    val googleLoginOpened: String,
    val googleLoginFailed: String,
    val signInWithGoogle: String,
    val emailLabel: String,
    val emailPlaceholder: String,
    val passwordLabel: String,
    val repeatPasswordLabel: String,
    val signedIn: String,
    val signInFailed: String,
    val login: String,
    val verificationSent: String,
    val createAccountFailed: String,
    val signedOut: String,
    val signOutFailed: String,
    val signOut: String,
    val signingOut: String,
    val continueWithoutAccount: String,
    val signedInAs: (String) -> String
)

private fun accountStrings(text: AppStrings): AccountStrings = when (text.account) {
    "Account" -> AccountStrings(
        accountTitle = "Account",
        optional = "Optional",
        optionalLogin = "Login is optional. The app keeps working locally without an account.",
        supabaseMissing = "Supabase is not configured yet.",
        supabaseRequired = "Set up Supabase first.",
        signedInWithGoogle = "Signed in with Google",
        googleActive = "Signed in with Google. Groups and online features are active.",
        profileSettings = "Profile settings",
        changePhoto = "Change profile photo",
        profileNameLabel = "Profile name",
        saveProfileName = "Save profile name",
        saving = "Saving...",
        nameSaved = "Profile name saved.",
        nameSaveFailed = "Could not save profile name.",
        photoSaved = "Profile photo saved.",
        photoReadFailed = "Could not read the photo.",
        photoUploadFailed = "Could not upload profile photo.",
        emailPasswordRequired = "Enter an email and a password of at least 6 characters.",
        passwordsMismatch = "The two passwords do not match.",
        loginExisting = "Log in with your existing account.",
        createAccount = "Create account",
        createAccountMessage = "Create an account. You will receive a verification email.",
        googleLoginOpened = "Google login opened through Supabase.",
        googleLoginFailed = "Google login failed.",
        signInWithGoogle = "Sign in with Google",
        emailLabel = "Email",
        emailPlaceholder = "name@email.com",
        passwordLabel = "Password",
        repeatPasswordLabel = "Repeat password",
        signedIn = "You are signed in.",
        signInFailed = "Login failed.",
        login = "Login",
        verificationSent = "Verification email sent. Confirm your email and then log in.",
        createAccountFailed = "Could not create account.",
        signedOut = "You are signed out. The app keeps working locally.",
        signOutFailed = "Could not sign out.",
        signOut = "Sign out",
        signingOut = "Signing out...",
        continueWithoutAccount = "Continue without account",
        signedInAs = { "Signed in as $it" }
    )
    "الحساب" -> AccountStrings(
        accountTitle = "الحساب",
        optional = "اختياري",
        optionalLogin = "تسجيل الدخول اختياري. يبقى التطبيق يعمل محليا دون حساب.",
        supabaseMissing = "لم يتم إعداد Supabase بعد.",
        supabaseRequired = "أعد إعداد Supabase أولا.",
        signedInWithGoogle = "تم تسجيل الدخول عبر Google",
        googleActive = "تم تسجيل الدخول عبر Google. المجموعات والميزات المتصلة فعالة.",
        profileSettings = "إعدادات الملف الشخصي",
        changePhoto = "تغيير صورة الملف",
        profileNameLabel = "اسم الملف الشخصي",
        saveProfileName = "حفظ اسم الملف",
        saving = "جار الحفظ...",
        nameSaved = "تم حفظ اسم الملف الشخصي.",
        nameSaveFailed = "تعذر حفظ اسم الملف الشخصي.",
        photoSaved = "تم حفظ صورة الملف الشخصي.",
        photoReadFailed = "تعذرت قراءة الصورة.",
        photoUploadFailed = "تعذر رفع صورة الملف الشخصي.",
        emailPasswordRequired = "أدخل البريد وكلمة مرور من 6 أحرف على الأقل.",
        passwordsMismatch = "كلمتا المرور غير متطابقتين.",
        loginExisting = "سجل الدخول بحسابك الحالي.",
        createAccount = "إنشاء حساب",
        createAccountMessage = "أنشئ حسابا. ستصلك رسالة تحقق.",
        googleLoginOpened = "تم فتح تسجيل Google عبر Supabase.",
        googleLoginFailed = "فشل تسجيل الدخول عبر Google.",
        signInWithGoogle = "تسجيل الدخول عبر Google",
        emailLabel = "البريد الإلكتروني",
        emailPlaceholder = "name@email.com",
        passwordLabel = "كلمة المرور",
        repeatPasswordLabel = "إعادة كلمة المرور",
        signedIn = "تم تسجيل الدخول.",
        signInFailed = "فشل تسجيل الدخول.",
        login = "تسجيل الدخول",
        verificationSent = "تم إرسال رسالة التحقق. أكد بريدك ثم سجل الدخول.",
        createAccountFailed = "تعذر إنشاء الحساب.",
        signedOut = "تم تسجيل الخروج. يبقى التطبيق يعمل محليا.",
        signOutFailed = "تعذر تسجيل الخروج.",
        signOut = "تسجيل الخروج",
        signingOut = "جار تسجيل الخروج...",
        continueWithoutAccount = "المتابعة دون حساب",
        signedInAs = { "تم تسجيل الدخول باسم $it" }
    )
    "Compte" -> AccountStrings(
        accountTitle = "Compte",
        optional = "Optionnel",
        optionalLogin = "La connexion est optionnelle. L'app fonctionne aussi en local.",
        supabaseMissing = "Supabase n'est pas encore configuré.",
        supabaseRequired = "Configure d'abord Supabase.",
        signedInWithGoogle = "Connecté avec Google",
        googleActive = "Connecté avec Google. Les groupes et fonctions en ligne sont actifs.",
        profileSettings = "Paramètres du profil",
        changePhoto = "Modifier la photo",
        profileNameLabel = "Nom du profil",
        saveProfileName = "Enregistrer le nom",
        saving = "Enregistrement...",
        nameSaved = "Nom du profil enregistré.",
        nameSaveFailed = "Impossible d'enregistrer le nom.",
        photoSaved = "Photo du profil enregistrée.",
        photoReadFailed = "Impossible de lire la photo.",
        photoUploadFailed = "Impossible d'envoyer la photo.",
        emailPasswordRequired = "Saisis un e-mail et un mot de passe d'au moins 6 caractères.",
        passwordsMismatch = "Les deux mots de passe ne correspondent pas.",
        loginExisting = "Connecte-toi avec ton compte existant.",
        createAccount = "Créer un compte",
        createAccountMessage = "Crée un compte. Tu recevras un e-mail de vérification.",
        googleLoginOpened = "Connexion Google ouverte via Supabase.",
        googleLoginFailed = "La connexion Google a échoué.",
        signInWithGoogle = "Se connecter avec Google",
        emailLabel = "E-mail",
        emailPlaceholder = "nom@email.com",
        passwordLabel = "Mot de passe",
        repeatPasswordLabel = "Répéter le mot de passe",
        signedIn = "Tu es connecté.",
        signInFailed = "Connexion échouée.",
        login = "Connexion",
        verificationSent = "E-mail de vérification envoyé. Confirme ton e-mail puis connecte-toi.",
        createAccountFailed = "Impossible de créer le compte.",
        signedOut = "Tu es déconnecté. L'app reste disponible en local.",
        signOutFailed = "Impossible de se déconnecter.",
        signOut = "Déconnexion",
        signingOut = "Déconnexion...",
        continueWithoutAccount = "Continuer sans compte",
        signedInAs = { "Connecté en tant que $it" }
    )
    else -> AccountStrings(
        accountTitle = "Account",
        optional = "Niet verplicht",
        optionalLogin = "Inloggen is optioneel. Je app blijft lokaal werken zonder account.",
        supabaseMissing = "Supabase is nog niet ingesteld.",
        supabaseRequired = "Maak eerst een Supabase-project aan en vul de URL + key in.",
        signedInWithGoogle = "Ingelogd met Google",
        googleActive = "Ingelogd met Google. Groepen en online functies zijn actief.",
        profileSettings = "Profielinstellingen",
        changePhoto = "Profielfoto aanpassen",
        profileNameLabel = "Profielnaam",
        saveProfileName = "Profielnaam opslaan",
        saving = "Opslaan...",
        nameSaved = "Profielnaam opgeslagen.",
        nameSaveFailed = "Profielnaam opslaan is niet gelukt.",
        photoSaved = "Profielfoto opgeslagen.",
        photoReadFailed = "Foto kon niet gelezen worden.",
        photoUploadFailed = "Profielfoto uploaden is niet gelukt.",
        emailPasswordRequired = "Vul een e-mail en wachtwoord van minimaal 6 tekens in.",
        passwordsMismatch = "De twee wachtwoorden zijn niet hetzelfde.",
        loginExisting = "Log in met je bestaande account.",
        createAccount = "Account maken",
        createAccountMessage = "Maak een account aan. Je ontvangt daarna een verificatie-mail.",
        googleLoginOpened = "Google-login is geopend via Supabase.",
        googleLoginFailed = "Google-login is niet gelukt.",
        signInWithGoogle = "Inloggen met Google",
        emailLabel = "E-mail",
        emailPlaceholder = "naam@email.nl",
        passwordLabel = "Wachtwoord",
        repeatPasswordLabel = "Wachtwoord herhalen",
        signedIn = "Je bent ingelogd.",
        signInFailed = "Inloggen is niet gelukt.",
        login = "Inloggen",
        verificationSent = "Verificatie-mail verstuurd. Bevestig je e-mail en log daarna in.",
        createAccountFailed = "Account aanmaken is niet gelukt.",
        signedOut = "Je bent uitgelogd. De app blijft lokaal werken.",
        signOutFailed = "Uitloggen is niet gelukt.",
        signOut = "Uitloggen",
        signingOut = "Uitloggen...",
        continueWithoutAccount = "Doorgaan zonder account",
        signedInAs = { "Ingelogd als $it" }
    )
}

@Composable
private fun AccountMenuRow(
    account: UserAccount?,
    fallbackTitle: String,
    fallbackSubtitle: String,
    strings: AccountStrings,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = SettingsMenuStyle.rowHeight)
            .clickable(onClick = onClick)
            .padding(horizontal = SettingsMenuStyle.innerPadding, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        ProfileAvatar(
            avatarUrl = account?.displayAvatarUrl,
            fallbackText = account?.displayName?.takeIf { it.isNotBlank() }
                ?: account?.email
                ?: fallbackTitle,
            size = 42.dp
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                account?.displayName?.takeIf { it.isNotBlank() } ?: fallbackTitle,
                fontSize = 14.sp,
                color = GoldLight,
                fontWeight = FontWeight.Bold,
                maxLines = 1
            )
            Text(
                account?.email?.takeIf { it.isNotBlank() } ?: fallbackSubtitle,
                fontSize = 11.sp,
                color = MutedGold,
                maxLines = 1
            )
            if (account != null) {
                Text(strings.signedIn, fontSize = 10.sp, color = DoneGreen, maxLines = 1)
            }
        }
        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = ChevronNavy)
    }
}

@Composable
private fun AccountSettingsPage(
    text: AppStrings,
    onBack: () -> Unit,
    authenticationRequired: Boolean = false
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val strings = remember(text) { accountStrings(text) }
    val language = when (text.account) { "الحساب" -> "ar"; "Compte" -> "fr"; "Account" -> if (text.cancel == "Cancel") "en" else "nl"; else -> "nl" }
    fun label(nl: String, en: String, ar: String) = goalText(language, nl, en, ar)
    var notice by remember { mutableStateOf<Pair<String, String>?>(null) }
    var passwordVisible by remember { mutableStateOf(false) }
    val authenticationState by SupabaseService.authenticationState.collectAsState()
    val authenticatedUser = authenticationState as? AuthenticationState.Authenticated
    val authLoading = authenticationState is AuthenticationState.Checking
    var accountMode by remember { mutableStateOf("login") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var message by remember {
        mutableStateOf(
            if (authenticationRequired) {
                text.t("groups.accountRequired.body")
            } else if (SupabaseConfig.isConfigured) {
                strings.optionalLogin
            } else {
                strings.supabaseMissing
            }
        )
    }
    var currentAccount by remember { mutableStateOf<UserAccount?>(null) }
    var profileName by remember { mutableStateOf("") }
    var profileNameInput by remember { mutableStateOf("") }
    var profileAvatarUrl by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    val accountDeleted by SupabaseService.accountDeleted.collectAsState()
    LaunchedEffect(accountDeleted) {
        if (accountDeleted) {
            message = accountManagementText(language, "deleted")
            notice = accountManagementText(language, "title") to message
            SupabaseService.consumeAccountDeletionNotice()
        }
    }

    LaunchedEffect(authenticatedUser?.userId, authenticatedUser?.email) {
        val user = authenticatedUser
        if (user != null) {
            currentAccount = ProfileAvatarService.withCachedAvatar(
                context = context,
                account = runCatching { SupabaseService.currentUserAccount() }.getOrNull()
            )
            profileName = currentAccount?.customDisplayName
                ?: currentAccount?.uploadedDisplayName
                ?: ""
            profileAvatarUrl = ProfileAvatarService.resolveAvatarUrl(
                customAvatarUrl = currentAccount?.customAvatarUrl,
                uploadedAvatarUrl = ProfileAvatarService.cachedUploadedAvatarUrl(context, user.email),
                googlePhotoUrl = null
            )
            profileNameInput = profileName.ifBlank { currentAccount?.displayName.orEmpty() }
        } else {
            currentAccount = null
            profileName = ""
            profileNameInput = ""
            profileAvatarUrl = null
        }
    }

    val currentUserEmail = authenticatedUser?.email

    val avatarPicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) {
            busy = true
            scope.launch {
                val result = runCatching {
                    val mimeType = context.contentResolver.getType(uri) ?: "image/jpeg"
                    val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                        ?: error(strings.photoReadFailed)
                    SupabaseService.uploadProfileAvatar(bytes, mimeType)
                }
                busy = false
                message = result.fold(
                    onSuccess = { uploadedUrl ->
                        currentUserEmail?.let { email ->
                            ProfileAvatarService.cacheUploadedAvatarUrl(context, email, uploadedUrl)
                        }
                        profileAvatarUrl = uploadedUrl
                        currentAccount = ProfileAvatarService.withCachedAvatar(
                            context = context,
                            account = runCatching { SupabaseService.currentUserAccount() }.getOrNull()
                        )
                            ?: currentAccount?.copy(
                                avatarUrl = ProfileAvatarService.resolveAvatarUrl(
                                    customAvatarUrl = uploadedUrl,
                                    uploadedAvatarUrl = uploadedUrl,
                                    googlePhotoUrl = currentAccount?.providerAvatarUrl
                                ),
                                uploadedAvatarUrl = uploadedUrl,
                                customAvatarUrl = uploadedUrl
                            )
                        strings.photoSaved
                    },
                    onFailure = { it.localizedMessage ?: strings.photoUploadFailed }
                )
            }
        }
    }

    fun requireSupabase(): Boolean {
        if (!SupabaseConfig.isConfigured) {
            message = strings.supabaseRequired
            return false
        }
        return true
    }

    fun validateEmailLogin(): Boolean {
        if (!requireSupabase()) return false
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()) {
            message = label("Vul een geldig e-mailadres in.", "Enter a valid email address.", "أدخل بريدًا إلكترونيًا صالحًا.")
            notice = strings.emailLabel to message
            return false
        }
        if (password.isBlank() || (accountMode == "signup" && password.length < 6)) {
            message = strings.emailPasswordRequired
            notice = strings.passwordLabel to message
            return false
        }
        return true
    }

    fun validateSignup(): Boolean {
        if (!validateEmailLogin()) return false
        if (password != confirmPassword) {
            message = strings.passwordsMismatch
            notice = strings.passwordLabel to message
            return false
        }
        return true
    }

    fun authError(error: Throwable): String {
        val reason = error.message.orEmpty().lowercase()
        return when {
            "email_not_confirmed" in reason || "email not confirmed" in reason -> label(
                "Je e-mailadres is nog niet bevestigd. Open de bevestigingsmail, tik op de link en log daarna in. Controleer ook je spammap.",
                "Your email is not confirmed. Open the confirmation email, follow the link and sign in. Check your spam folder too.",
                "لم يتم تأكيد بريدك. افتح رسالة التأكيد واضغط على الرابط ثم سجّل الدخول. تحقق من البريد غير المرغوب فيه أيضًا.")
            "invalid_credentials" in reason || "invalid login" in reason -> label(
                "E-mailadres of wachtwoord klopt niet. Controleer je gegevens en probeer opnieuw.",
                "Incorrect email or password. Check your details and try again.", "البريد أو كلمة المرور غير صحيحة. تحقق وحاول مجددًا.")
            "rate" in reason || "429" in reason -> label("Te veel pogingen. Wacht even en probeer opnieuw.",
                "Too many attempts. Wait a little and try again.", "محاولات كثيرة. انتظر قليلًا وحاول مجددًا.")
            else -> label("Het is niet gelukt. Controleer je internetverbinding en probeer opnieuw. Blijft dit gebeuren? Probeer het later nog eens.",
                "Unable to complete this request. Check your connection and try again. If it continues, try again later.",
                "تعذر إكمال الطلب. تحقق من الاتصال وحاول مجددًا أو حاول لاحقًا.")
        }
    }

    notice?.let { (title, body) ->
        AlertDialog(onDismissRequest = { notice = null }, title = { Text(title) }, text = { Text(body) },
            confirmButton = { TextButton(onClick = { notice = null }) { Text("OK") } })
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
                    Text(strings.accountTitle, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    Text(
                        if (authenticationRequired) text.t("groups.accountRequired.title") else strings.optional,
                        fontSize = 11.sp,
                        color = MutedGold
                    )
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

            if (authLoading) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth(), color = Gold)
                return@Column
            }
            if (authenticatedUser != null) {
                AccountProfilePanel(
                    language = language,
                    account = currentAccount,
                    email = currentUserEmail.orEmpty(),
                    profileName = profileName.ifBlank { currentAccount?.displayName.orEmpty() },
                    profileNameInput = profileNameInput,
                    profileAvatarUrl = profileAvatarUrl,
                    onProfileNameChange = { profileNameInput = it.take(40) },
                    onPickAvatar = {
                        avatarPicker.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                        )
                    },
                    strings = strings,
                    busy = busy,
                    onSaveProfileName = {
                        busy = true
                        scope.launch {
                            val result = runCatching { SupabaseService.saveProfileName(profileNameInput) }
                            busy = false
                            message = result.fold(
                                onSuccess = {
                                    val savedName = profileNameInput.trim()
                                    currentUserEmail?.let { email ->
                                        ProfileAvatarService.cacheUploadedDisplayName(context, email, savedName)
                                    }
                                    profileName = savedName
                                    profileNameInput = savedName
                                    currentAccount = currentAccount?.copy(
                                        displayName = savedName,
                                        customDisplayName = savedName,
                                        uploadedDisplayName = savedName
                                    )
                                    strings.nameSaved
                                },
                                onFailure = { it.localizedMessage ?: strings.nameSaveFailed }
                            )
                        }
                    },
                    onSignOut = {
                        busy = true
                        scope.launch {
                            val result = runCatching { SupabaseService.signOut() }
                            busy = false
                            result.onSuccess { currentAccount = null }
                            message = result.fold(
                                onSuccess = { strings.signedOut },
                                onFailure = { it.localizedMessage ?: strings.signOutFailed }
                            )
                        }
                    }
                )
                return@Column
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SettingsChoiceChip(
                    label = strings.login,
                    selected = accountMode == "login",
                    onClick = {
                        if (busy) return@SettingsChoiceChip
                        accountMode = "login"
                        message = strings.loginExisting
                    },
                    modifier = Modifier.weight(1f)
                )
                SettingsChoiceChip(
                    label = strings.createAccount,
                    selected = accountMode == "signup",
                    onClick = {
                        if (busy) return@SettingsChoiceChip
                        accountMode = "signup"
                        message = strings.createAccountMessage
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
                                onSuccess = { strings.googleLoginOpened },
                                onFailure = { authError(it).also { error -> notice = strings.googleLoginFailed to error } }
                            )
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
                Text(strings.signInWithGoogle, color = DarkNavy, fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(12.dp))
            Text(strings.emailLabel, fontSize = 11.sp, color = MutedGold, modifier = Modifier.padding(bottom = 6.dp))
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                enabled = !busy,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true,
                placeholder = { Text(strings.emailPlaceholder) },
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
            Text(strings.passwordLabel, fontSize = 11.sp, color = MutedGold, modifier = Modifier.padding(bottom = 6.dp))
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                enabled = !busy,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                singleLine = true,
                visualTransformation = if (passwordVisible) androidx.compose.ui.text.input.VisualTransformation.None else PasswordVisualTransformation(),
                trailingIcon = { IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Icon(if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                        label("Wachtwoord tonen/verbergen", "Show/hide password", "إظهار/إخفاء كلمة المرور"))
                } },
                placeholder = { Text(strings.passwordLabel) },
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

            if (accountMode == "login") {
                ForgotPasswordButton(email = email, language = language, enabled = !busy)
            }
            if (accountMode == "signup") {
                Spacer(modifier = Modifier.height(8.dp))
                Text(strings.repeatPasswordLabel, fontSize = 11.sp, color = MutedGold, modifier = Modifier.padding(bottom = 6.dp))
                OutlinedTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    enabled = !busy,
                    singleLine = true,
                    visualTransformation = if (passwordVisible) androidx.compose.ui.text.input.VisualTransformation.None else PasswordVisualTransformation(),
                    placeholder = { Text(strings.repeatPasswordLabel) },
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
                                    onSuccess = { strings.signedIn },
                                    onFailure = { authError(it).also { error -> notice = strings.signInFailed to error } }
                                )
                            }
                        }
                    },
                    enabled = !busy,
                    modifier = Modifier.weight(1f).height(38.dp),
                    shape = RoundedCornerShape(AppShape.control),
                    colors = ButtonDefaults.buttonColors(containerColor = Gold)
                ) {
                    if (busy) CircularProgressIndicator(Modifier.size(18.dp), color = DarkNavy, strokeWidth = 2.dp)
                    else Text(strings.login, color = DarkNavy, fontSize = 12.sp, fontWeight = FontWeight.Bold)
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
                                    onSuccess = { signedIn ->
                                        password = ""
                                        confirmPassword = ""
                                        accountMode = "login"
                                        val resultMessage = if (signedIn) strings.signedIn else
                                            strings.verificationSent + "\n\n" + email.trim() + "\n\n" + label(
                                                "Controleer ook je spammap. Open de link in de e-mail en kom daarna terug om in te loggen. Heb je al een account? Log dan in met je bestaande gegevens.",
                                                "Check your spam folder too. Open the email link, then return to sign in. Already have an account? Use your existing credentials.",
                                                "تحقق من البريد غير المرغوب فيه. افتح رابط الرسالة ثم عد لتسجيل الدخول. إذا كان لديك حساب، استخدم بياناتك الحالية.")
                                        notice = (if (signedIn) strings.signedIn else label("Controleer je e-mail", "Check your email", "تحقق من بريدك الإلكتروني")) to resultMessage
                                        resultMessage
                                    },
                                    onFailure = { authError(it).also { error -> notice = strings.createAccountFailed to error } }
                                )
                            }
                        }
                    },
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth().height(38.dp),
                    shape = RoundedCornerShape(AppShape.control),
                    colors = ButtonDefaults.buttonColors(containerColor = Gold)
                ) {
                    if (busy) CircularProgressIndicator(Modifier.size(18.dp), color = DarkNavy, strokeWidth = 2.dp)
                    else Text(strings.createAccount, color = DarkNavy, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                }
            }

            authenticatedUser?.let { signedInUser ->
                val userEmail = signedInUser.email.orEmpty()
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    strings.signedInAs(userEmail),
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
                            result.onSuccess { currentAccount = null }
                            message = result.fold(
                                onSuccess = { strings.signedOut },
                                onFailure = { it.localizedMessage ?: strings.signOutFailed }
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(strings.signOut, color = GoldLight, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            TextButton(
                onClick = { message = text.localOnlyMessage },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(strings.continueWithoutAccount, color = MutedGold, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun AccountProfilePanel(
    language: String,
    account: UserAccount?,
    email: String,
    profileName: String,
    profileNameInput: String,
    profileAvatarUrl: String?,
    onProfileNameChange: (String) -> Unit,
    onPickAvatar: () -> Unit,
    strings: AccountStrings,
    busy: Boolean,
    onSaveProfileName: () -> Unit,
    onSignOut: () -> Unit
) {
    var settingsOpen by remember { mutableStateOf(false) }
    val displayName = profileName.ifBlank {
        account?.displayName?.takeIf { it.isNotBlank() } ?: strings.signedIn
    }
    val avatarUrl = ProfileAvatarService.resolveAvatarUrl(
        customAvatarUrl = profileAvatarUrl ?: account?.customAvatarUrl,
        uploadedAvatarUrl = account?.uploadedAvatarUrl,
        googlePhotoUrl = account?.providerAvatarUrl
    )

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
        ProfileAvatar(
            avatarUrl = avatarUrl,
            fallbackText = displayName.ifBlank { email },
            size = 72.dp,
            onClick = onPickAvatar
        )
        TextButton(onClick = onPickAvatar, enabled = !busy) {
            Icon(Icons.Default.PhotoCamera, contentDescription = null, tint = GoldLight, modifier = Modifier.size(15.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text(strings.changePhoto, fontSize = 11.sp, color = GoldLight, fontWeight = FontWeight.Bold)
        }
        Text(displayName, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = GoldLight, textAlign = TextAlign.Center)
        Text(email, fontSize = 12.sp, color = MutedGold, textAlign = TextAlign.Center)
        Text(
            accountManagementText(language, if (account?.provider.equals("google", true)) "googleStatus" else "emailStatus"),
            fontSize = 11.sp,
            color = DoneGreen,
            textAlign = TextAlign.Center
        )
        OutlinedButton(
            onClick = { settingsOpen = !settingsOpen },
            modifier = Modifier.fillMaxWidth().height(38.dp),
            shape = RoundedCornerShape(AppShape.control),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight),
            border = BorderStroke(1.dp, BorderNavy)
        ) {
            Icon(Icons.Default.Settings, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text(strings.profileSettings, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
        AnimatedVisibility(visible = settingsOpen) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = onPickAvatar,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth().height(36.dp),
                    shape = RoundedCornerShape(AppShape.control),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight),
                    border = BorderStroke(1.dp, BorderNavy)
                ) {
                    Icon(Icons.Default.PhotoCamera, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(strings.changePhoto, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
                OutlinedTextField(
                    value = profileNameInput,
                    onValueChange = onProfileNameChange,
                    singleLine = true,
                    label = { Text(strings.profileNameLabel) },
                    placeholder = { Text(displayName) },
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
                    Text(
                        if (busy) strings.saving else strings.saveProfileName,
                        color = DarkNavy,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
        AccountManagementPanel(account = account, email = email, language = language, enabled = !busy)
        TextButton(
            onClick = onSignOut,
            enabled = !busy,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (busy) strings.signingOut else strings.signOut, color = GoldLight, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun ProfileAvatar(
    avatarUrl: String?,
    fallbackText: String,
    size: Dp,
    onClick: (() -> Unit)? = null
) {
    val clickableModifier = if (onClick == null) Modifier else Modifier.clickable(onClick = onClick)
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .background(StrongGoldSurface)
            .border(1.dp, Gold.copy(alpha = 0.55f), CircleShape)
            .then(clickableModifier),
        contentAlignment = Alignment.Center
    ) {
        if (!avatarUrl.isNullOrBlank()) {
            AsyncImage(
                model = avatarUrl,
                contentDescription = "Profielfoto",
                modifier = Modifier.fillMaxSize().clip(CircleShape),
                contentScale = ContentScale.Crop
            )
        } else {
            Text(
                profileAvatarInitial(fallbackText),
                fontSize = (size.value * 0.34f).sp,
                color = GoldLight,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun MediaSettingsPage(
    text: AppStrings,
    reciterOptions: List<SurahAudioOption>,
    selectedReciterName: String,
    selectedFilter: String,
    allFilterLabel: String,
    playbackSpeed: Float,
    onFilterChange: (String) -> Unit,
    onPlaybackSpeedChange: (Float) -> Unit,
    onSelectedReciterNameChange: (String) -> Unit,
    onSelectedReciterNameStartNow: (String) -> Unit,
    onBack: () -> Unit,
    appLanguage: String
) {
    var query by remember { mutableStateOf("") }
    var filterOpen by remember { mutableStateOf(false) }
    var speedOpen by remember { mutableStateOf(false) }
    val filters = remember(reciterOptions, allFilterLabel) {
        listOf(allFilterLabel) + reciterOptions.map { rewayaFilterLabel(it.rewayaName) }.distinct().sorted()
    }
    val filteredReciters = remember(reciterOptions, selectedFilter, query) {
        reciterOptions.filter {
            (selectedFilter == allFilterLabel || rewayaFilterLabel(it.rewayaName) == selectedFilter) &&
                (query.isBlank() || it.reciterName.contains(query.trim(), ignoreCase = true))
        }.sortedBy { it.reciterName }
    }
    val current = reciterOptions.firstOrNull { it.reciterName == selectedReciterName }
        ?: reciterOptions.firstOrNull().takeIf { selectedReciterName.isBlank() }

    SettingsCard {
        Row(Modifier.fillMaxWidth().padding(end = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, text.groupForm.back, tint = Gold)
            }
            Column(Modifier.weight(1f)) {
                Text(text.t("menu.media.title"), fontSize = 18.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                Text(text.t("menu.media.subtitle"), fontSize = 11.sp, color = MutedGold)
            }
        }
        SettingsDivider()
        Row(Modifier.fillMaxWidth().background(TodayDoneSurface).padding(start = 12.dp, end = 4.dp, top = 8.dp, bottom = 8.dp),
            verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(goalText(appLanguage, "Geselecteerde reciteur", "Selected reciter", "القارئ المختار"),
                    fontSize = 10.sp, color = MutedGold)
                Text(current?.reciterName ?: selectedReciterName.ifBlank { text.defaultReciter },
                    fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = GoldLight)
                current?.let { Text(it.rewayaName, fontSize = 10.sp, color = MutedGold) }
            }
            IconButton(onClick = { current?.let { onSelectedReciterNameStartNow(it.reciterName) } }, enabled = current != null) {
                Icon(Icons.Default.PlayArrow, text.quranAudioStartNow, tint = DoneGreen)
            }
        }
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(Modifier.weight(1f)) {
                    OutlinedButton(onClick = { filterOpen = true }, modifier = Modifier.fillMaxWidth(),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)) {
                        Text(selectedFilter, fontSize = 11.sp, modifier = Modifier.weight(1f), maxLines = 2)
                        Icon(Icons.Default.ArrowDropDown, text.t("menu.media.filter"), Modifier.size(18.dp))
                    }
                    DropdownMenu(expanded = filterOpen, onDismissRequest = { filterOpen = false }) {
                        filters.forEach { filter ->
                            DropdownMenuItem(text = { Text(filter) },
                                onClick = { onFilterChange(filter); filterOpen = false })
                        }
                    }
                }
                Box(Modifier.weight(1f)) {
                    OutlinedButton(onClick = { speedOpen = true }, modifier = Modifier.fillMaxWidth(),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)) {
                        Text(text.quranAudioPlaybackSpeedValue.format(playbackSpeed), fontSize = 12.sp)
                        Icon(Icons.Default.ArrowDropDown, text.quranAudioPlaybackSpeed, Modifier.size(18.dp))
                    }
                    DropdownMenu(expanded = speedOpen, onDismissRequest = { speedOpen = false }) {
                        listOf(0.75f, 1f, 1.25f, 1.5f, 1.75f, 2f).forEach { speed ->
                            DropdownMenuItem(text = { Text(text.quranAudioPlaybackSpeedValue.format(speed)) },
                                onClick = { onPlaybackSpeedChange(speed); speedOpen = false })
                        }
                    }
                }
            }
            OutlinedTextField(value = query, onValueChange = { query = it }, singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text(goalText(appLanguage, "Zoek reciteur", "Search reciters", "ابحث عن قارئ"), fontSize = 12.sp) },
                leadingIcon = { Icon(Icons.Default.Search, null, Modifier.size(18.dp)) },
                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = GoldLight, unfocusedTextColor = GoldLight,
                    focusedBorderColor = Gold, unfocusedBorderColor = BorderNavy))
            Text(goalText(appLanguage, "Tik op een naam om te kiezen · ▶ om te luisteren",
                "Tap a name to select · ▶ to listen", "اضغط على الاسم للاختيار · ▶ للاستماع"),
                fontSize = 10.sp, color = MutedGold)
        }
        SettingsDivider()
        if (filteredReciters.isEmpty()) {
            Text(text.t("menu.media.noReciters"), fontSize = 12.sp, color = MutedGold, modifier = Modifier.padding(12.dp))
        } else {
            filteredReciters.forEach { option ->
                SettingsReciterRow(
                    option = option,
                    selected = current?.reciterName == option.reciterName && current.rewayaName == option.rewayaName,
                    startNowLabel = text.quranAudioStartNow,
                    onClick = { onSelectedReciterNameChange(option.reciterName) },
                    onStartNow = { onSelectedReciterNameStartNow(option.reciterName) }
                )
            }
        }
    }
}

private data class MushafLibraryOption(
    val id: String,
    val title: String,
    val subtitle: String,
    val pages: String,
    val source: String,
    val bundled: Boolean,
    val packageType: String = "pdf",
    val downloadUrl: String? = null,
    val externalUrl: String? = null
)

private val mushafLibraryOptions = listOf(
    MushafLibraryOption(
        id = "hafs_maknoon",
        title = "Hafs - Maknoon",
        subtitle = "Losse Hafs-pagina's, scherp en snel",
        pages = "604 pagina's",
        source = "maknoon.com",
        bundled = false,
        packageType = "maknoon_png",
        downloadUrl = "https://maknoon.com/download/quran/hafs/"
    ),
    MushafLibraryOption(
        id = "hafs",
        title = "Hafs - Medina",
        subtitle = "Standaard mushaf in de app",
        pages = "604 pagina's",
        source = "Lokaal pakket",
        bundled = true
    ),
    MushafLibraryOption(
        id = "warsh_maknoon",
        title = "Warsh - Maknoon",
        subtitle = "Losse Warsh-pagina's, netter uitgelijnd",
        pages = "604 pagina's",
        source = "maknoon.com",
        bundled = false,
        packageType = "maknoon_svgz",
        downloadUrl = "https://maknoon.com/quran/warsh/"
    ),
    MushafLibraryOption(
        id = "hafs_madina_pdf",
        title = "Hafs - Madinah PDF",
        subtitle = "Complete Hafs Madani mushaf als downloadpakket",
        pages = "604 pagina's",
        source = "pdf.quran.ws",
        bundled = false,
        downloadUrl = "https://pdf.quran.ws/pdfs/hafs/quran-hafs-mushaf.pdf"
    ),
    MushafLibraryOption(
        id = "hafs_indopak_15",
        title = "Hafs - IndoPak 15-line",
        subtitle = "Bekende IndoPak-layout voor hifz en herhaling",
        pages = "PDF pakket",
        source = "downloadthequran.com",
        bundled = false,
        downloadUrl = "https://downloadthequran.com/wp-content/uploads/2023/01/15-Line-Standard-Quran-PDF.pdf"
    )
)

@Composable
private fun MushafSettingsPage(
    selectedMushafId: String,
    onSelectedMushafChange: (String) -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var downloadTick by remember { mutableIntStateOf(0) }
    var downloadingId by remember { mutableStateOf<String?>(null) }
    var statusMessage by remember { mutableStateOf<String?>(null) }
    var pendingDownload by remember { mutableStateOf<MushafLibraryOption?>(null) }
    var pendingDownloadSize by remember { mutableStateOf<String?>(null) }

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
                    Text("Mushaf-bibliotheek", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                    Text("Kies lokaal of download later een pakket", fontSize = 11.sp, color = MutedGold)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Icon(
                    Icons.AutoMirrored.Filled.MenuBook,
                    contentDescription = null,
                    tint = DoneGreen,
                    modifier = Modifier.size(SettingsMenuStyle.iconSize)
                )
            }
        }
        SettingsDivider()

        mushafLibraryOptions.forEach { option ->
            val installed = remember(option.id, downloadTick) { option.isInstalled(context) }
            MushafLibraryRow(
                option = option,
                installed = installed,
                downloading = downloadingId == option.id,
                selected = selectedMushafId == option.id,
                onUse = { onSelectedMushafChange(option.id) },
                onDownload = {
                    val url = option.downloadUrl
                    val externalUrl = option.externalUrl
                    if (externalUrl != null) {
                        runCatching {
                            context.startActivity(
                                Intent(Intent.ACTION_VIEW, Uri.parse(externalUrl))
                            )
                        }.onFailure {
                            statusMessage = "De downloadpagina kon niet geopend worden."
                        }
                    } else if (url == null) {
                        statusMessage = "Voor deze mushaf is nog geen downloadlink gekoppeld."
                    } else {
                        pendingDownload = option
                        pendingDownloadSize = "grootte ophalen..."
                        scope.launch {
                            pendingDownloadSize = withContext(Dispatchers.IO) { downloadSizeLabel(url) }
                        }
                    }
                }
            )
        }
    }

    statusMessage?.let { message ->
        AlertDialog(
            onDismissRequest = { if (downloadingId == null) statusMessage = null },
            containerColor = MidNavy,
            titleContentColor = GoldLight,
            textContentColor = LabelGold,
            title = { Text(if (downloadingId == null) "Mushaf-download" else "Download bezig") },
            text = {
                Text(message)
            },
            confirmButton = {
                if (downloadingId == null) {
                    TextButton(onClick = { statusMessage = null }) {
                        Text("Ok", color = Gold)
                    }
                }
            }
        )
    }

    pendingDownload?.let { option ->
        AlertDialog(
            onDismissRequest = {
                if (downloadingId == null) {
                    pendingDownload = null
                    pendingDownloadSize = null
                }
            },
            containerColor = MidNavy,
            titleContentColor = GoldLight,
            textContentColor = LabelGold,
            title = { Text(option.title) },
            text = {
                Text(
                    "Wil je deze mushaf downloaden?\n\n" +
                        "Bestandsgrootte: ${pendingDownloadSize ?: "grootte ophalen..."}"
                )
            },
            confirmButton = {
                TextButton(
                    enabled = downloadingId == null && pendingDownloadSize != "grootte ophalen...",
                    onClick = {
                        downloadingId = option.id
                        statusMessage = "${option.title} downloaden..."
                        scope.launch {
                            val result = runCatching {
                                withContext(Dispatchers.IO) {
                                    downloadMushafPdf(context, option) { progress ->
                                        scope.launch {
                                            statusMessage = progress
                                        }
                                    }
                                }
                            }
                            downloadingId = null
                            pendingDownload = null
                            pendingDownloadSize = null
                            if (result.isSuccess) {
                                downloadTick++
                                onSelectedMushafChange(option.id)
                                statusMessage = "${option.title} is gedownload en geselecteerd."
                            } else {
                                statusMessage = "Download mislukt. Controleer je internet en probeer opnieuw."
                            }
                        }
                    }
                ) {
                    Text(if (downloadingId == option.id) "Bezig..." else "Downloaden", color = Gold)
                }
            },
            dismissButton = {
                if (downloadingId == null) {
                    TextButton(onClick = {
                        pendingDownload = null
                        pendingDownloadSize = null
                    }) {
                        Text("Annuleren", color = MutedGold)
                    }
                }
            }
        )
    }
}

@Composable
private fun MushafLibraryRow(
    option: MushafLibraryOption,
    installed: Boolean,
    downloading: Boolean,
    selected: Boolean,
    onUse: () -> Unit,
    onDownload: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = SettingsMenuStyle.innerPadding, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            if (selected) Icons.Default.Check else Icons.AutoMirrored.Filled.MenuBook,
            contentDescription = null,
            tint = if (selected) DoneGreen else ChevronNavy,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
            Text(
                option.title,
                fontSize = 14.sp,
                color = if (selected) DoneGreen else GoldLight,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.End
            )
            Text(option.subtitle, fontSize = 10.sp, color = MutedGold, textAlign = TextAlign.End)
            Text("${option.pages} - ${option.source}", fontSize = 10.sp, color = DimGold, textAlign = TextAlign.End)
        }
        Spacer(modifier = Modifier.width(10.dp))
        if (installed) {
            TextButton(onClick = onUse, enabled = !selected) {
                Text(if (selected) "Actief" else "Gebruik", color = if (selected) DoneGreen else Gold)
            }
        } else {
            OutlinedButton(
                onClick = onDownload,
                enabled = !downloading,
                modifier = Modifier.height(32.dp),
                shape = RoundedCornerShape(AppShape.smallControl),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                border = BorderStroke(1.dp, Gold.copy(alpha = 0.45f)),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldLight)
            ) {
                Text(
                    when {
                        downloading -> "Bezig"
                        option.externalUrl != null -> "Open"
                        else -> "Download"
                    },
                    fontSize = 10.sp
                )
            }
        }
    }
}

private fun MushafLibraryOption.isInstalled(context: Context): Boolean =
    bundled || when (packageType) {
        "maknoon_svgz", "maknoon_png" -> downloadedMushafPageCount(context, id) >= MAKNOON_PAGE_COUNT
        else -> downloadedMushafPdfFile(context, id).let { it.exists() && it.length() > 0L }
    }

fun downloadedMushafPdfFile(context: Context, mushafId: String): File =
    externalMushafPdfFile(context, mushafId).takeIf { it.exists() && it.length() > 0L }
        ?: internalMushafPdfFile(context, mushafId)

private fun internalMushafPdfFile(context: Context, mushafId: String): File =
    File(File(context.filesDir, "downloaded_mushafs"), "$mushafId.pdf")

private fun externalMushafPdfFile(context: Context, mushafId: String): File =
    File(context.getExternalFilesDir("downloaded_mushafs"), "$mushafId.pdf")

fun downloadedMushafPageFile(context: Context, mushafId: String, page: Int): File =
    File(
        File(context.getExternalFilesDir("downloaded_mushafs"), mushafId),
        "${page.toString().padStart(3, '0')}.${downloadedMushafPageExtension(mushafId)}"
    )

fun downloadedMushafPageCount(context: Context, mushafId: String): Int {
    val folder = File(context.getExternalFilesDir("downloaded_mushafs"), mushafId)
    val extension = downloadedMushafPageExtension(mushafId)
    return folder.listFiles { file -> file.extension.equals(extension, ignoreCase = true) }?.size ?: 0
}

private fun downloadedMushafPageExtension(mushafId: String): String =
    if (mushafId == "hafs_maknoon") "png" else "svgz"

private fun downloadMushafPdf(
    context: Context,
    option: MushafLibraryOption,
    onProgress: (String) -> Unit = {}
) {
    if (option.packageType == "maknoon_svgz" || option.packageType == "maknoon_png") {
        downloadMaknoonPages(context, option, onProgress)
        return
    }
    val url = option.downloadUrl ?: return
    val target = downloadedMushafPdfFile(context, option.id)
    target.parentFile?.mkdirs()
    val temp = File(target.parentFile, "${option.id}.download")
    URL(url).openStream().use { input ->
        temp.outputStream().use { output ->
            input.copyTo(output)
        }
    }
    if (temp.length() <= 0L) error("Leeg downloadbestand")
    if (target.exists()) target.delete()
    temp.renameTo(target)
}

private const val MAKNOON_PAGE_COUNT = 604

private fun downloadMaknoonPages(
    context: Context,
    option: MushafLibraryOption,
    onProgress: (String) -> Unit
) {
    val baseUrl = option.downloadUrl?.trimEnd('/') ?: return
    val remoteExtension = if (option.packageType == "maknoon_png") "png" else "svgz"
    val folder = File(context.getExternalFilesDir("downloaded_mushafs"), option.id)
    folder.mkdirs()
    for (page in 1..MAKNOON_PAGE_COUNT) {
        val target = downloadedMushafPageFile(context, option.id, page)
        if (target.exists() && target.length() > 0L) continue
        onProgress("${option.title} downloaden...\nPagina $page van $MAKNOON_PAGE_COUNT")
        val temp = File(folder, "${page.toString().padStart(3, '0')}.download")
        var downloaded = false
        var lastError: Exception? = null
        for (attempt in 1..3) {
            try {
                if (temp.exists()) temp.delete()
                val connection = (URL("$baseUrl/$page.$remoteExtension").openConnection() as HttpURLConnection).apply {
                    connectTimeout = 15000
                    readTimeout = 30000
                }
                connection.inputStream.use { input ->
                    temp.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }
                connection.disconnect()
                lastError = null
                downloaded = true
                break
            } catch (e: Exception) {
                lastError = e
            }
        }
        if (!downloaded) lastError?.let { throw it }
        if (temp.length() <= 0L) error("Lege pagina-download")
        if (target.exists()) target.delete()
        temp.renameTo(target)
    }
    onProgress("${option.title} is klaar.")
}

private fun downloadSizeLabel(url: String): String {
    if (url.trimEnd('/') == "https://maknoon.com/quran/warsh") {
        return "ongeveer 60 MB (604 pagina's)"
    }
    if (url.trimEnd('/') == "https://maknoon.com/download/quran/hafs") {
        return "ongeveer 70 MB (604 pagina's)"
    }
    return try {
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "HEAD"
            connectTimeout = 7000
            readTimeout = 7000
        }
        val bytes = connection.contentLengthLong
        connection.disconnect()
        if (bytes > 0) {
            val mb = bytes / (1024.0 * 1024.0)
            "%.1f MB".format(Locale.US, mb)
        } else {
            "onbekend"
        }
    } catch (e: Exception) {
        "onbekend"
    }
}

@Composable
private fun SettingsHeader(text: AppStrings, onClose: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(SettingsMenuStyle.rowHeight),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text.t("settings.title"), fontSize = 18.sp, fontWeight = FontWeight.Bold,
            color = GoldLight, modifier = Modifier.padding(start = SettingsMenuStyle.innerPadding).weight(1f))
        IconButton(onClick = onClose) {
            Icon(Icons.Default.Close, contentDescription = text.groupForm.back, tint = MutedGold)
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
    startNowLabel: String,
    onClick: () -> Unit,
    onStartNow: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .background(if (selected) TodayDoneSurface.copy(alpha = 0.45f) else Color.Transparent)
            .padding(start = 12.dp, end = 4.dp, top = 4.dp, bottom = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.Start) {
            Text(
                option.reciterName,
                fontSize = 13.sp,
                color = if (selected) DoneGreen else GoldLight,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                textAlign = TextAlign.Start
            )
            Text(option.rewayaName, fontSize = 10.sp, color = MutedGold, textAlign = TextAlign.Start)
        }
        Spacer(modifier = Modifier.width(10.dp))
        IconButton(
            onClick = onStartNow,
            modifier = Modifier.size(48.dp)
        ) {
            Icon(
                Icons.Default.PlayArrow,
                contentDescription = startNowLabel,
                tint = if (selected) DoneGreen else ChevronNavy,
                modifier = Modifier.size(17.dp)
            )
        }
        if (selected) {
            Icon(
                Icons.Default.Check,
                contentDescription = null,
                tint = DoneGreen,
                modifier = Modifier.size(16.dp)
            )
        }
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
            .size(30.dp)
            .clip(CircleShape)
            .background(color)
            .border(1.5.dp, if (selected) DoneGreen else BorderNavy, CircleShape)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        if (selected) {
            Icon(Icons.Default.Check, contentDescription = null, tint = DoneGreen, modifier = Modifier.size(17.dp))
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
    text: AppStrings,
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
    val typeOptions = listOf(
        "surah" to text.t("unit.surah"),
        "hizb" to text.t("unit.hizb"),
        "juz" to text.t("unit.juz")
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = SettingsMenuStyle.innerPadding, vertical = 4.dp)
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            typeOptions.forEach { (type, label) ->
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
            HifzRangeField(Modifier.weight(1f), text.t("hifz.range.from"), from, max = max, onValueChange = onFromChange)
            HifzRangeField(Modifier.weight(1f), text.t("hifz.range.to"), to, max = max, onValueChange = onToChange)
            HifzRangeField(Modifier.weight(1f), text.t("hifz.range.score"), score, min = 0, max = 100, onValueChange = onScoreChange)
        }

        Spacer(modifier = Modifier.height(8.dp))

        Button(
            onClick = onSave,
            modifier = Modifier.fillMaxWidth().height(38.dp),
            shape = RoundedCornerShape(AppShape.control),
            colors = ButtonDefaults.buttonColors(containerColor = if (saved) DoneGreen else Gold)
        ) {
            Text(
                if (saved) text.t("hifz.range.saved") else text.t("hifz.range.apply"),
                fontSize = 12.sp,
                color = DarkNavy,
                fontWeight = FontWeight.Bold
            )
        }

        Text(text.t("hifz.range.limit", 1, max), fontSize = 10.sp, color = MutedGold, modifier = Modifier.padding(top = 4.dp))
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
    text: AppStrings,
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
    val unitOptions = listOf(
        "rub" to text.t("unit.rub"),
        "hizb" to text.t("unit.hizb"),
        "juz" to text.t("unit.juz"),
        "pages" to text.t("unit.page.short"),
        "ayahs" to text.t("unit.ayah.other")
    )

    Column(modifier = Modifier.padding(horizontal = SettingsMenuStyle.innerPadding)) {
        Text(text.t("dailyGoal.unit"), fontSize = 11.sp, color = MutedGold, modifier = Modifier.padding(bottom = 6.dp, top = 2.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            unitOptions.forEach { (unit, label) ->
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
        Text(text.t("dailyGoal.targetPerDay"), fontSize = 11.sp, color = MutedGold, modifier = Modifier.padding(bottom = 6.dp))
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
        Text(text.t("dailyGoal.max", targetMax, unitLabel(selectedUnit)), fontSize = 10.sp, color = DimGold, modifier = Modifier.padding(top = 4.dp))

        Spacer(modifier = Modifier.height(8.dp))
        Text(text.t("dailyGoal.reminder"), fontSize = 11.sp, color = MutedGold, modifier = Modifier.padding(bottom = 6.dp))
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
            Text(if (saved) text.groupForm.saveSuccess else text.t("common.save"), fontSize = 12.sp, color = DarkNavy, fontWeight = FontWeight.Bold)
        }
        Spacer(modifier = Modifier.height(14.dp))
    }
}

@Composable
private fun ReadingJourneyEditor(
    text: AppStrings,
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
                Text(text.readingGoal, fontSize = 13.sp, color = GoldLight, fontWeight = FontWeight.Bold)
                Text(
                    if (enabled) text.readingJourneyActive else text.readingJourneyInactive,
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
        Text(text.t("readingJourney.daysCount"), fontSize = 11.sp, color = MutedGold, modifier = Modifier.padding(bottom = 6.dp))
        EditableStepperRow(
            value = days,
            suffix = text.days,
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
                Text(text.t("readingJourney.autoDailyGoal"), fontSize = 12.sp, color = GoldLight, fontWeight = FontWeight.Bold)
                Text(
                    text.t("readingJourney.autoDailyGoalPreview", derivedGoal.second, dailyGoalUnitLabel(derivedGoal.first)),
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
                text.t(if (saved) "readingJourney.saved" else "readingJourney.save"),
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
                .size(AppComponentDefaults.minTouchTarget)
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
                .size(AppComponentDefaults.minTouchTarget)
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
                .size(AppComponentDefaults.minTouchTarget)
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
                .size(AppComponentDefaults.minTouchTarget)
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

fun themeModeLabel(themeMode: String, text: AppStrings): String = when (themeMode) {
    "matte_forest" -> text.t("theme.matteForest")
    "matte_charcoal" -> text.t("theme.matteCharcoal")
    "matte_manuscript" -> text.t("theme.matteManuscript")
    "dark" -> text.darkTheme
    "pink" -> "Roze thema"
    "mint" -> "Mint thema"
    "lavender" -> "Lavendel thema"
    "ember" -> "Vurig rood thema"
    "inferno" -> "Gloeiend vuur thema"
    "ocean" -> "Oceaan thema"
    "sand" -> "Zand thema"
    else -> text.lightTheme
}

fun mushafDisplayName(mushafId: String): String =
    mushafLibraryOptions.firstOrNull { it.id == mushafId }?.title ?: "Hafs - Medina"

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

private fun formatGroupCodeInput(value: String): String {
    if (value.trim().contains("://")) return value.trim()
    val clean = value
        .filter { it.isLetterOrDigit() }
        .uppercase()
        .take(7)
    return if (clean.length <= 3) clean else "${clean.take(3)}-${clean.drop(3)}"
}

private fun isValidGroupCode(value: String): Boolean =
    Regex("^[A-Z0-9]{3}-[0-9]{4}$").matches(value.trim().uppercase())

private fun contentUriDisplayName(context: Context, uri: Uri): String {
    val resolved = runCatching {
        context.contentResolver.query(
            uri,
            arrayOf(OpenableColumns.DISPLAY_NAME),
            null,
            null,
            null
        )?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (nameIndex >= 0 && cursor.moveToFirst()) cursor.getString(nameIndex) else null
        }
    }.getOrNull()
    return resolved
        ?.trim()
        ?.takeIf(String::isNotBlank)
        ?.take(255)
        ?: uri.lastPathSegment?.substringAfterLast('/')?.take(255)?.takeIf(String::isNotBlank)
        ?: "groepsfoto.jpg"
}

private fun formatGroupMediaSize(bytes: Long): String = when {
    bytes >= 1024L * 1024L -> String.format(Locale.getDefault(), "%.1f MB", bytes / (1024f * 1024f))
    bytes >= 1024L -> String.format(Locale.getDefault(), "%.0f KB", bytes / 1024f)
    else -> "$bytes B"
}

private fun defaultGroupEventDate(): String {
    val tomorrow = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, 1) }.time
    return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(tomorrow)
}

private fun parseGroupEventWindow(date: String, time: String, durationMinutes: Int): Pair<String, String>? {
    val localFormat = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).apply { isLenient = false }
    val start = runCatching { localFormat.parse("${date.trim()} ${time.trim()}") }.getOrNull() ?: return null
    val end = Date(start.time + durationMinutes.coerceIn(15, 24 * 60) * 60_000L)
    val apiFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }
    return apiFormat.format(start) to apiFormat.format(end)
}

private fun groupEventDateLabel(value: String): String {
    val parsed = listOf(
        "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
        "yyyy-MM-dd'T'HH:mm:ss'Z'"
    ).firstNotNullOfOrNull { pattern ->
        runCatching {
            SimpleDateFormat(pattern, Locale.US).apply {
                isLenient = false
                if (pattern.endsWith("'Z'")) timeZone = TimeZone.getTimeZone("UTC")
            }.parse(value)
        }.getOrNull()
    } ?: return value.take(16).replace('T', ' ')
    return SimpleDateFormat("dd-MM-yyyy · HH:mm", Locale.getDefault()).format(parsed)
}

private fun normalizeGroupType(value: String): String = when (value.trim().lowercase()) {
    GROUP_TYPE_COMPLETE_TOGETHER, "khatma" -> GROUP_TYPE_COMPLETE_TOGETHER
    GROUP_TYPE_DAILY_TILAWAH, "daily", "day", "week" -> GROUP_TYPE_DAILY_TILAWAH
    GROUP_TYPE_MEMORIZATION, "hifz" -> GROUP_TYPE_MEMORIZATION
    GROUP_TYPE_MURAJAAH, "muraja'ah", "murajaʿah" -> GROUP_TYPE_MURAJAAH
    GROUP_TYPE_TAFSIR_STUDY, "study", "tafsir" -> GROUP_TYPE_TAFSIR_STUDY
    GROUP_TYPE_CUSTOM -> GROUP_TYPE_CUSTOM
    else -> GROUP_TYPE_FREE_READING
}

private fun normalizeProgressUnit(value: String): String = when (value.trim().lowercase()) {
    PROGRESS_UNIT_PAGE, "pages" -> PROGRESS_UNIT_PAGE
    PROGRESS_UNIT_AYAH, "ayahs", "ayat" -> PROGRESS_UNIT_AYAH
    PROGRESS_UNIT_HIZB -> PROGRESS_UNIT_HIZB
    PROGRESS_UNIT_JUZ -> PROGRESS_UNIT_JUZ
    PROGRESS_UNIT_SURAH, "sura", "soera" -> PROGRESS_UNIT_SURAH
    PROGRESS_UNIT_LESSON -> PROGRESS_UNIT_LESSON
    PROGRESS_UNIT_CUSTOM -> PROGRESS_UNIT_CUSTOM
    else -> PROGRESS_UNIT_PAGE
}

private fun normalizeGoalPeriod(value: String): String = when (value.trim().lowercase()) {
    GOAL_PERIOD_DAILY, "day", "per_day" -> GOAL_PERIOD_DAILY
    GOAL_PERIOD_WEEKLY, "week", "per_week" -> GOAL_PERIOD_WEEKLY
    GOAL_PERIOD_MONTHLY, "month", "per_month" -> GOAL_PERIOD_MONTHLY
    GOAL_PERIOD_TOTAL, "total" -> GOAL_PERIOD_TOTAL
    else -> GOAL_PERIOD_NONE
}

private fun normalizeGroupPrivacy(value: String): String = when (value.trim().lowercase()) {
    GROUP_PRIVACY_INVITE_ONLY, "invite", "private" -> GROUP_PRIVACY_INVITE_ONLY
    GROUP_PRIVACY_PUBLIC, "open" -> GROUP_PRIVACY_PUBLIC
    else -> GROUP_PRIVACY_CODE_ONLY
}

private fun groupPrivacyBackendValue(value: String): String = when (normalizeGroupPrivacy(value)) {
    GROUP_PRIVACY_PUBLIC -> "public"
    GROUP_PRIVACY_INVITE_ONLY -> "private"
    else -> "restricted"
}

private fun formatGoalSummary(
    text: AppStrings,
    goalPeriod: String,
    goalTarget: Int?,
    progressUnit: String
): String {
    val normalizedPeriod = normalizeGoalPeriod(goalPeriod)
    if (normalizedPeriod == GOAL_PERIOD_NONE) return text.groupGoalText.noFixedGoalSummary
    val target = goalTarget ?: return text.groupGoalText.valueRequired
    if (target <= 0) return text.groupGoalText.valueMustBePositive
    return text.groupGoalText.summary.format(
        target,
        formatGoalUnit(text, progressUnit, target),
        goalPeriodPhrase(text, normalizedPeriod)
    )
}

private fun formatGoalUnit(text: AppStrings, unit: String, count: Int): String = when (normalizeProgressUnit(unit)) {
    PROGRESS_UNIT_PAGE -> if (count == 1) text.groupUnitOption.page.lowercase() else text.groupUnitOption.pages
    PROGRESS_UNIT_AYAH -> if (count == 1) text.groupUnitOption.ayah.lowercase() else text.groupUnitOption.ayahs
    PROGRESS_UNIT_HIZB -> if (count == 1) text.groupUnitOption.hizb.lowercase() else text.groupUnitOption.hizbs
    PROGRESS_UNIT_JUZ -> if (count == 1) text.groupUnitOption.juz.lowercase() else text.groupUnitOption.juzs
    PROGRESS_UNIT_SURAH -> if (count == 1) text.groupUnitOption.surah.lowercase() else text.groupUnitOption.surahs
    PROGRESS_UNIT_LESSON -> if (count == 1) text.groupUnitOption.lesson.lowercase() else text.groupUnitOption.lessons
    PROGRESS_UNIT_CUSTOM -> if (count == 1) text.groupUnitOption.custom.lowercase() else text.groupUnitOption.customs
    else -> unit
}

private fun Int.toGoalUnitAmount(unit: String): Int =
    ReadingMetrics.goalUnitAmount(this, unit)

private fun goalPeriodPhrase(text: AppStrings, goalPeriod: String): String = when (normalizeGoalPeriod(goalPeriod)) {
    GOAL_PERIOD_DAILY -> text.groupGoalText.daily.lowercase()
    GOAL_PERIOD_WEEKLY -> text.groupGoalText.weekly.lowercase()
    GOAL_PERIOD_MONTHLY -> text.groupGoalText.monthly.lowercase()
    GOAL_PERIOD_TOTAL -> text.groupGoalText.totalSummary
    else -> text.groupGoalText.noFixedGoal.lowercase()
}

private fun groupUnitLabel(unit: String, amount: Int): String = when (unit) {
    "ayah" -> if (amount == 1) "ayah" else "ayat"
    "page" -> if (amount == 1) "pagina" else "pagina's"
    "hizb" -> "hizb"
    "juz" -> "juz"
    "surah" -> if (amount == 1) "soera" else "soera's"
    else -> unit
}

private fun groupProgressLabel(unit: String, number: Int, amount: Int): String = when (unit) {
    "surah" -> {
        val surah = ALL_SURAHS.find { it.id == number }
        if (surah == null) "Soera $number" else "Soera ${surah.id} - ${surah.name} (${surah.arabic})"
    }
    "juz" -> "Juz ${number.coerceIn(1, 30)}"
    "hizb" -> {
        val safeNumber = number.coerceIn(1, 60)
        val hizb = getHizbInfo(safeNumber)
        if (hizb == null) {
            "Hizb $safeNumber"
        } else {
            "Hizb $safeNumber - ${hizb.surahArabic} ${hizb.surahNumber}:${hizb.ayahNumber}"
        }
    }
    "page" -> "$amount ${groupUnitLabel(unit, amount)}"
    "ayah" -> "$amount ${groupUnitLabel(unit, amount)}"
    else -> "$amount ${groupUnitLabel(unit, amount)}"
}

private fun groupProgressPreview(unit: String, number: Int, amount: Int, text: AppStrings? = null): GroupProgressPreview {
    val safeUnit = normalizeProgressUnit(unit)
    val safeAmount = amount.coerceAtLeast(1)
    val safeNumber = when (safeUnit) {
        PROGRESS_UNIT_HIZB -> number.coerceIn(1, 60)
        PROGRESS_UNIT_JUZ -> number.coerceIn(1, 30)
        PROGRESS_UNIT_SURAH -> number.coerceIn(1, 114)
        else -> number.coerceAtLeast(1)
    }
    val measurement = ReadingMetrics.measure(safeUnit, safeAmount, safeNumber)
    val ayahEquivalent = measurement.ayahEquivalent
    val pages = measurement.pageEquivalent
    val points = measurement.points
    return when (safeUnit) {
        PROGRESS_UNIT_HIZB -> {
            val hizb = getHizbInfo(safeNumber)
            GroupProgressPreview(
                title = "Hizb $safeNumber",
                subtitle = hizb?.let { "${it.surahArabic} ${it.surahNumber}:${it.ayahNumber}" } ?: "Hizb $safeNumber",
                pages = pages,
                points = points,
                details = (text?.t("group.startPage") ?: "Startpagina") + " ${((safeNumber - 1) * ReadingMetrics.pageEquivalent(ReadingMetrics.ayahsPerHizb) + 1).coerceAtLeast(1)}"
            )
        }
        PROGRESS_UNIT_JUZ -> {
            val firstHizb = getHizbInfo(((safeNumber - 1) * 2 + 1).coerceIn(1, 60))
            GroupProgressPreview(
                title = "Juz $safeNumber",
                subtitle = firstHizb?.let { "${it.surahArabic} ${it.surahNumber}:${it.ayahNumber}" } ?: "Juz $safeNumber",
                pages = pages,
                points = points,
                details = (text?.t("group.startPage") ?: "Startpagina") + " ${((safeNumber - 1) * ReadingMetrics.pageEquivalent(ReadingMetrics.ayahsPerJuz) + 1).coerceAtLeast(1)}"
            )
        }
        PROGRESS_UNIT_SURAH -> {
            val surah = ALL_SURAHS.find { it.id == safeNumber }
            GroupProgressPreview(
                title = surah?.let { "Soera ${it.id} - ${it.name}" } ?: "Soera $safeNumber",
                subtitle = surah?.arabic.orEmpty(),
                pages = pages,
                points = points,
                details = "${surah?.ayahs ?: ReadingMetrics.surahAyahCount(safeNumber)} ayat"
            )
        }
        else -> GroupProgressPreview(
            title = "$safeAmount ${groupUnitLabel(PROGRESS_UNIT_PAGE, safeAmount)}",
            subtitle = text?.t("group.manualPageProgress") ?: "Handmatige pagina-voortgang",
            pages = safeAmount,
            points = points,
            details = text?.t("group.ayahEquivalent", ayahEquivalent) ?: "$ayahEquivalent ayat-equivalent"
        )
    }
}

private fun groupFeedTimeLabel(createdAt: String): String {
    if (createdAt.isBlank()) return ""
    return createdAt
        .replace("T", " ")
        .substringBefore(".")
        .take(16)
}

private fun profileAvatarInitial(text: String): String =
    text.trim().firstOrNull()?.uppercaseChar()?.toString() ?: "?"

data class ReaderBookmarkSummary(
    val title: String,
    val subtitle: String,
    val surahId: Int,
    val ayahNumber: Int? = null,
    val warshPage: Int? = null,
    val openInMushaf: Boolean = false
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

private fun translationMenuStrings(language: String): Pair<String, String> {
    return when (language) {
        "en" -> "Translation" to "Saheeh International and Sofian S. Siregar"
        "ar" -> "الترجمة" to "صحيح إنترناشونال وسفيان س. سيرغار"
        "fr" -> "Traduction" to "Saheeh International et Sofian S. Siregar"
        else -> "Vertaling" to "Saheeh International en Sofian S. Siregar"
    }
}

