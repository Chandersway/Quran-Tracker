package com.Ameender.qurantracker.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// Basis thema: app-achtergrond, kaarten en hoofdkleuren.
var DarkNavy   = Color(0xFFFFFBEA)
var MidNavy    = Color(0xFFFFF7DE)
var Gold       = Color(0xFF2F7D4E)
var GoldLight  = Color(0xFF4A3510)
var ReadBlue   = Color(0xFF3F7E9F)
var MemGold    = Color(0xFF2F7D4E)
var DoneGreen  = Color(0xFF3F7D57)

// Tekstkleuren: subtitels, labels en minder opvallende tekst.
var SoftTextGold = Color(0xFF4A3510)
var LabelGold    = Color(0xFF7D6225)
var MutedGold    = Color(0xFF8A6A24)
var DimGold      = Color(0xFF9A7A3A)
var DarkGold     = Color(0xFF5A3F12)
var InactiveGold = Color(0xFF8C6D2C)
var SoftReadBlue = Color(0xFF2F6683)
var ChevronNavy  = Color(0xFF8A7344)

// Vlakken, borders en statuskleuren voor cards, tegels, dialogs en knoppen.
var ScrimBlack             = Color(0x66000000)
var GoldSurface            = Color(0x1F3F7D57)
var SubtleGoldSurface      = Color(0x143F7D57)
var MediumGoldSurface      = Color(0x263F7D57)
var StrongGoldSurface      = Color(0x333F7D57)
var ReadBlueSurface        = Color(0x223F7E9F)
var StrongReadBlueSurface  = Color(0x443F7E9F)
var DeleteSurface          = Color(0x22B45D42)
var StrongDeleteSurface    = Color(0x66B45D42)
var TodayFocusSurface      = Color(0xFFEAF6DD)
var TodayFocusBorder       = Color(0xFF3F7D57)
var TodayDoneSurface       = Color(0x333F7D57)
var PeriodSurface          = Color(0xFFFFF8E7)
var PeriodItemSurface      = Color(0xFFFFF7DE)
var PeriodAccentSurface    = Color(0x263F7D57)
var HifzDashboardSurface   = Color(0xFFFFF7DE)
var HifzDashboardItem      = Color(0xFFFFF8E7)
var ReviewDueSurface       = Color(0xFFFFE6D8)
var ReviewSoonSurface      = Color(0xFFFFF3D6)
var ReviewLaterSurface     = Color(0xFFEAF6DD)
var BorderNavy             = Color(0xFFE8DEB8)
var ButtonBorderNavy       = Color(0xFFD8CFA8)
var DeepNavy               = Color(0xFFFFFBEA)
var DeleteRed              = Color(0xFFB45D42)

// Grafieken: vaste kleuren voor taartdiagrammen en staafdiagrammen.
var ChartPurple = Color(0xFF8A5E9A)
var ChartCyan   = Color(0xFF478C8C)
var ChartYellow = Color(0xFFD0A93D)
var ChartPink   = Color(0xFFB95D78)
var PieColors = listOf(
    Gold, ReadBlue, DoneGreen, DeleteRed,
    ChartPurple, ChartCyan, ChartYellow, ChartPink,
)

// Hifz-score tinten: 0-10 zwak, 91-100 sterk.
var HifzScoreSurfaces = listOf(
    Color(0x55B3261E),
    Color(0x55D94A1E),
    Color(0x55F06A1C),
    Color(0x55F28E1C),
    Color(0x55E7B51C),
    Color(0x55D2D61F),
    Color(0x55A8C92B),
    Color(0x557DC43A),
    Color(0x554FBF4A),
    Color(0x552FAE5F),
)
var HifzScoreBorders = listOf(
    Color(0xFFB3261E),
    Color(0xFFD94A1E),
    Color(0xFFF06A1C),
    Color(0xFFF28E1C),
    Color(0xFFE7B51C),
    Color(0xFFD2D61F),
    Color(0xFFA8C92B),
    Color(0xFF7DC43A),
    Color(0xFF4FBF4A),
    Color(0xFF2FAE5F),
)

/*
 * Scherm-gids: waar worden deze styles vooral gebruikt?
 *
 * DashboardScreen:
 * - DarkNavy, MidNavy, Gold, GoldLight, DoneGreen, ReadBlue
 * - MutedGold, DimGold, DarkGold, LabelGold
 * - GoldSurface, TodayFocusSurface, TodayFocusBorder, TodayDoneSurface
 * - PeriodSurface, PeriodItemSurface, PeriodAccentSurface, BorderNavy
 * - HifzDashboardSurface, HifzDashboardItem
 * - ReviewDueSurface, ReviewSoonSurface, ReviewLaterSurface
 * - AppSpacing.screen, AppSpacing.card, AppSpacing.compactCard
 * - AppShape.card, AppShape.compactCard
 *
 * JuzzScreen, HizbScreen en SurahScreen:
 * - MidNavy, DeepNavy, Gold, GoldLight, ReadBlue, DoneGreen
 * - MutedGold, DimGold, DarkGold, LabelGold, SoftTextGold
 * - GoldSurface, StrongGoldSurface, ReadBlueSurface, StrongReadBlueSurface
 * - BorderNavy, ButtonBorderNavy, DeleteRed
 * - AppShape.tile, AppShape.control, AppShape.smallControl, AppShape.pill
 *
 * QuranReaderScreen:
 * - DarkNavy, MidNavy, DeepNavy, Gold, GoldLight
 * - SoftTextGold, MutedGold, DimGold
 * - BorderNavy, MediumGoldSurface
 * - AppSpacing.screen, AppSpacing.list, AppSpacing.compactCard
 * - AppShape.tile, AppShape.pill
 *
 * PlanningScreen en HamburgerMenu:
 * - DarkNavy, MidNavy, DeepNavy, Gold, GoldLight, DoneGreen
 * - MutedGold, DimGold, ChevronNavy
 * - GoldSurface, StrongGoldSurface, ScrimBlack, BorderNavy
 * - AppSpacing.screen, AppSpacing.card, AppSpacing.list, AppSpacing.itemVertical
 * - AppShape.largeCard, AppShape.control, AppShape.smallControl, AppShape.chip
 *
 * AgendaScreen:
 * - DarkNavy, MidNavy, DeepNavy, Gold, GoldLight, DoneGreen
 * - SoftTextGold, LabelGold, MutedGold, DimGold
 * - GoldSurface, SubtleGoldSurface, StrongGoldSurface, MediumGoldSurface
 * - BorderNavy, ButtonBorderNavy, DeleteRed, StrongDeleteSurface
 * - AppSpacing.screen, AppSpacing.list, AppSpacing.itemBottom
 * - AppShape.tile, AppShape.control, AppShape.smallControl
 *
 * StatsScreen:
 * - Gold, GoldLight, ReadBlue, DoneGreen, DeleteRed
 * - SoftTextGold, LabelGold, MutedGold, DimGold
 * - DeleteSurface, StrongDeleteSurface, SubtleGoldSurface
 * - PieColors, ChartPurple, ChartCyan, ChartYellow, ChartPink
 * - AppShape.card, AppShape.tile, AppShape.marker, AppShape.bar
 */

// Afstanden die meerdere schermen delen.
object AppSpacing {
    val screen = 16.dp
    val list = 12.dp
    val card = 16.dp
    val compactCard = 14.dp
    val itemVertical = 10.dp
    val itemBottom = 6.dp
}

// Hoeken/vormen die meerdere schermen delen.
object AppShape {
    val largeCard = 14.dp
    val card = 14.dp
    val compactCard = 14.dp
    val tile = 14.dp
    val control = 8.dp
    val smallControl = 8.dp
    val marker = 3.dp
    val bar = 4.dp
    val chip = 20.dp
    val pill = 50.dp
}

// App-breed lettertype: rustig, rond en consistent met het instellingenpaneel.
private val AppTypography = Typography(
    bodyLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 16.sp, fontWeight = FontWeight.Normal),
    bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 14.sp, fontWeight = FontWeight.Normal),
    bodySmall = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 12.sp, fontWeight = FontWeight.Normal),
    titleLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 20.sp, fontWeight = FontWeight.Bold),
    titleMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 16.sp, fontWeight = FontWeight.Bold),
    titleSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 14.sp, fontWeight = FontWeight.Bold),
    labelLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 14.sp, fontWeight = FontWeight.Bold),
    labelMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 12.sp, fontWeight = FontWeight.Medium),
    labelSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 10.sp, fontWeight = FontWeight.Medium),
)

// QuranReaderScreen: full-screen mushaf overlay maten en vormen.
object ReaderOverlayStyle {
    val edgePadding = 10.dp
    val audioPadding = 18.dp
    val menuButton = 42.dp
    val audioButton = 44.dp
    val bookmarkButton = 34.dp
    val roundButton = 22.dp
    val overlayAlpha = 0.62f
    val audioAlpha = 0.72f
}

// QuranReaderScreen: zoekveld en zoekresultaten in de soera-lijst.
object ReaderSearchStyle {
    val maxResultsHeight = 320.dp
    val resultPreviewLines = 2
}

// QuranReaderScreen: ayah-info, i'rab en woord-voor-woord dialogen.
object ReaderInfoStyle {
    val dialogMaxHeight = 420.dp
    val wordChipMinWidth = 74.dp
    val actionButtonHeight = 58.dp
    val warshPageRatio = 1.4716763f
    val hafsMadinaPageRatio = 1.4555556f
    val warshDebugHighlightAlpha = 0.14f
    val warshSelectedAlpha = 0.20f
    val warshSelectedBorderAlpha = 0.32f
}

// AgendaScreen: khatma planner blok in het toevoegen-menu.
object AgendaKhatmaStyle {
    val previewMaxItems = 4
    val plannerButtonHeight = 42.dp
}

// HamburgerMenu: instellingen-paneel in mushaf-stijl.
object SettingsMenuStyle {
    val panelWidth = 318.dp
    val cardRadius = 14.dp
    val rowHeight = 64.dp
    val iconSize = 24.dp
    val choiceHeight = 46.dp
    val innerPadding = 14.dp
    val sectionGap = 10.dp
}

// Compose Material theme voor de hele app.
@Composable
fun QuranTrackerTheme(themeMode: String = "light", content: @Composable () -> Unit) {
    applyThemeColors(themeMode)
    val scheme = if (themeMode == "dark") {
        darkColorScheme(
            primary      = Gold,
            onPrimary    = DarkNavy,
            background   = DarkNavy,
            surface      = MidNavy,
            onBackground = SoftTextGold,
            onSurface    = SoftTextGold,
            secondary    = ReadBlue,
            tertiary     = DoneGreen,
        )
    } else {
        lightColorScheme(
            primary      = Gold,
            onPrimary    = SoftTextGold,
            background   = DarkNavy,
            surface      = MidNavy,
            onBackground = SoftTextGold,
            onSurface    = SoftTextGold,
            secondary    = ReadBlue,
            tertiary     = DoneGreen,
        )
    }

    MaterialTheme(
        colorScheme = scheme,
        typography = AppTypography,
        content = content
    )
}

fun applyThemeColors(themeMode: String) {
    if (themeMode == "dark") {
        DarkNavy = Color(0xFF0A1628)
        MidNavy = Color(0xFF112240)
        Gold = Color(0xFFC9A84C)
        GoldLight = Color(0xFFF0D080)
        ReadBlue = Color(0xFF4A9EFF)
        MemGold = Color(0xFFC9A84C)
        DoneGreen = Color(0xFF4CAF82)

        SoftTextGold = Color(0xFFE8D5A3)
        LabelGold = Color(0xFFA89060)
        MutedGold = Color(0xFF7A6540)
        DimGold = Color(0xFF5A4A30)
        DarkGold = Color(0xFF4A3A20)
        InactiveGold = Color(0xFF6A5430)
        SoftReadBlue = Color(0xFF9BBFE8)
        ChevronNavy = Color(0xFF3A4A5A)

        ScrimBlack = Color(0x88000000)
        GoldSurface = Color(0x20C9A84C)
        SubtleGoldSurface = Color(0x15C9A84C)
        MediumGoldSurface = Color(0x33C9A84C)
        StrongGoldSurface = Color(0x40C9A84C)
        ReadBlueSurface = Color(0x144A9EFF)
        StrongReadBlueSurface = Color(0x334A9EFF)
        DeleteSurface = Color(0x33E87C5A)
        StrongDeleteSurface = Color(0x66E87C5A)
        TodayFocusSurface = Color(0xFF172B45)
        TodayFocusBorder = Color(0xFFC9A84C)
        TodayDoneSurface = Color(0x334CAF82)
        PeriodSurface = Color(0xFF112240)
        PeriodItemSurface = Color(0xFF0D1F35)
        PeriodAccentSurface = Color(0x33C9A84C)
        HifzDashboardSurface = Color(0xFF132A3D)
        HifzDashboardItem = Color(0xFF0D1F35)
        ReviewDueSurface = Color(0xFF3A1F1B)
        ReviewSoonSurface = Color(0xFF332A17)
        ReviewLaterSurface = Color(0xFF1C3325)
        BorderNavy = Color(0xFF1E3050)
        ButtonBorderNavy = Color(0xFF2A3A4A)
        DeepNavy = Color(0xFF0D1F35)
        DeleteRed = Color(0xFFE87C5A)

        ChartPurple = Color(0xFFB87CC9)
        ChartCyan = Color(0xFF5AC9C9)
        ChartYellow = Color(0xFFE8C95A)
        ChartPink = Color(0xFFE85A8A)

        HifzScoreSurfaces = listOf(
            Color(0x66E53935),
            Color(0x66F4511E),
            Color(0x66FB6D1E),
            Color(0x66FB8C00),
            Color(0x66FDD835),
            Color(0x66D6D93B),
            Color(0x66AED93B),
            Color(0x667ECF4A),
            Color(0x6657C76B),
            Color(0x663DC17A),
        )
        HifzScoreBorders = listOf(
            Color(0xFFE53935),
            Color(0xFFF4511E),
            Color(0xFFFB6D1E),
            Color(0xFFFB8C00),
            Color(0xFFFDD835),
            Color(0xFFD6D93B),
            Color(0xFFAED93B),
            Color(0xFF7ECF4A),
            Color(0xFF57C76B),
            Color(0xFF3DC17A),
        )
    } else {
        DarkNavy = Color(0xFFFFFBEA)
        MidNavy = Color(0xFFFFF7DE)
        Gold = Color(0xFF2F7D4E)
        GoldLight = Color(0xFF4A3510)
        ReadBlue = Color(0xFF3F7E9F)
        MemGold = Color(0xFF2F7D4E)
        DoneGreen = Color(0xFF3F7D57)

        SoftTextGold = Color(0xFF4A3510)
        LabelGold = Color(0xFF7D6225)
        MutedGold = Color(0xFF8A6A24)
        DimGold = Color(0xFF9A7A3A)
        DarkGold = Color(0xFF5A3F12)
        InactiveGold = Color(0xFF8C6D2C)
        SoftReadBlue = Color(0xFF2F6683)
        ChevronNavy = Color(0xFF8A7344)

        ScrimBlack = Color(0x66000000)
        GoldSurface = Color(0x1F3F7D57)
        SubtleGoldSurface = Color(0x143F7D57)
        MediumGoldSurface = Color(0x263F7D57)
        StrongGoldSurface = Color(0x333F7D57)
        ReadBlueSurface = Color(0x223F7E9F)
        StrongReadBlueSurface = Color(0x443F7E9F)
        DeleteSurface = Color(0x22B45D42)
        StrongDeleteSurface = Color(0x66B45D42)
        TodayFocusSurface = Color(0xFFEAF6DD)
        TodayFocusBorder = Color(0xFF3F7D57)
        TodayDoneSurface = Color(0x333F7D57)
        PeriodSurface = Color(0xFFFFF8E7)
        PeriodItemSurface = Color(0xFFFFF7DE)
        PeriodAccentSurface = Color(0x263F7D57)
        HifzDashboardSurface = Color(0xFFFFF7DE)
        HifzDashboardItem = Color(0xFFFFF8E7)
        ReviewDueSurface = Color(0xFFFFE6D8)
        ReviewSoonSurface = Color(0xFFFFF3D6)
        ReviewLaterSurface = Color(0xFFEAF6DD)
        BorderNavy = Color(0xFFE8DEB8)
        ButtonBorderNavy = Color(0xFFD8CFA8)
        DeepNavy = Color(0xFFFFFBEA)
        DeleteRed = Color(0xFFB45D42)

        ChartPurple = Color(0xFF8A5E9A)
        ChartCyan = Color(0xFF478C8C)
        ChartYellow = Color(0xFFD0A93D)
        ChartPink = Color(0xFFB95D78)

        HifzScoreSurfaces = listOf(
            Color(0x55B3261E),
            Color(0x55D94A1E),
            Color(0x55F06A1C),
            Color(0x55F28E1C),
            Color(0x55E7B51C),
            Color(0x55D2D61F),
            Color(0x55A8C92B),
            Color(0x557DC43A),
            Color(0x554FBF4A),
            Color(0x552FAE5F),
        )
        HifzScoreBorders = listOf(
            Color(0xFFB3261E),
            Color(0xFFD94A1E),
            Color(0xFFF06A1C),
            Color(0xFFF28E1C),
            Color(0xFFE7B51C),
            Color(0xFFD2D61F),
            Color(0xFFA8C92B),
            Color(0xFF7DC43A),
            Color(0xFF4FBF4A),
            Color(0xFF2FAE5F),
        )
    }

    PieColors = listOf(
        Gold, ReadBlue, DoneGreen, DeleteRed,
        ChartPurple, ChartCyan, ChartYellow, ChartPink,
    )
}

fun hifzScoreBucket(score: Int): Int {
    val safeScore = score.coerceIn(0, 100)
    return when (safeScore) {
        in 0..10 -> 0
        in 11..20 -> 1
        in 21..30 -> 2
        in 31..40 -> 3
        in 41..50 -> 4
        in 51..60 -> 5
        in 61..70 -> 6
        in 71..80 -> 7
        in 81..90 -> 8
        else -> 9
    }
}

fun hifzScoreSurface(score: Int): Color = HifzScoreSurfaces[hifzScoreBucket(score)]

fun hifzScoreBorder(score: Int): Color = HifzScoreBorders[hifzScoreBucket(score)]
