package com.Ameender.qurantracker

import android.Manifest
import android.content.Intent
import android.os.Bundle
import android.os.Build
import android.content.pm.PackageManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import com.Ameender.qurantracker.data.SupabaseService
import com.Ameender.qurantracker.ui.*
import com.Ameender.qurantracker.viewmodel.GoalViewModel
import com.Ameender.qurantracker.viewmodel.PlanningViewModel
import com.Ameender.qurantracker.viewmodel.QuranViewModel

sealed class Screen(val route: String, val label: String) {
    object Dashboard : Screen("dashboard", "Home")
    object Hizb      : Screen("hizb",      "Hizb")
    object Juzz      : Screen("juzz",      "Juz")
    object Surahs    : Screen("surahs",    "Soera")
    object Reader    : Screen("reader",    "Quran")
    object Stats     : Screen("stats",     "Stats")
    object Agenda    : Screen("agenda",    "Agenda")
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        SupabaseService.handleDeeplinks(intent)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1001)
        }
        scheduleDailyReminder(this, 8, 0)
        setContent {
            val prefs = remember { getSharedPreferences("settings", MODE_PRIVATE) }
            var themeMode by remember {
                mutableStateOf(prefs.getString("theme_mode", "light") ?: "light")
            }
            var hifzTintEnabled by remember {
                mutableStateOf(prefs.getBoolean("hifz_tint_enabled", false))
            }
            var mushafMode by remember {
                mutableStateOf(prefs.getString("mushaf_mode", "hafs") ?: "hafs")
            }
            var appLanguage by remember {
                mutableStateOf(prefs.getString("app_language", "nl") ?: "nl")
            }
            var selectedReciterName by remember {
                mutableStateOf(prefs.getString("selected_reciter_name", "") ?: "")
            }

            QuranTrackerTheme(themeMode = themeMode) {
                QuranTrackerApp(
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
                    }
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        SupabaseService.handleDeeplinks(intent)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuranTrackerApp(
    themeMode: String,
    onThemeModeChange: (String) -> Unit,
    hifzTintEnabled: Boolean,
    onHifzTintEnabledChange: (Boolean) -> Unit,
    mushafMode: String,
    onMushafModeChange: (String) -> Unit,
    appLanguage: String,
    onAppLanguageChange: (String) -> Unit,
    selectedReciterName: String,
    onSelectedReciterNameChange: (String) -> Unit
) {
    val navController       = rememberNavController()
    val viewModel: QuranViewModel       = viewModel()
    val goalViewModel: GoalViewModel    = viewModel()
    val planningViewModel: PlanningViewModel = viewModel()

    var menuOpen by remember { mutableStateOf(false) }
    var readerBookmarkTarget by remember { mutableStateOf<ReaderBookmarkSummary?>(null) }

    // Screen titels
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val screenTitle = when (currentRoute) {
        "dashboard" -> "Dashboard"
        "hizb"      -> "Hizb & Rub"
        "juzz"      -> "Juz"
        "surahs"    -> "Soera"
        "reader"    -> "القرآن الكريم"
        "stats"     -> "Statistieken"
        "agenda"    -> "Agenda"
        else        -> "Quran Tracker"
    }

    val bottomItems = listOf(
        Triple(Screen.Dashboard, Icons.Default.Home,      "Home"),
        Triple(Screen.Hizb,      Icons.Default.MenuBook,  "Hizb"),
        Triple(Screen.Juzz,      Icons.Default.List,      "Juz"),
        Triple(Screen.Surahs,    Icons.Default.Book,      "Soera"),
        Triple(Screen.Reader,    Icons.Default.AutoStories,"Quran"),
        Triple(Screen.Stats,     Icons.Default.BarChart,  "Stats"),
    )

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            // ── Top App Bar met hamburger ──
            topBar = {
                if (currentRoute != Screen.Reader.route) {
                    androidx.compose.material3.TopAppBar(
                        title = {
                            Text(
                                screenTitle,
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Bold,
                                color = GoldLight
                            )
                        },
                        navigationIcon = {
                            IconButton(onClick = { menuOpen = true }) {
                                Column(
                                    modifier = Modifier.padding(4.dp),
                                    verticalArrangement = Arrangement.spacedBy(4.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    repeat(3) {
                                        Box(
                                            modifier = Modifier
                                                .width(20.dp)
                                                .height(2.dp)
                                                .background(
                                                    color = Gold,
                                                    shape = RoundedCornerShape(1.dp)
                                                )
                                        )
                                    }
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
                if (currentRoute != Screen.Reader.route) {
                    NavigationBar(
                        containerColor = DarkNavy,
                        tonalElevation = 0.dp
                    ) {
                        val currentDestination = navBackStackEntry?.destination
                        bottomItems.forEach { (screen, icon, label) ->
                            NavigationBarItem(
                                icon     = { Icon(icon, contentDescription = label) },
                                label    = { Text(label, fontSize = 9.sp) },
                                selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Gold,
                                    selectedTextColor = Gold,
                                    indicatorColor = TodayDoneSurface,
                                    unselectedIconColor = MutedGold,
                                    unselectedTextColor = MutedGold
                                ),
                                onClick  = {
                                    navController.navigate(screen.route) {
                                        popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                        launchSingleTop = true
                                        restoreState    = true
                                    }
                                }
                            )
                        }
                    }
                }
            }
        ) { innerPadding ->
            NavHost(
                navController    = navController,
                startDestination = Screen.Dashboard.route,
                modifier         = Modifier.padding(innerPadding)
            ) {
                composable(Screen.Dashboard.route) {
                    DashboardScreen(
                        viewModel = viewModel,
                        goalViewModel = goalViewModel,
                        planningViewModel = planningViewModel
                    )
                }
                composable(Screen.Hizb.route)      {
                    HizbScreen(
                        viewModel = viewModel,
                        hifzTintEnabled = hifzTintEnabled
                    )
                }
                composable(Screen.Juzz.route)      {
                    JuzzScreen(
                        viewModel = viewModel,
                        hifzTintEnabled = hifzTintEnabled
                    )
                }
                composable(Screen.Surahs.route)    {
                    SurahScreen(
                        viewModel = viewModel,
                        hifzTintEnabled = hifzTintEnabled
                    )
                }
                composable(Screen.Reader.route)    {
                    val target = readerBookmarkTarget
                    QuranReaderScreen(
                        mushafMode = mushafMode,
                        initialSurahId = target?.surahId,
                        initialAyah = target?.ayahNumber,
                        initialWarshPage = target?.warshPage,
                        selectedReciterName = selectedReciterName,
                        onInitialTargetConsumed = { readerBookmarkTarget = null }
                    )
                }
                composable(Screen.Stats.route)     { StatsScreen(viewModel) }
                composable(Screen.Agenda.route) {
                    AgendaScreen(
                        planningViewModel = planningViewModel,
                        onBack = { navController.popBackStack() }
                    )
                }
            }
        }

        // ── Hamburger menu overlay ──
        HamburgerMenu(
            isOpen           = menuOpen,
            onClose          = { menuOpen = false },
            onNavigateToAgenda = {
                navController.navigate(Screen.Agenda.route) {
                    launchSingleTop = true
                }
            },
            onNavigateToSurahs = {
                navController.navigate(Screen.Surahs.route) {
                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                    launchSingleTop = true
                    restoreState = true
                }
            },
            onNavigateToJuzz = {
                navController.navigate(Screen.Juzz.route) {
                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                    launchSingleTop = true
                    restoreState = true
                }
            },
            onNavigateToHizb = {
                navController.navigate(Screen.Hizb.route) {
                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                    launchSingleTop = true
                    restoreState = true
                }
            },
            onNavigateToBookmark = { bookmark ->
                readerBookmarkTarget = bookmark
                navController.navigate(Screen.Reader.route) {
                    launchSingleTop = true
                }
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
            onSelectedReciterNameChange = onSelectedReciterNameChange
        )
    }
}
