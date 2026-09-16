package com.Ameender.qurantracker

import android.Manifest
import android.content.Intent
import android.os.Bundle
import android.os.Build
import android.content.pm.PackageManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.core.view.WindowCompat
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.navDeepLink
import androidx.navigation.compose.*
import com.Ameender.qurantracker.data.SupabaseConfig
import com.Ameender.qurantracker.data.NoteScope
import com.Ameender.qurantracker.data.QuranNoteTarget
import com.Ameender.qurantracker.data.target
import com.Ameender.qurantracker.data.SupabaseService
import com.Ameender.qurantracker.ui.*
import com.Ameender.qurantracker.viewmodel.AyahNoteViewModel
import com.Ameender.qurantracker.viewmodel.GoalViewModel
import com.Ameender.qurantracker.viewmodel.PlanningViewModel
import com.Ameender.qurantracker.viewmodel.QuranViewModel
import com.Ameender.qurantracker.viewmodel.QuranTrackerViewModelFactory
import kotlinx.coroutines.delay

sealed class Screen(val route: String, val label: String) {
    object Dashboard : Screen("dashboard", "Home")
    object Hizb      : Screen("hizb",      "Hizb")
    object Juzz      : Screen("juzz",      "Juz")
    object Surahs    : Screen("surahs",    "Soera")
    object Reader    : Screen("reader",    "Quran")
    object Tafsir    : Screen("tafsir",    "Tafsir")
    object Mutashabihat : Screen("mutashabihat", "Mutashabihat")
    object Translation : Screen("translation", "Vertaling")
    object BookReader : Screen("book_reader", "Minhaj al-Talibin")
    object Notes     : Screen("notes",     "Notities")
    object Focus     : Screen("focus",     "Focus")
    object Groups    : Screen("groups",    "Groepen")
    object ReadingPlan : Screen("reading_plan", "Mijn leesplan")
    object Notifications : Screen("notifications", "Notificaties")
    object DailyGoal : Screen("daily_goal", "Dagelijks doel")
    object Stats     : Screen("stats",     "Stats")
    object Agenda    : Screen("agenda",    "Agenda")
}

class MainActivity : ComponentActivity() {
    private val notificationDestination = mutableStateOf<String?>(null)
    private val pendingGroupInviteCode = mutableStateOf<String?>(null)
    private val pendingGroupInviteToken = mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        notificationDestination.value = notificationRoute(intent)
        pendingGroupInviteCode.value = groupInviteCodeFrom(intent)
        pendingGroupInviteToken.value = groupInviteTokenFrom(intent)
        try {
            SupabaseService.handleDeeplinks(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1001)
        }
        com.Ameender.qurantracker.notifications.NotificationCoordinator.initialize(this)
        setContent {
            val prefs = remember { getSharedPreferences("settings", MODE_PRIVATE) }
            var themeMode by remember {
                mutableStateOf(prefs.getString("theme_mode", "light") ?: "light")
            }
            var hifzTintEnabled by remember {
                mutableStateOf(prefs.getBoolean("hifz_tint_enabled", false))
            }
            var mushafMode by remember {
                val savedMushaf = prefs.getString("mushaf_mode", "hafs") ?: "hafs"
                val maknoonWarshReady = downloadedMushafPageCount(this@MainActivity, "warsh_maknoon") >= 604
                val maknoonHafsReady = downloadedMushafPageCount(this@MainActivity, "hafs_maknoon") >= 604
                val initialMushaf = when {
                    savedMushaf == "warsh" || savedMushaf == "warsh_quran_world" ->
                        if (maknoonWarshReady) "warsh_maknoon" else "hafs"
                    savedMushaf == "hafs" && maknoonHafsReady -> "hafs_maknoon"
                    else -> savedMushaf
                }
                if (initialMushaf != savedMushaf) {
                    prefs.edit().putString("mushaf_mode", initialMushaf).apply()
                }
                mutableStateOf(initialMushaf)
            }
            var appLanguage by remember {
                mutableStateOf(prefs.getString("app_language", "nl") ?: "nl")
            }
            var selectedReciterName by remember {
                mutableStateOf(prefs.getString("selected_reciter_name", "") ?: "")
            }
            val savedPlaybackSpeed = remember {
                prefs.getFloat("audio_playback_speed", 1f)
            }
            val savedSkipInterval = remember {
                prefs.getInt("audio_skip_interval_seconds", 10)
            }
            val savedRepeatEnabled = remember {
                prefs.getBoolean("audio_repeat_enabled", false)
            }
            val savedAutoplayEnabled = remember {
                prefs.getBoolean("audio_autoplay_enabled", true)
            }

            val layoutDirection = if (appLanguage == "ar") LayoutDirection.Rtl else LayoutDirection.Ltr
            CompositionLocalProvider(LocalLayoutDirection provides layoutDirection) {
                QuranTrackerTheme(themeMode = themeMode) {
                    SideEffect {
                        window.statusBarColor = DarkNavy.toArgb()
                        window.navigationBarColor = DarkNavy.toArgb()
                        val useDarkSystemIcons = DarkNavy.luminance() > 0.5f
                        WindowCompat.getInsetsController(window, window.decorView).apply {
                            isAppearanceLightStatusBars = useDarkSystemIcons
                            isAppearanceLightNavigationBars = useDarkSystemIcons
                        }
                    }
                    val viewModelFactory = remember {
                        QuranTrackerViewModelFactory(application)
                    }
                    QuranTrackerApp(
                        viewModelFactory = viewModelFactory,
                        themeMode = themeMode,
                        onThemeModeChange = { newMode ->
                            themeMode = newMode
                            prefs.edit().putString("theme_mode", newMode).apply()
                        },
                        hifzTintEnabled = hifzTintEnabled,
                        onHifzTintEnabledChange = { enabled ->
                            hifzTintEnabled = enabled
                            prefs.edit().putBoolean("hifz_tint_enabled", enabled).apply()
                        },
                        mushafMode = mushafMode,
                        onMushafModeChange = { newMode ->
                            mushafMode = newMode
                            prefs.edit().putString("mushaf_mode", newMode).apply()
                        },
                        appLanguage = appLanguage,
                        onAppLanguageChange = { newLanguage ->
                            appLanguage = newLanguage
                            prefs.edit().putString("app_language", newLanguage).apply()
                        },
                        selectedReciterName = selectedReciterName,
                        onSelectedReciterNameChange = { reciterName ->
                            selectedReciterName = reciterName
                            prefs.edit().putString("selected_reciter_name", reciterName).apply()
                        },
                        initialPlaybackSpeed = savedPlaybackSpeed,
                        onPlaybackSpeedChange = { speed ->
                            prefs.edit().putFloat("audio_playback_speed", speed).apply()
                        },
                        initialSkipIntervalSeconds = savedSkipInterval,
                        onSkipIntervalChange = { seconds ->
                            prefs.edit().putInt("audio_skip_interval_seconds", seconds).apply()
                        },
                        initialRepeatEnabled = savedRepeatEnabled,
                        onRepeatEnabledChange = { enabled ->
                            prefs.edit().putBoolean("audio_repeat_enabled", enabled).apply()
                        },
                        initialAutoplayEnabled = savedAutoplayEnabled,
                        onAutoplayEnabledChange = { enabled ->
                            prefs.edit().putBoolean("audio_autoplay_enabled", enabled).apply()
                        },
                        groupInviteCode = pendingGroupInviteCode.value,
                        groupInviteToken = pendingGroupInviteToken.value,
                        onGroupInviteConsumed = {
                            pendingGroupInviteCode.value = null
                            pendingGroupInviteToken.value = null
                        },
                        notificationDestination = notificationDestination.value,
                        onNotificationConsumed = { notificationDestination.value = null }
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        notificationDestination.value = notificationRoute(intent)
        pendingGroupInviteCode.value = groupInviteCodeFrom(intent)
        pendingGroupInviteToken.value = groupInviteTokenFrom(intent)
        SupabaseService.handleDeeplinks(intent)
    }

    private fun notificationRoute(intent: Intent): String? {
        val uri = intent.data ?: return null
        if (uri.scheme != "qurantracker" || uri.host != "notification") return null
        val route = uri.pathSegments.firstOrNull()?.takeIf { it == "daily_goal" || it == "agenda" } ?: return null
        val itemId = uri.pathSegments.getOrNull(1)?.toIntOrNull()?.takeIf { it > 0 }
        return if (route == "agenda" && itemId != null) "agenda?itemId=$itemId" else route
    }

    private fun groupInviteCodeFrom(intent: Intent?): String? {
        val data = intent?.data ?: return null
        val code = when {
            data.scheme == SupabaseConfig.DEEPLINK_SCHEME && data.host == "group" ->
                data.pathSegments.firstOrNull()
            data.scheme == "https" && data.host == "qurantracker.app" && data.pathSegments.firstOrNull() == "group" ->
                data.pathSegments.getOrNull(1)
            else -> null
        }
        return code
            ?.trim()
            ?.uppercase()
            ?.takeIf { it.isNotBlank() }
    }

    private fun groupInviteTokenFrom(intent: Intent?): String? {
        return intent?.data?.getQueryParameter("invite")
            ?.trim()
            ?.takeIf { it.length in 32..160 }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuranTrackerApp(
    viewModelFactory: QuranTrackerViewModelFactory,
    themeMode: String,
    onThemeModeChange: (String) -> Unit,
    hifzTintEnabled: Boolean,
    onHifzTintEnabledChange: (Boolean) -> Unit,
    mushafMode: String,
    onMushafModeChange: (String) -> Unit,
    appLanguage: String,
    onAppLanguageChange: (String) -> Unit,
    selectedReciterName: String,
    onSelectedReciterNameChange: (String) -> Unit,
    initialPlaybackSpeed: Float,
    onPlaybackSpeedChange: (Float) -> Unit,
    initialSkipIntervalSeconds: Int,
    onSkipIntervalChange: (Int) -> Unit,
    initialRepeatEnabled: Boolean,
    onRepeatEnabledChange: (Boolean) -> Unit,
    initialAutoplayEnabled: Boolean,
    onAutoplayEnabledChange: (Boolean) -> Unit,
    groupInviteCode: String?,
    groupInviteToken: String?,
    onGroupInviteConsumed: () -> Unit,
    notificationDestination: String? = null,
    onNotificationConsumed: () -> Unit = {}
) {
    val navController       = rememberNavController()
    LaunchedEffect(notificationDestination) {
        notificationDestination?.let { route ->
            navController.navigate(route) { launchSingleTop = true }
            onNotificationConsumed()
        }
    }
    val context = LocalContext.current
                    val viewModel: QuranViewModel = viewModel(factory = viewModelFactory)
                    val goalViewModel: GoalViewModel = viewModel(factory = viewModelFactory)
                    val planningViewModel: PlanningViewModel = viewModel(factory = viewModelFactory)
                    val ayahNoteViewModel: AyahNoteViewModel = viewModel(factory = viewModelFactory)
    val text = AppText.strings(appLanguage)

    var menuOpen by remember { mutableStateOf(false) }
    var readerBookmarkTarget by remember { mutableStateOf<ReaderBookmarkSummary?>(null) }
    var focusGoalKey by remember { mutableStateOf("reading") }
    var focusMinutes by remember { mutableIntStateOf(25) }
    var focusRemainingSeconds by remember { mutableIntStateOf(25 * 60) }
    var focusIsRunning by remember { mutableStateOf(false) }
    var focusIsFinished by remember { mutableStateOf(false) }
    var groupDetailMode by remember { mutableStateOf(false) }
    var notesEditorMode by remember { mutableStateOf(false) }
    var readerMode by remember { mutableStateOf(false) }
    var activeGoalSession by remember { mutableStateOf<Int?>(null) }
    var finishGoalSession by remember { mutableStateOf(false) }
    val allNotes by ayahNoteViewModel.allNotes.collectAsState()
    val noteCounts = remember(allNotes) { allNotes.groupingBy { it.target() }.eachCount() }
    fun countsFor(scope: NoteScope) = noteCounts.filterKeys { it.scope == scope }.mapKeys { it.key.number }
    fun openNotes(target: QuranNoteTarget) {
        navController.navigate("notes/${target.scope.key}/${target.number}/${target.ayah ?: 0}") { launchSingleTop = true }
    }
    val audioPlayer = rememberGlobalAudioPlayer(
        initialPlaybackSpeed = initialPlaybackSpeed,
        initialSkipIntervalSeconds = initialSkipIntervalSeconds,
        initialRepeatEnabled = initialRepeatEnabled,
        initialAutoplayEnabled = initialAutoplayEnabled,
        onPlaybackSpeedChanged = onPlaybackSpeedChange,
        onSkipIntervalChanged = onSkipIntervalChange,
        onRepeatChanged = onRepeatEnabledChange,
        onAutoplayChanged = onAutoplayEnabledChange,
        resolveNextTrack = { completedTrack ->
            val nextSurah = ALL_SURAHS.firstOrNull { it.id == completedTrack.surahId + 1 }
            val nextAudio = nextSurah?.let { surah ->
                loadSurahAudioOptions(context, surah.id)
                    .firstOrNull { it.reciterName == completedTrack.reciterName }
                    ?: loadSurahAudioOptions(context, surah.id).firstOrNull()
            }
            if (nextSurah != null && nextAudio != null) {
                AudioTrack(
                    surahId = nextSurah.id,
                    surahName = nextSurah.name,
                    surahNameArabic = nextSurah.arabic,
                    ayahNumber = null,
                    reciterName = nextAudio.reciterName,
                    audioUrl = nextAudio.link
                )
            } else {
                null
            }
        }
    )
    val selectReciter: (String, Boolean) -> Unit = { reciterName, startNow ->
        onSelectedReciterNameChange(reciterName)
        val currentTrack = audioPlayer.currentTrack
        if (currentTrack != null) {
            loadSurahAudioOptions(context, currentTrack.surahId)
                .firstOrNull { it.reciterName == reciterName }
                ?.let { audio ->
                    audioPlayer.replaceCurrentTrack(
                        track = currentTrack.copy(
                            reciterName = audio.reciterName,
                            audioUrl = audio.link
                        ),
                        startWhenReady = startNow || audioPlayer.isPlaying || audioPlayer.isPreparing
                    )
                }
        }
    }

    LaunchedEffect(focusIsRunning, focusRemainingSeconds) {
        if (focusIsRunning && focusRemainingSeconds > 0) {
            delay(1000)
            focusRemainingSeconds -= 1
        } else if (focusIsRunning && focusRemainingSeconds == 0) {
            focusIsRunning = false
            focusIsFinished = true
        }
    }

    LaunchedEffect(groupInviteCode, groupInviteToken) {
        if (!groupInviteCode.isNullOrBlank() || !groupInviteToken.isNullOrBlank()) {
            navController.navigate(Screen.Groups.route) {
                launchSingleTop = true
            }
        }
    }

    // Screen titels
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route?.substringBefore('?')

    val screenTitle = when (currentRoute) {
        "dashboard" -> text.dashboard
        "hizb"      -> text.hizbRub
        "juzz"      -> text.juz
        "surahs"    -> text.surah
        "reader"    -> "القرآن الكريم"
        "tafsir"    -> text.t("navigation.tafsir")
        "mutashabihat" -> text.t("navigation.mutashabihat")
        "translation" -> when (appLanguage) {
            "en" -> "Translation"
            "ar" -> "الترجمة"
            "fr" -> "Traduction"
            else -> "Vertaling"
        }
        "book_reader" -> bookMenuStrings(appLanguage).title
        "notes"     -> text.t("navigation.notes")
        "focus"     -> focusStrings(appLanguage).menuTitle
        "groups"    -> text.groups
        "stats"     -> text.stats
        "agenda"    -> text.agenda
        else        -> text.quranTracker
    }
    val appBarTitle = when (currentRoute) {
        Screen.Notifications.route -> com.Ameender.qurantracker.notifications.notificationText(appLanguage, "title")
        Screen.DailyGoal.route -> com.Ameender.qurantracker.notifications.notificationText(appLanguage, "daily")
        Screen.ReadingPlan.route -> readingPlanText(appLanguage, "Mijn leesplan")
        Screen.Reader.route -> text.t("navigation.quranTitle")
        "translation" -> text.t("navigation.translation")
        else -> if (currentRoute?.startsWith("notes/") == true) text.t("navigation.notes") else screenTitle
    }

    val bottomItems = listOf(
        Triple(Screen.Dashboard, Icons.Default.Home,      text.home),
        Triple(Screen.Surahs, Icons.AutoMirrored.Filled.List, text.surah),
        Triple(Screen.Hizb,      Icons.AutoMirrored.Filled.MenuBook,  text.hizb),
        Triple(Screen.Juzz,      Icons.Default.CollectionsBookmark, text.juz),
        Triple(Screen.Reader,    Icons.Default.AutoStories,text.quran),
        Triple(Screen.Groups, Icons.Default.Groups, text.groups),
        Triple(Screen.Stats, Icons.Default.BarChart, text.stats),
    )
    val topLevelRoutes = remember { bottomItems.map { it.first.route }.toSet() }
    val isTopLevelRoute = currentRoute in topLevelRoutes
    val showChrome = !(currentRoute == Screen.Reader.route && readerMode) && !(currentRoute?.startsWith("notes") == true && notesEditorMode)
    val showTopBar = showChrome && !(currentRoute == Screen.Groups.route && groupDetailMode)
    val scrollTopBarAway = currentRoute in setOf(Screen.Reader.route, Screen.Surahs.route) || currentRoute?.startsWith("notes") == true
    val topBarScrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
    LaunchedEffect(currentRoute) {
        topBarScrollBehavior.state.heightOffset = 0f
        topBarScrollBehavior.state.contentOffset = 0f
    }

    fun navigateTopLevel(screen: Screen) {
        navController.navigate(screen.route) {
            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    fun navigateSecondary(screen: Screen) {
        navController.navigate(screen.route) {
            launchSingleTop = true
        }
    }

    fun navigateReader() {
        navController.navigate(Screen.Reader.route) {
            launchSingleTop = true
        }
    }

    fun navigateBackOrHome() {
        if (!navController.popBackStack()) {
            navigateTopLevel(Screen.Dashboard)
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            modifier = if (scrollTopBarAway && showTopBar) Modifier.nestedScroll(topBarScrollBehavior.nestedScrollConnection) else Modifier,
            // ── Top App Bar met hamburger ──
            topBar = {
                if (showTopBar) {
                    androidx.compose.material3.TopAppBar(
                        scrollBehavior = if (scrollTopBarAway) topBarScrollBehavior else null,
                        title = {
                            Text(
                                appBarTitle,
                                style = AppTextStyle.sectionTitle,
                                color = GoldLight
                            )
                        },
                        navigationIcon = {
                            if (isTopLevelRoute) {
                                IconButton(
                                    onClick = { menuOpen = true },
                                    modifier = Modifier.semantics {
                                        contentDescription = text.t("settings.title")
                                    }
                                ) {
                                    Column(
                                        modifier = Modifier.padding(AppSpacing.xs),
                                        verticalArrangement = Arrangement.spacedBy(AppSpacing.xs),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        repeat(3) {
                                            Box(
                                                modifier = Modifier
                                                    .width(AppIcon.menuLineWidth)
                                                    .height(AppIcon.menuLineHeight)
                                                    .background(
                                                        color = Gold,
                                                        shape = RoundedCornerShape(AppShape.xxs)
                                                    )
                                            )
                                        }
                                    }
                                }
                            } else {
                                IconButton(onClick = ::navigateBackOrHome) {
                                    Icon(
                                        Icons.AutoMirrored.Filled.ArrowBack,
                                        contentDescription = text.t("common.back"),
                                        tint = Gold
                                    )
                                }
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(
                            containerColor = DarkNavy,
                            titleContentColor = GoldLight,
                            navigationIconContentColor = Gold
                        )
                    )
                }
            },
            // ── Bottom Navigation ──
            bottomBar = {
                if (showChrome || audioPlayer.isVisible) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        if (audioPlayer.isVisible) {
                            GlobalMiniPlayer(
                                audioPlayer = audioPlayer,
                                text = text,
                                modifier = if (showChrome) Modifier else Modifier.navigationBarsPadding()
                            )
                        }
                        if (showChrome) {
                            NavigationBar(
                                containerColor = DarkNavy,
                                tonalElevation = AppElevation.none
                            ) {
                                val currentDestination = navBackStackEntry?.destination
                                bottomItems.forEach { (screen, icon, label) ->
                                    NavigationBarItem(
                                        icon     = { Icon(icon, contentDescription = label, modifier = Modifier.size(21.dp)) },
                                        label    = { Text(label, fontSize = 10.sp, lineHeight = 12.sp,
                                            maxLines = 1, softWrap = false, overflow = TextOverflow.Ellipsis) },
                                        selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                                        colors = NavigationBarItemDefaults.colors(
                                            selectedIconColor = Gold,
                                            selectedTextColor = Gold,
                                            indicatorColor = TodayDoneSurface,
                                            unselectedIconColor = MutedGold,
                                            unselectedTextColor = MutedGold
                                        ),
                                        onClick  = {
                                            navigateTopLevel(screen)
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        ) { innerPadding ->
            NavHost(
                navController    = navController,
                startDestination = Screen.Dashboard.route,
                modifier         = Modifier.fillMaxSize().padding(innerPadding).consumeWindowInsets(innerPadding)
            ) {
                composable(Screen.Dashboard.route) {
                    DashboardScreen(
                        onOpenReadingPlan = { navigateSecondary(Screen.ReadingPlan) },
                        viewModel = viewModel,
                        goalViewModel = goalViewModel,
                        planningViewModel = planningViewModel,
                        appLanguage = appLanguage,
                        onContinueGoal = { activeGoalSession = it; navigateReader() }
                    )
                }
                composable(Screen.Hizb.route)      {
                    HizbScreen(
                        noteCounts = countsFor(NoteScope.HIZB),
                        onOpenNotes = { openNotes(QuranNoteTarget(NoteScope.HIZB, it)) },
                        viewModel = viewModel,
                        hifzTintEnabled = hifzTintEnabled,
                        appLanguage = appLanguage,
                        onOpenInReader = { hizbNumber, surahId, ayahNumber ->
                            readerBookmarkTarget = ReaderBookmarkSummary(
                                title = "Hizb $hizbNumber",
                                subtitle = text.t("tracker.startAtSurahAyah", surahId, ayahNumber),
                                surahId = surahId,
                                ayahNumber = ayahNumber,
                                openInMushaf = true
                            )
                            navigateReader()
                        }
                    )
                }
                composable(Screen.Juzz.route)      {
                    JuzzScreen(
                        noteCounts = countsFor(NoteScope.JUZ),
                        onOpenNotes = { openNotes(QuranNoteTarget(NoteScope.JUZ, it)) },
                        viewModel = viewModel,
                        hifzTintEnabled = hifzTintEnabled,
                        appLanguage = appLanguage,
                        onOpenInReader = { juzNumber, surahId, ayahNumber ->
                            readerBookmarkTarget = ReaderBookmarkSummary(
                                title = "Juz $juzNumber",
                                subtitle = text.t("tracker.startAtSurahAyah", surahId, ayahNumber),
                                surahId = surahId,
                                ayahNumber = ayahNumber,
                                openInMushaf = true
                            )
                            navigateReader()
                        }
                    )
                }
                composable(Screen.Surahs.route)    {
                    SurahScreen(
                        noteCounts = countsFor(NoteScope.SURAH),
                        onOpenNotes = { openNotes(QuranNoteTarget(NoteScope.SURAH, it)) },
                        onOpenInReader = {
                            readerBookmarkTarget = ReaderBookmarkSummary(title = "Surah $it", subtitle = "", surahId = it, ayahNumber = 1, openInMushaf = true)
                            navigateReader()
                        },
                        viewModel = viewModel,
                        hifzTintEnabled = hifzTintEnabled,
                        appLanguage = appLanguage
                    )
                }
                composable(Screen.Reader.route)    {
                    val target = readerBookmarkTarget
                    Box(modifier = Modifier.fillMaxSize()) {
                        QuranReaderScreen(
                            surahNoteCounts = countsFor(NoteScope.SURAH),
                            onOpenSurahNotes = { openNotes(QuranNoteTarget(NoteScope.SURAH, it)) },
                            onReaderModeChanged = { readerMode = it },
                            mushafMode = mushafMode,
                            initialSurahId = target?.surahId,
                            initialAyah = target?.ayahNumber,
                            initialWarshPage = target?.warshPage,
                            openInitialTargetInMushaf = target?.openInMushaf == true,
                            selectedReciterName = selectedReciterName,
                            appLanguage = appLanguage,
                            audioPlayer = audioPlayer,
                            onOpenNotes = { surah, ayah ->
                                openNotes(QuranNoteTarget(NoteScope.AYAH, surah, ayah))
                            },
                            onInitialTargetConsumed = { readerBookmarkTarget = null }
                        )
                        if (activeGoalSession != null) {
                            FilledTonalButton(onClick = { finishGoalSession = true },
                                modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 80.dp)) {
                                Text(goalText(appLanguage, "Sessie afronden", "Finish session", "إنهاء الجلسة"))
                            }
                        }
                        if (finishGoalSession) {
                            AlertDialog(onDismissRequest = { finishGoalSession = false },
                                text = {
                                    Column(Modifier.verticalScroll(rememberScrollState())) {
                                        GoalHubPanel(goalViewModel, appLanguage, compact = true, onlyGoalId = activeGoalSession)
                                    }
                                },
                                confirmButton = { TextButton(onClick = { finishGoalSession = false; activeGoalSession = null }) {
                                    Text(goalText(appLanguage, "Sluiten", "Close", "إغلاق"))
                                } })
                        }
                    }
                }
                composable(Screen.Tafsir.route)    { TafsirScreen() }
                composable(Screen.Mutashabihat.route) {
                    MutashabihatScreen(
                        appLanguage = appLanguage,
                        onOpenAyah = { surahId, ayahNumber ->
                            readerBookmarkTarget = ReaderBookmarkSummary(
                                title = "Mutashabihat",
                                subtitle = "$surahId:$ayahNumber",
                                surahId = surahId,
                                ayahNumber = ayahNumber,
                                openInMushaf = true
                            )
                            navigateReader()
                        }
                    )
                }
                composable(Screen.Translation.route) { TranslationScreen(appLanguage = appLanguage) }
                composable(Screen.BookReader.route) { BookReaderScreen(appLanguage = appLanguage) }
                composable(Screen.Notes.route)     {
                    AyahNotesScreen(ayahNoteViewModel, appLanguage = appLanguage, onEditorModeChanged = { notesEditorMode = it })
                }
                composable("notes/{scope}/{number}/{ayah}") { entry ->
                    val target = remember(entry) {
                        runCatching {
                            val scope = NoteScope.fromKey(entry.arguments?.getString("scope").orEmpty())
                            QuranNoteTarget(scope, entry.arguments?.getString("number")!!.toInt(),
                                entry.arguments?.getString("ayah")?.toInt()?.takeIf { scope == NoteScope.AYAH }).also { it.validate() }
                        }.getOrNull()
                    }
                    AyahNotesScreen(ayahNoteViewModel, appLanguage = appLanguage,
                        onEditorModeChanged = { notesEditorMode = it }, initialTarget = target)
                }
                composable(Screen.Focus.route)     {
                    FocusSessionScreen(
                        appLanguage = appLanguage,
                        selectedGoalKey = focusGoalKey,
                        selectedMinutes = focusMinutes,
                        remainingSeconds = focusRemainingSeconds,
                        isRunning = focusIsRunning,
                        isFinished = focusIsFinished,
                        onGoalChange = {
                            focusGoalKey = it
                            focusIsFinished = false
                        },
                        onDurationChange = { minutes ->
                            focusMinutes = minutes
                            focusRemainingSeconds = minutes * 60
                            focusIsRunning = false
                            focusIsFinished = false
                        },
                        onToggleRunning = {
                            if (focusIsFinished || focusRemainingSeconds == 0) {
                                focusRemainingSeconds = focusMinutes * 60
                                focusIsFinished = false
                            }
                            focusIsRunning = !focusIsRunning
                        },
                        onReset = {
                            focusIsRunning = false
                            focusIsFinished = false
                            focusRemainingSeconds = focusMinutes * 60
                        },
                        onOpenMushaf = {
                            navigateReader()
                        }
                    )
                }
                composable(
                    route = Screen.Groups.route,
                    deepLinks = listOf(
                        navDeepLink { uriPattern = "${SupabaseConfig.DEEPLINK_SCHEME}://group/{inviteCode}" },
                        navDeepLink { uriPattern = "https://qurantracker.app/group/{inviteCode}" }
                    )
                ) {
                    GroupsSettingsPage(
                        text = text,
                        invitedGroupCode = groupInviteCode,
                        invitedGroupToken = groupInviteToken,
                        onInviteConsumed = onGroupInviteConsumed,
                        onDetailModeChanged = { groupDetailMode = it },
                        onBack = ::navigateBackOrHome
                    )
                }
                composable(Screen.Notifications.route) { NotificationsScreen(language = appLanguage) }
                composable(Screen.DailyGoal.route) {
                    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
                        GoalHubPanel(goalViewModel, appLanguage, onlyGoalId = 1)
                    }
                }
                composable(Screen.ReadingPlan.route) {
                    val history by viewModel.allHistory.collectAsState()
                    ReadingPlanScreen(history = history, language = appLanguage)
                }
                composable(Screen.Stats.route)     { StatsScreen(viewModel, appLanguage = appLanguage) }
                composable(Screen.Agenda.route + "?itemId={itemId}") { entry ->
                    AgendaScreen(
                        planningViewModel = planningViewModel,
                        appLanguage = appLanguage,
                        notificationItemId = entry.arguments?.getString("itemId")?.toIntOrNull(),
                        goalViewModel = goalViewModel,
                        onContinueGoal = { activeGoalSession = it; navigateReader() }
                    )
                }
            }
        }

        HamburgerMenu(
            onNavigateToNotifications = { navigateSecondary(Screen.Notifications) },
            onNavigateToReadingPlan = { navigateSecondary(Screen.ReadingPlan) },
            isOpen           = menuOpen,
            onClose          = { menuOpen = false },
            onNavigateToAgenda = {
                navigateSecondary(Screen.Agenda)
            },
            onNavigateToSurahs = {
                navigateSecondary(Screen.Surahs)
            },
            onNavigateToJuzz = {
                navigateSecondary(Screen.Juzz)
            },
            onNavigateToHizb = {
                navigateTopLevel(Screen.Hizb)
            },
            onNavigateToTafsir = {
                navigateSecondary(Screen.Tafsir)
            },
            onNavigateToMutashabihat = {
                navigateSecondary(Screen.Mutashabihat)
            },
            onNavigateToTranslation = {
                navigateSecondary(Screen.Translation)
            },
            onNavigateToBookReader = {
                navigateSecondary(Screen.BookReader)
            },
            onNavigateToNotes = {
                navigateSecondary(Screen.Notes)
            },
            onNavigateToFocus = {
                navigateSecondary(Screen.Focus)
            },
            onNavigateToGroups = {
                navigateTopLevel(Screen.Groups)
            },
            onNavigateToBookmark = { bookmark ->
                readerBookmarkTarget = bookmark
                navigateReader()
            },
            goalViewModel    = goalViewModel,
            planningViewModel = planningViewModel,
            quranViewModel = viewModel,
            themeMode = themeMode,
            onThemeModeChange = onThemeModeChange,
            hifzTintEnabled = hifzTintEnabled,
            onHifzTintEnabledChange = onHifzTintEnabledChange,
            mushafMode = mushafMode,
            onMushafModeChange = onMushafModeChange,
            appLanguage = appLanguage,
            onAppLanguageChange = onAppLanguageChange,
            selectedReciterName = selectedReciterName,
            onSelectedReciterNameChange = { selectReciter(it, false) },
            onSelectedReciterNameStartNow = { selectReciter(it, true) },
            audioPlayer = audioPlayer
        )
        if (focusIsRunning || (focusRemainingSeconds in 1 until focusMinutes * 60)) {
            FocusFloatingTimer(
                remainingSeconds = focusRemainingSeconds,
                isRunning = focusIsRunning,
                modifier = Modifier.align(Alignment.TopEnd).statusBarsPadding()
                    .padding(top = 62.dp, end = 12.dp)
            )
        }
    }
}
